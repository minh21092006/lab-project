# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
from datetime import timedelta
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone

from plane.db.models import Issue, IssueAssignee
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception
from plane.settings.redis import redis_instance
from plane.bgtasks.issue_assignment_task import get_user_display_name, get_base_url, PRIORITY_MAP

logger = logging.getLogger("plane.worker")


@shared_task
def send_deadline_reminders(current_site=None):
    """
    Checks for active work items with upcoming target dates (within next 48 hours)
    and sends reminder emails to their assignees.
    """
    try:
        today = timezone.now().date()
        upcoming = today + timedelta(days=2)

        # Active issues approaching deadline
        issues = (
            Issue.objects.filter(
                target_date__isnull=False,
                target_date__gte=today,
                target_date__lte=upcoming,
                state__group__in=["backlog", "unstarted", "started"],
            )
            .select_related("project", "project__workspace", "state")
        )

        if not issues.exists():
            logger.info("[DeadlineReminder] No upcoming deadlines found to remind.")
            return 0

        ri = redis_instance()
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )

        sent_count = 0
        for issue in issues:
            project = issue.project
            workspace = project.workspace
            base_url = get_base_url(issue.id, current_site)
            issue_url = f"{base_url}/{workspace.slug}/projects/{project.id}/issues/{issue.id}"
            issue_identifier = f"{project.identifier}-{issue.sequence_id}"
            priority_display = PRIORITY_MAP.get(issue.priority or "none", issue.priority or "None")
            state_display = issue.state.name if issue.state else "In Progress"
            target_date_display = issue.target_date.strftime("%b %d, %Y")

            assignee_relations = IssueAssignee.objects.filter(issue=issue).select_related("assignee")
            for rel in assignee_relations:
                assignee = rel.assignee
                if not assignee or not assignee.email:
                    continue

                # Deduplicate: only send once per user per issue per day
                cache_key = f"deadline_reminder_{issue.id}_{assignee.id}_{today}"
                if ri.get(cache_key):
                    continue

                assignee_name = get_user_display_name(assignee)
                subject = f"[{issue_identifier}] Reminder: Target date is approaching ({target_date_display})"

                context = {
                    "assignee_name": assignee_name,
                    "assignee_email": assignee.email,
                    "issue_name": issue.name,
                    "issue_identifier": issue_identifier,
                    "project_name": project.name,
                    "workspace_name": workspace.name,
                    "priority": priority_display,
                    "state": state_display,
                    "target_date": target_date_display,
                    "issue_url": issue_url,
                    "current_site": base_url,
                }

                html_content = render_to_string("emails/notifications/issue_deadline_reminder.html", context)
                text_content = generate_plain_text_from_html(html_content)

                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=EMAIL_FROM,
                    to=[assignee.email],
                    connection=connection,
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()

                ri.set(cache_key, "1", ex=86400)
                sent_count += 1
                logger.info(f"[DeadlineReminder] Sent reminder to {assignee.email} for {issue_identifier}")

        logger.info(f"[DeadlineReminder] Processed all deadlines. Total sent: {sent_count}")
        return sent_count
    except Exception as e:
        log_exception(e)
        logger.error(f"[DeadlineReminder] Failed to send deadline reminders: {e}")
        return 0

