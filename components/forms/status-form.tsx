"use client";

import { useActionState, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateReportStatus } from "@/lib/actions/reports";
import {
  REPORT_STATUSES,
  STATUS_META,
  type ReportStatus,
} from "@/lib/constants";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

/**
 * Admin status change with an optional comment posted in the same
 * submission (§7.3). The select is controlled and the value travels in a
 * hidden input, so the current status is always displayed and submitted
 * even when the control is never opened.
 */
export function StatusForm({
  reportId,
  currentStatus,
}: {
  reportId: number;
  currentStatus: ReportStatus;
}) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [state, formAction] = useActionState(updateReportStatus, null);
  useActionFeedback(state);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ReportStatus)}
        >
          <SelectTrigger
            id="status"
            className="w-full"
            aria-invalid={errors.status ? true : undefined}
          >
            <SelectValue>{STATUS_META[status].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {REPORT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_META[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="status-error" message={errors.status} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status-comment">
          Comment <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Textarea
          id="status-comment"
          name="comment"
          rows={3}
          maxLength={2000}
          placeholder="Add context for the reporter"
          aria-invalid={errors.comment ? true : undefined}
          aria-describedby={errors.comment ? "status-comment-error" : undefined}
        />
        <FieldError id="status-comment-error" message={errors.comment} />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Change status</SubmitButton>
    </form>
  );
}
