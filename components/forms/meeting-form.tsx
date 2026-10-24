"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMeeting } from "@/lib/actions/meetings";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function MeetingForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createMeeting, null);
  useActionFeedback(state, { onSuccess: () => formRef.current?.reset() });

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting-title">Title</Label>
          <Input
            id="meeting-title"
            name="title"
            required
            minLength={5}
            maxLength={150}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "meeting-title-error" : undefined}
          />
          <FieldError id="meeting-title-error" message={errors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-venue">Venue</Label>
          <Input
            id="meeting-venue"
            name="venue"
            required
            minLength={3}
            maxLength={200}
            aria-invalid={errors.venue ? true : undefined}
            aria-describedby={errors.venue ? "meeting-venue-error" : undefined}
          />
          <FieldError id="meeting-venue-error" message={errors.venue} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-date">Date and time</Label>
        <Input
          id="meeting-date"
          name="meetingDate"
          type="datetime-local"
          required
          className="w-fit"
          aria-invalid={errors.meetingDate ? true : undefined}
          aria-describedby={errors.meetingDate ? "meeting-date-error" : undefined}
        />
        <p className="text-xs text-muted">The date must be in the future.</p>
        <FieldError id="meeting-date-error" message={errors.meetingDate} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-description">
          Description <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Textarea
          id="meeting-description"
          name="description"
          rows={3}
          maxLength={2000}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? "meeting-description-error" : undefined
          }
        />
        <FieldError
          id="meeting-description-error"
          message={errors.description}
        />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Schedule meeting</SubmitButton>
    </form>
  );
}
