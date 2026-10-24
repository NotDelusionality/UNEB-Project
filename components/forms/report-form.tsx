"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/lib/actions/reports";
import { CATEGORY_META, REPORT_CATEGORIES } from "@/lib/constants";
import { FieldError } from "./field-error";
import { SubmitButton } from "./submit-button";
import { useActionFeedback } from "./use-action-feedback";

export function ReportForm() {
  const [state, formAction] = useActionState(createReport, null);
  useActionFeedback(state);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={120}
          placeholder="A short summary of the problem"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" required>
            <SelectTrigger
              id="category"
              className="w-full"
              aria-invalid={errors.category ? true : undefined}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_META[category].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="category-error" message={errors.category} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            required
            minLength={3}
            maxLength={200}
            placeholder="Where is the problem?"
            aria-invalid={errors.location ? true : undefined}
            aria-describedby={errors.location ? "location-error" : undefined}
          />
          <FieldError id="location-error" message={errors.location} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          required
          minLength={20}
          maxLength={5000}
          placeholder="What is wrong, since when, and who is affected?"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
        />
        <FieldError id="description-error" message={errors.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">
          Photo <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-invalid={errors.image ? true : undefined}
          aria-describedby="image-help"
        />
        <p id="image-help" className="text-xs text-muted">
          JPEG, PNG, or WebP, up to 5 MB.
        </p>
        <FieldError id="image-error" message={errors.image} />
      </div>

      {formError && (
        <p role="alert" className="text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <SubmitButton>Submit report</SubmitButton>
    </form>
  );
}
