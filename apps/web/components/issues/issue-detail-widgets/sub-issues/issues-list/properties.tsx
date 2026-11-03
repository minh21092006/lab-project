/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { SyntheticEvent } from "react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useMember } from "@/hooks/store/use-member";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { DueDateOutline, StartDateOutline } from "@makeplane/propel/icons";
import type { DateRangeValue } from "@plane/blocks/property-select";
import { DateRangeSelect, DateSelect } from "@plane/blocks/property-select";
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  parentIssueId: string;
  issueId: string;
  canEdit: boolean;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>
  ) => Promise<void>;
  displayProperties?: IIssueDisplayProperties;
  issue: TIssue;
};

export const SubIssuesListItemProperties = observer(function SubIssuesListItemProperties(props: Props) {
  const { workspaceSlug, parentIssueId, issueId, canEdit, updateSubIssue, displayProperties, issue } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
  const { getUserDetails } = useMember();
  const [pendingAssigneeAction, setPendingAssigneeAction] = useState<{
    ids: string[];
    type: "add" | "remove";
    memberNames: string;
  } | null>(null);

  const handleAssigneeChange = (val: string[]) => {
    const current = issue?.assignee_ids ?? [];
    const added = val.filter((id) => !current.includes(id));
    const removed = current.filter((id) => !val.includes(id));

    if (added.length > 0) {
      const names = added
        .map((id) => getUserDetails(id)?.display_name || "member")
        .join(", ");
      setPendingAssigneeAction({ ids: val, type: "add", memberNames: names });
    } else if (removed.length > 0) {
      const names = removed
        .map((id) => getUserDetails(id)?.display_name || "member")
        .join(", ");
      setPendingAssigneeAction({ ids: val, type: "remove", memberNames: names });
    }
  };

  const handleConfirmAssignment = async () => {
    if (!pendingAssigneeAction || !issue.project_id) return;
    const { ids, type, memberNames } = pendingAssigneeAction;
    try {
      await updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
        assignee_ids: ids,
      });
      if (type === "add") {
        setToast({
          type: "success",
          title: "Assignee added",
          message: `Assigned ${memberNames} and notification sent.`,
        });
      } else {
        setToast({
          type: "success",
          title: "Assignee removed",
          message: `Removed ${memberNames} from work item.`,
        });
      }
    } catch {
      setToast({
        type: "error",
        title: "Error",
        message: `Failed to ${type === "add" ? "assign" : "remove"} assignee. Please try again.`,
      });
    } finally {
      setPendingAssigneeAction(null);
    }
  };

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleStartDate = (date: Date | null) => {
    if (issue.project_id) {
      updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
        start_date: date ? renderFormattedPayloadDate(date) : null,
      });
    }
  };

  const handleTargetDate = (date: Date | null) => {
    if (issue.project_id) {
      updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
        target_date: date ? renderFormattedPayloadDate(date) : null,
      });
    }
  };

  const handleDateRangeUpdate = (range: DateRangeValue) => {
    if (issue.project_id) {
      updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
        start_date: range.from ? renderFormattedPayloadDate(range.from) : null,
        target_date: range.to ? renderFormattedPayloadDate(range.to) : null,
      });
    }
  };

  //derived values
  const stateDetails = useMemo(() => getStateById(issue.state_id), [getStateById, issue.state_id]);
  const shouldHighlight = useMemo(
    () => shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
    [issue.target_date, stateDetails?.group]
  );
  // date range is enabled only when both dates are available and both dates are enabled
  const isDateRangeEnabled: boolean = Boolean(
    issue.start_date && issue.target_date && displayProperties?.start_date && displayProperties?.due_date
  );

  if (!displayProperties) return <></>;

  const maxDate = getDate(issue.target_date);
  const minDate = getDate(issue.start_date);

  return (
    <>
      <div onClick={handleEventPropagation} onKeyDown={(e) => e.stopPropagation()}>
        <ConfirmDialog
          isOpen={Boolean(pendingAssigneeAction)}
          handleClose={() => setPendingAssigneeAction(null)}
          handleSubmit={handleConfirmAssignment}
          variant={pendingAssigneeAction?.type === "remove" ? "danger" : "primary"}
          title={
            pendingAssigneeAction?.type === "remove"
              ? "Confirm Remove Assignee"
              : "Confirm Work Item Assignment"
          }
          content={
            <div className="space-y-2 text-13 text-secondary">
              <p>
                Are you sure you want to{" "}
                {pendingAssigneeAction?.type === "remove" ? "remove " : "assign "}
                <strong className="text-primary font-semibold">
                  {pendingAssigneeAction?.memberNames}
                </strong>{" "}
                {pendingAssigneeAction?.type === "remove" ? "from" : "to"} work item{" "}
                <span className="font-semibold text-primary">{issue.name}</span>?
              </p>
              {pendingAssigneeAction?.type === "add" && (
                <p className="text-12 text-tertiary">
                  An email notification will be delivered to their registered email address.
                </p>
              )}
            </div>
          }
          primaryButtonText={
            pendingAssigneeAction?.type === "remove"
              ? { loading: "Removing...", default: "Remove Assignee" }
              : { loading: "Assigning...", default: "Assign & Notify" }
          }
          secondaryButtonText="Cancel"
        />
      </div>
      <div className="relative flex items-center gap-2">
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <StateSelect
          value={issue.state_id}
          projectId={issue.project_id ?? undefined}
          onChange={(val) =>
            issue.project_id &&
            updateSubIssue(
              workspaceSlug,
              issue.project_id,
              parentIssueId,
              issueId,
              {
                state_id: val,
              },
              { ...issue }
            )
          }
          disabled={!canEdit}
          variant="pill-sm"
          tooltip
        />
      </WithDisplayPropertiesHOC>

      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <PrioritySelect
          value={issue.priority}
          onChange={(val) =>
            issue.project_id &&
            updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              priority: val,
            })
          }
          disabled={!canEdit}
          variant="pill-sm"
          tooltip
        />
      </WithDisplayPropertiesHOC>

      {/* merged dates */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey={["start_date", "due_date"]}
        shouldRenderProperty={() => isDateRangeEnabled}
      >
        <div role="presentation" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateRangeSelect
            value={{
              from: getDate(issue.start_date) ?? null,
              to: getDate(issue.target_date) ?? null,
            }}
            onChange={handleDateRangeUpdate}
            icon={<StartDateOutline />}
            clearable
            className={cn({ "text-danger-primary": shouldHighlight })}
            disabled={!canEdit}
            showTooltip
            tooltipHeading={t("project_cycles.date_range")}
            weekStartsOn={userProfile?.start_of_the_week}
            mergeDates
            side="top"
            align="end"
            variant="pill-sm"
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="start_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <DateSelect
          value={getDate(issue.start_date) ?? null}
          onChange={handleStartDate}
          maxDate={maxDate}
          placeholder={t("common.order_by.start_date")}
          icon={<StartDateOutline />}
          clearable
          disabled={!canEdit}
          showTooltip
          tooltipHeading={t("common.order_by.start_date")}
          weekStartsOn={userProfile?.start_of_the_week}
          side="top"
          align="end"
          variant="pill-sm"
        />
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="due_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <DateSelect
          value={getDate(issue?.target_date) ?? null}
          onChange={handleTargetDate}
          minDate={minDate}
          placeholder={t("common.order_by.due_date")}
          icon={<DueDateOutline />}
          className={cn({ "text-danger-primary": shouldHighlight })}
          clearable
          disabled={!canEdit}
          showTooltip
          tooltipHeading={t("common.order_by.due_date")}
          weekStartsOn={userProfile?.start_of_the_week}
          side="top"
          align="end"
          variant="pill-sm"
        />
      </WithDisplayPropertiesHOC>

      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <MemberSelect
          value={issue.assignee_ids ?? []}
          projectId={issue.project_id ?? undefined}
          onChange={handleAssigneeChange}
          disabled={!canEdit}
          multiple
          variant={issue.assignee_ids?.length ? "avatar-group-sm" : "pill-sm"}
          tooltip={{ heading: t("common.assignees") }}
        />
      </WithDisplayPropertiesHOC>
    </div>
    </>
  );
});
