import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
// Relative import so this file also loads outside the Next.js resolver
// (drizzle-kit push and the tsx-driven seed script).
import { REPORT_CATEGORIES, REPORT_STATUSES, ROLES } from "../lib/constants";

const inList = (values: readonly string[]) =>
  values.map((v) => `'${v}'`).join(", ");

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    role: text("role", { enum: ROLES }).notNull().default("member"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
  },
  (t) => [check("users_role_check", sql.raw(`role IN (${inList(ROLES)})`))],
);

export const sessions = sqliteTable(
  "sessions",
  {
    // SHA-256 hex of the session token; the raw token never touches the database (§5.3).
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const reports = sqliteTable(
  "reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category", { enum: REPORT_CATEGORIES }).notNull(),
    location: text("location").notNull(),
    // Stored filename only; files live in data/uploads/ and are served by the
    // authenticated route handler (§9).
    imagePath: text("image_path"),
    status: text("status", { enum: REPORT_STATUSES })
      .notNull()
      .default("pending"),
    // Users are deactivated, never deleted (§5.6), so restrict is never hit.
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("reports_user_id_idx").on(t.userId),
    index("reports_status_idx").on(t.status),
    index("reports_category_idx").on(t.category),
    index("reports_created_at_idx").on(t.createdAt),
    check(
      "reports_status_check",
      sql.raw(`status IN (${inList(REPORT_STATUSES)})`),
    ),
    check(
      "reports_category_check",
      sql.raw(`category IN (${inList(REPORT_CATEGORIES)})`),
    ),
  ],
);

export const reportComments = sqliteTable(
  "report_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reportId: integer("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("report_comments_report_id_idx").on(t.reportId)],
);

export const reportStatusHistory = sqliteTable(
  "report_status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reportId: integer("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    changedBy: integer("changed_by")
      .notNull()
      .references(() => users.id),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("report_status_history_report_id_idx").on(t.reportId)],
);

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at"),
});

export const meetings = sqliteTable(
  "meetings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    venue: text("venue").notNull(),
    description: text("description"),
    meetingDate: integer("meeting_date", { mode: "timestamp" }).notNull(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("meetings_meeting_date_idx").on(t.meetingDate)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportId: integer("report_id").references(() => reports.id, {
      onDelete: "cascade",
    }),
    message: text("message").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("notifications_user_id_is_read_idx").on(t.userId, t.isRead)],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ReportComment = typeof reportComments.$inferSelect;
export type StatusHistoryEntry = typeof reportStatusHistory.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
