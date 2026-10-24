"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/profile";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(changePassword, null);
  useActionFeedback(state, { onSuccess: () => formRef.current?.reset() });

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errors.currentPassword ? true : undefined}
          aria-describedby={
            errors.currentPassword ? "currentPassword-error" : undefined
          }
        />
        <FieldError id="currentPassword-error" message={errors.currentPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={100}
          aria-invalid={errors.newPassword ? true : undefined}
          aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
        />
        <p className="text-xs text-muted">
          At least 8 characters, with at least one letter and one digit.
          Changing your password signs you out everywhere else.
        </p>
        <FieldError id="newPassword-error" message={errors.newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.confirmNewPassword ? true : undefined}
          aria-describedby={
            errors.confirmNewPassword ? "confirmNewPassword-error" : undefined
          }
        />
        <FieldError
          id="confirmNewPassword-error"
          message={errors.confirmNewPassword}
        />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
