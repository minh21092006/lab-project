/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useMember } from "@/hooks/store/use-member";
// types
import type { TIssue } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn = observer(function SpreadsheetAssigneeColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  const { getUserDetails } = useMember();
  const [pendingAssigneeAction, setPendingAssigneeAction] = useState<{
    ids: string[];
    type: "add" | "remove";
    memberNames: string;
  } | null>(null);

  const handleAssigneeChange = (data: string[]) => {
    const current = issue?.assignee_ids ?? [];
    const added = data.filter((id) => !current.includes(id));
    const removed = current.filter((id) => !data.includes(id));

    if (added.length > 0) {
      const names = added
        .map((id) => getUserDetails(id)?.display_name || "member")
        .join(", ");
      setPendingAssigneeAction({ ids: data, type: "add", memberNames: names });
    } else if (removed.length > 0) {
      const names = removed
        .map((id) => getUserDetails(id)?.display_name || "member")
        .join(", ");
      setPendingAssigneeAction({ ids: data, type: "remove", memberNames: names });
    }
  };

  const handleConfirmAssignment = () => {
    if (!pendingAssigneeAction) return;
    const { ids, type, memberNames } = pendingAssigneeAction;
    try {
      onChange(
        issue,
        { assignee_ids: ids },
        {
          changed_property: "assignees",
          change_details: ids,
        }
      );
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

  return (
    <>
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
      <div className="h-11 border-b-[0.5px] border-subtle">
        <MemberSelect
          value={issue?.assignee_ids ?? []}
          onChange={handleAssigneeChange}
          projectId={issue?.project_id ?? undefined}
          disabled={disabled}
          multiple
          placeholder="Assignees"
          // `.clickable` is what the table's keyboard navigation clicks on Enter / Space in a focused cell.
          className="clickable"
          variant="table-cell"
          onClose={onClose}
        />
      </div>
    </>
  );
});
