"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string | null;
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfile, null);
  useActionFeedback(state);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-fullName">Full name</Label>
        <Input
          id="profile-fullName"
          name="fullName"
          defaultValue={fullName}
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "profile-fullName-error" : undefined}
        />
        <FieldError id="profile-fullName-error" message={errors.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} readOnly disabled />
        <p className="text-xs text-muted">
          Email cannot be changed; it identifies your account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">
          Phone <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "profile-phone-error" : undefined}
        />
        <FieldError id="profile-phone-error" message={errors.phone} />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
