"use client";

import { useActionState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/lib/actions/reports";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function CommentForm({ reportId }: { reportId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(addComment, null);
  useActionFeedback(state, { onSuccess: () => formRef.current?.reset() });

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="reportId" value={reportId} />
      <div className="space-y-2">
        <Label htmlFor="body" className="sr-only">
          Comment
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={3}
          required
          maxLength={2000}
          placeholder="Write a message about this case"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "body-error" : undefined}
        />
        <FieldError id="body-error" message={errors.body} />
      </div>
      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}
      <div className="flex justify-end">
        <SubmitButton>Post comment</SubmitButton>
      </div>
    </form>
  );
}
