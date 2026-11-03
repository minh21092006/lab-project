# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone

from plane.db.models import Issue, User, IssueAssignee, EmailNotificationLog
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception
from plane.settings.redis import redis_instance

logger = logging.getLogger("plane.worker")

PRIORITY_MAP = {
    "urgent": "Urgent",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
    "none": "None",
}


def get_user_display_name(user):
    """
    Returns a friendly human name instead of email prefix/username.
    """
    if not user:
        return "Someone"
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    if full_name:
        return full_name
    if user.first_name:
        return user.first_name
    if user.display_name and not user.display_name.startswith(user.email.split("@")[0]):
        return user.display_name
    return user.email.split("@")[0]


def get_public_avatar(user):
    """
    Returns public HTTPS avatar if available and not localhost.
    Avoids broken image icon in email clients.
    """
    if user and user.avatar and user.avatar.startswith("https://"):
        if "localhost" not in user.avatar and "127.0.0.1" not in user.avatar:
            return user.avatar
    return None


def get_base_url(issue_id, current_site=None):
    if not current_site:
        try:
            ri = redis_instance()
            cached_origin = ri.get(str(issue_id))
            if cached_origin:
                current_site = cached_origin.decode("utf-8")
        except Exception:
            pass
    if not current_site:
        current_site = getattr(settings, "WEB_URL", "http://localhost")
    return current_site.rstrip("/")


