"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement } from "@/lib/actions/announcements";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function AnnouncementForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createAnnouncement, null);
  useActionFeedback(state, { onSuccess: () => formRef.current?.reset() });

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="announcement-title">Title</Label>
        <Input
          id="announcement-title"
          name="title"
          required
          minLength={5}
          maxLength={150}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "announcement-title-error" : undefined}
        />
        <FieldError id="announcement-title-error" message={errors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="announcement-body">Body</Label>
        <Textarea
          id="announcement-body"
          name="body"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "announcement-body-error" : undefined}
        />
        <FieldError id="announcement-body-error" message={errors.body} />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Publish announcement</SubmitButton>
    </form>
  );
}
