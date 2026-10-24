import { z } from "zod";
import { REPORT_CATEGORIES, REPORT_STATUSES, ROLES } from "./constants";

/**
 * Every constraint of §10 lives here and nowhere else. Server actions parse
 * with these schemas; client-side `required`/`minLength` attributes only echo
 * them for immediate feedback.
 */

/** Shared result type returned by every server action (§8). */
export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

/** First message per field, keyed by field name, for inline display. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a full name of at least 2 characters.")
  .max(80, "The full name must be 80 characters or fewer.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "The email address must be 254 characters or fewer.")
  .email("Enter a valid email address.");

const passwordSchema = z
  .string()
  .min(8, "The password must be at least 8 characters.")
  .max(100, "The password must be 100 characters or fewer.")
  .regex(/[A-Za-z]/, "The password must contain at least one letter.")
  .regex(/[0-9]/, "The password must contain at least one digit.");

const phoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .regex(
      /^[0-9+\-\s]{7,20}$/,
      "Enter a phone number of 7–20 digits, spaces, + or -.",
    )
    .nullable(),
);

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const reportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "The title must be at least 5 characters.")
    .max(120, "The title must be 120 characters or fewer."),
  category: z.enum(REPORT_CATEGORIES, {
    message: "Choose a category.",
  }),
  location: z
    .string()
    .trim()
    .min(3, "The location must be at least 3 characters.")
    .max(200, "The location must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(20, "Describe the problem in at least 20 characters.")
    .max(5000, "The description must be 5000 characters or fewer."),
});

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Enter a comment.")
    .max(2000, "The comment must be 2000 characters or fewer."),
});

export const statusChangeSchema = z.object({
  status: z.enum(REPORT_STATUSES, { message: "Choose a status." }),
  comment: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(2000, "The comment must be 2000 characters or fewer.")
      .optional(),
  ),
});

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "The title must be at least 5 characters.")
    .max(150, "The title must be 150 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(10, "The announcement must be at least 10 characters.")
    .max(5000, "The announcement must be 5000 characters or fewer."),
});

export const meetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "The title must be at least 5 characters.")
    .max(150, "The title must be 150 characters or fewer."),
  venue: z
    .string()
    .trim()
    .min(3, "The venue must be at least 3 characters.")
    .max(200, "The venue must be 200 characters or fewer."),
  description: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(2000, "The description must be 2000 characters or fewer.")
      .optional(),
  ),
  meetingDate: z
    .string()
    .min(1, "Choose a date and time.")
    .transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date and time." });
        return z.NEVER;
      }
      if (date.getTime() <= Date.now()) {
        ctx.addIssue({
          code: "custom",
          message: "The meeting date must be in the future.",
        });
        return z.NEVER;
      }
      return date;
    }),
});

export const profileSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "The passwords do not match.",
    path: ["confirmNewPassword"],
  });

export const roleSchema = z.enum(ROLES);