@shared_task
def send_issue_assignment_email(issue_id, assignee_id, actor_id=None, current_site=None):
    """
    Sends an immediate dedicated email notification when a user is assigned to a work item.
    Includes active assignment check and anti-spam Redis cooldown to prevent repeated notification spam.
    """
    try:
        # 1. Anti-spam: Check if assignee is STILL actively assigned to the issue
        if not IssueAssignee.objects.filter(issue_id=issue_id, assignee_id=assignee_id).exists():
            logger.info(
                f"[AssignmentEmail] Assignee {assignee_id} is no longer assigned to issue {issue_id}. Skipping email to prevent spam."
            )
            return False

        # 2. Anti-spam: Redis cooldown (5 minutes / 300 seconds)
        ri = redis_instance()
        cooldown_key = f"assignment_email_cooldown_{issue_id}_{assignee_id}"
        if ri and ri.get(cooldown_key):
            logger.info(
                f"[AssignmentEmail] Anti-spam: Assignment email was already sent recently to {assignee_id} for issue {issue_id}. Skipping duplicate email."
            )
            return False

        assignee = User.objects.filter(pk=assignee_id).first()
        if not assignee or not assignee.email:
            logger.warning(f"[AssignmentEmail] Assignee {assignee_id} not found or has no email.")
            return False

        issue = (
            Issue.objects.select_related("project", "project__workspace", "state")
            .filter(pk=issue_id)
            .first()
        )
        if not issue:
            logger.warning(f"[AssignmentEmail] Issue {issue_id} not found.")
            return False

        actor = User.objects.filter(pk=actor_id).first() if actor_id else None
        assigner_name = get_user_display_name(actor) if actor else "Workspace Admin"
        assignee_name = get_user_display_name(assignee)

        project = issue.project
        workspace = project.workspace

        current_site = get_base_url(issue_id, current_site)
        issue_url = f"{current_site}/{workspace.slug}/projects/{project.id}/issues/{issue.id}"

        issue_identifier = f"{project.identifier}-{issue.sequence_id}"
        priority_display = PRIORITY_MAP.get(issue.priority or "none", issue.priority or "None")
        state_display = issue.state.name if issue.state else "Backlog"
        target_date_display = (
            issue.target_date.strftime("%b %d, %Y")
            if issue.target_date
            else "None"
        )

        subject = f"[{issue_identifier}] You've been assigned to: {issue.name}"

        assigner_avatar = get_public_avatar(actor)
        assigner_initial = (assigner_name or "A")[0].upper()

        context = {
            "assignee_name": assignee_name,
            "assignee_email": assignee.email,
            "assigner_name": assigner_name,
            "assigner_avatar": assigner_avatar,
            "assigner_initial": assigner_initial,
            "issue_name": issue.name,
            "issue_identifier": issue_identifier,
            "project_name": project.name,
            "workspace_name": workspace.name,
            "priority": priority_display,
            "state": state_display,
            "target_date": target_date_display,
            "issue_url": issue_url,
            "current_site": current_site,
        }

        html_content = render_to_string("emails/notifications/issue_assigned.html", context)
        text_content = generate_plain_text_from_html(html_content)

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

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[assignee.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        # Set anti-spam cooldown in Redis (5 minutes)
        if ri:
            try:
                ri.set(cooldown_key, "1", ex=300)
            except Exception:
                pass

        logger.info(
            f"[AssignmentEmail] Email sent successfully to {assignee.email} for issue {issue_identifier}"
        )

        # Mark or create EmailNotificationLog to avoid redundant Celery Beat batch emails
        try:
            updated = EmailNotificationLog.objects.filter(
                receiver=assignee,
                entity_identifier=issue.id,
                entity_name="issue",
            ).update(sent_at=timezone.now())

            if not updated and actor:
                EmailNotificationLog.objects.create(
                    receiver=assignee,
                    triggered_by=actor,
                    entity_identifier=issue.id,
                    entity_name="issue",
                    entity="issue",
                    new_value=assignee.display_name or assignee.email,
                    processed_at=timezone.now(),
                    sent_at=timezone.now(),
                )
        except Exception as log_err:
            logger.warning(f"[AssignmentEmail] Could not update EmailNotificationLog: {log_err}")

        return True
    except Exception as e:
        log_exception(e)
        logger.error(f"[AssignmentEmail] Failed to send assignment email: {e}")
        return False


@shared_task
def send_issue_priority_email(issue_id, actor_id=None, old_priority="none", new_priority="none", current_site=None):
    """
    Sends an email notification to assignees when issue priority is changed.
    """
    try:
        issue = (
            Issue.objects.select_related("project", "project__workspace", "state")
            .filter(pk=issue_id)
            .first()
        )
        if not issue:
            return False

        actor = User.objects.filter(pk=actor_id).first() if actor_id else None
        actor_name = get_user_display_name(actor) if actor else "Workspace Admin"

        project = issue.project
        workspace = project.workspace

        current_site = get_base_url(issue_id, current_site)
        issue_url = f"{current_site}/{workspace.slug}/projects/{project.id}/issues/{issue.id}"

        issue_identifier = f"{project.identifier}-{issue.sequence_id}"
        old_p_display = PRIORITY_MAP.get(old_priority or "none", old_priority or "None")
        new_p_display = PRIORITY_MAP.get(new_priority or "none", new_priority or "None")
        state_display = issue.state.name if issue.state else "Backlog"
        target_date_display = (
            issue.target_date.strftime("%b %d, %Y")
            if issue.target_date
            else "None"
        )

        subject = f"[{issue_identifier}] Priority changed to {new_p_display}"

        # Get all assignees except the actor
        assignee_relations = IssueAssignee.objects.filter(issue_id=issue_id).select_related("assignee")
        recipients = [
            rel.assignee
            for rel in assignee_relations
            if rel.assignee and rel.assignee.email and (actor is None or rel.assignee_id != actor.id)
        ]

        if not recipients:
            return True

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

        for recipient in recipients:
            assignee_name = get_user_display_name(recipient)
            context = {
                "assignee_name": assignee_name,
                "assignee_email": recipient.email,
                "actor_name": actor_name,
                "issue_name": issue.name,
                "issue_identifier": issue_identifier,
                "project_name": project.name,
                "workspace_name": workspace.name,
                "old_priority": old_p_display,
                "new_priority": new_p_display,
                "state": state_display,
                "target_date": target_date_display,
                "issue_url": issue_url,
                "current_site": current_site,
            }

            html_content = render_to_string("emails/notifications/issue_priority_changed.html", context)
            text_content = generate_plain_text_from_html(html_content)

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=EMAIL_FROM,
                to=[recipient.email],
                connection=connection,
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            logger.info(f"[PriorityEmail] Priority email sent to {recipient.email} for {issue_identifier}")

        return True
    except Exception as e:
        log_exception(e)
        logger.error(f"[PriorityEmail] Failed to send priority email: {e}")
        return False
