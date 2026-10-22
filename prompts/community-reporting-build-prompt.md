# Build Specification — Community Problem Reporting and Communication System
### Light Academy Secondary School

**How to read this document.** This is the complete task specification for an implementing agent. Build the application exactly as specified. Where the document is silent, choose the simplest option consistent with the stated architecture and remain within the non-goals (§16). Do not add features, dependencies, or configuration beyond what is specified. Do not use promotional language anywhere in the product or its documentation.

---

## 1. Objective and quality bar

Build a complete, working web application through which community members report local problems to the administration of Light Academy Secondary School, track those reports through a defined lifecycle, exchange messages with administrators about them, and view announcements and upcoming local council meetings. Administrators triage reports, manage users, publish announcements, schedule meetings, and read summary statistics.

The application will be demonstrated as a secondary-school project. The audience is non-technical evaluators plus one technical reviewer who will read the code. The quality bar is therefore twofold: the running application must be coherent and polished, and the codebase must be legible enough that a student can explain any file in it.

The finished repository must satisfy all of the following from a fresh clone, with no environment variables and no external services:

```
npm install
npm run db:reset     # creates the SQLite file, applies the schema, seeds demo data
npm run dev          # application available at http://localhost:3000
```

`npm run build` must complete with zero TypeScript errors. Every page listed in §7 must be reachable and populated by seed data. The acceptance walkthrough in §15.3 defines "done."

## 2. Technology stack (mandated)

This is a single full-stack TypeScript application. There is no separate backend service, no second language, no second process, and no cross-origin traffic.

- **Framework:** Next.js, current stable release, App Router, TypeScript in `strict` mode, `src/` directory, `@/*` import alias.
- **Database:** SQLite, stored at `data/app.db`, accessed through **Drizzle ORM** with the `@libsql/client` driver using a `file:` URL. This driver is chosen deliberately over `better-sqlite3` to avoid native-module compilation on student machines (Windows and WSL included).
- **Schema management:** `drizzle-kit push` (no migration files; the database is disposable demo data).
- **Validation:** **Zod**. One schema module is the single source of truth for every constraint in §10.
- **Styling and components:** **Tailwind CSS v4** (CSS-first configuration via `@theme`) with **shadcn/ui** primitives, **lucide-react** icons, **sonner** for toasts.
- **Charts:** **Recharts**, in client components fed serializable props from server components.
- **Authentication:** implemented directly in this codebase — `node:crypto` (scrypt) for password hashing and a database-backed session table. No auth framework. §5 specifies the mechanics exactly.
- **Fonts:** `next/font/google` — Libre Franklin (display) and Public Sans (body/UI), per §12.

**Explicitly excluded:** Axios (use `fetch` where a client request is ever needed; it rarely is), Redux or any client state library, JWT libraries, Prisma, tRPC, NextAuth/Auth.js/better-auth or any external identity service, CSS-in-JS, moment/dayjs (use `Intl.DateTimeFormat`), Docker, and testing frameworks (§16).

**Rationale, recorded for the README.** A same-origin application eliminates CORS, token storage in the browser, and a hand-maintained client–server contract — the three largest defect classes in the two-server design this specification replaces. One language end to end means the validation schema, the types, and the database model cannot drift apart. SQLite is retained on purpose: at this scale it is the correct database, and a single file makes the project trivially portable and demonstrable.

## 3. Architectural rules

### 3.1 Server-first data flow

All reads happen in **server components**, which call the data-access layer directly. All writes happen in **server actions**. The only route handler in the entire application is the authenticated image endpoint of §9. There is no REST layer, no API client, and no client-side data fetching library; server actions are the application's POST endpoints, invoked from forms via `useActionState` or from event handlers via `startTransition`. After every successful mutation the action calls `revalidatePath` for each affected route.

### 3.2 The data-access layer

All Drizzle queries live in `src/lib/data/*.ts`, one module per aggregate (`users.ts`, `reports.ts`, `announcements.ts`, `meetings.ts`, `notifications.ts`, `stats.ts`). Pages, layouts, and actions call these functions; no component or action imports the Drizzle client directly. Query functions that return viewer-scoped data take the viewer as an argument and enforce ownership inside the query (§11, IDOR).

### 3.3 Authorization discipline

Authorization is enforced at the point of data access, never only at the point of navigation. `src/lib/auth.ts` exports three helpers:

- `getSession()` — reads the session cookie, looks up the session row, returns `{ user, session } | null`. Wrapped in React `cache()` so a request resolves it once.
- `requireUser()` — returns the session or `redirect('/login?next=<current path>')`.
- `requireAdmin()` — as above, and additionally redirects non-admins to `/portal`.

Every protected page and layout calls the appropriate helper. **Every server action independently re-verifies the session and role as its first statement** and re-verifies resource ownership before touching a row; a client that never rendered a button can still invoke the action. Next.js middleware performs only a coarse, optimistic redirect based on the *presence* of the session cookie (unauthenticated → `/login`, and it never touches the database, because middleware runs on the edge runtime where SQLite is unavailable). Middleware is a convenience, not a security boundary.

### 3.4 Framework sharp edges (observe these exactly)

- `cookies()`, `headers()`, and the `params` / `searchParams` props are **asynchronous** in current Next.js. `await` them everywhere.
- Server actions live in files marked `'use server'` under `src/lib/actions/`; they are never defined inside client components.
- Reading or writing cookies is permitted only in server actions and route handlers, not during server-component render. Session *renewal* (§5.4) therefore happens lazily and is acceptable to skip during pure renders.
- User-uploaded images are rendered with a plain `<img>` tag pointing at the route handler of §9 — not `next/image`, which would require remote-pattern configuration for no benefit here.
- Recharts components carry `'use client'` and receive already-aggregated plain data (numbers, strings, ISO dates) computed server-side in `lib/data/stats.ts`.
- The middleware matcher excludes `/_next/*`, static assets, and `/uploads/*`.
- All timestamps are stored as UTC and formatted at render time with `Intl.DateTimeFormat('en-GB', …)`.

## 4. Domain model and database schema

Schema lives in `src/db/schema.ts`. Timestamps use Drizzle's `integer({ mode: 'timestamp' })` with `$defaultFn(() => new Date())`. String enumerations are enforced both in Zod and as SQLite `CHECK` constraints via Drizzle's `text({ enum: […] })`.

Two structural decisions correct the naive design this document replaces, and the README must explain both. First, administrator feedback is **not** a single overwritable column on the report; the system's stated purpose is communication, and communication is a thread, so feedback is a `report_comments` table in which both parties participate. Second, status is **not** just a mutable field; every transition is recorded in `report_status_history`, which yields an audit trail, the report-detail timeline (§12.6), and the resolution-time statistic (§7.3, Analytics) at no extra cost.

**`users`**

| column | type | constraints |
|---|---|---|
| id | integer | pk, autoincrement |
| full_name | text | not null |
| email | text | not null, unique, stored lowercased |
| password_hash | text | not null, format per §5.2 |
| phone | text | nullable |
| role | text | not null, enum `member \| admin`, default `member` |
| is_active | integer (boolean) | not null, default true |
| created_at | timestamp | not null, default now |

**`sessions`**

| column | type | constraints |
|---|---|---|
| id | text | pk — SHA-256 hex of the session token (§5.3) |
| user_id | integer | not null, fk → users.id, on delete cascade |
| expires_at | timestamp | not null |
| created_at | timestamp | not null, default now |

**`reports`**

| column | type | constraints |
|---|---|---|
| id | integer | pk, autoincrement |
| title | text | not null |
| description | text | not null |
| category | text | not null, enum: `infrastructure, sanitation, security, water_supply, electricity, environment, health, education, other` |
| location | text | not null, free text |
| image_path | text | nullable — stored filename only (§9) |
| status | text | not null, enum: `pending, under_review, in_progress, resolved, closed`, default `pending` |
| user_id | integer | not null, fk → users.id, on delete **restrict** (users are deactivated, never deleted — §5.6) |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null, default now, set on every mutation |

**`report_comments`**

| column | type | constraints |
|---|---|---|
| id | integer | pk, autoincrement |
| report_id | integer | not null, fk → reports.id, on delete cascade |
| author_id | integer | not null, fk → users.id |
| body | text | not null |
| created_at | timestamp | not null, default now |

**`report_status_history`**

| column | type | constraints |
|---|---|---|
| id | integer | pk, autoincrement |
| report_id | integer | not null, fk → reports.id, on delete cascade |
| changed_by | integer | not null, fk → users.id |
| from_status | text | not null |
| to_status | text | not null |
| created_at | timestamp | not null, default now |

**`announcements`** — id (pk), title (not null), body (not null), author_id (fk → users.id), created_at.

**`meetings`** — id (pk), title (not null), venue (not null), description (nullable), meeting_date (timestamp, not null), author_id (fk → users.id), created_at.

**`notifications`**

| column | type | constraints |
|---|---|---|
| id | integer | pk, autoincrement |
| user_id | integer | not null, fk → users.id, on delete cascade |
| report_id | integer | nullable, fk → reports.id, on delete cascade |
| message | text | not null |
| is_read | integer (boolean) | not null, default false |
| created_at | timestamp | not null, default now |

**Indexes:** `reports(user_id)`, `reports(status)`, `reports(category)`, `reports(created_at)`, `report_comments(report_id)`, `report_status_history(report_id)`, `sessions(user_id)`, `notifications(user_id, is_read)`, `meetings(meeting_date)`.

**Notification triggers** (implemented inside the relevant server actions, same transaction where practical): when an administrator comments on a report or changes its status, notify the report's owner; when a member submits a report or comments on their own report, notify every active administrator. Message strings are short templates that name the report by its display number (§12.5), e.g. `Status of report LA-0042 changed to In Progress.`

## 5. Authentication and session mechanics

The naive design used JWTs. In a same-origin application a bearer token held by browser JavaScript is strictly worse than an httpOnly session cookie: it is exposed to any script injection, it cannot be revoked server-side without rebuilding the very session store it was meant to avoid, and it complicates every request. This application uses database-backed sessions. The README must contain a short section stating this reasoning.

### 5.1 Registration
Public form: full name, email, phone (optional), password, password confirmation. On success the user is created with role `member`, a session is opened, and the user is redirected to `/portal`. A duplicate email returns a field-level error ("An account with this email already exists."), not an exception.

### 5.2 Password hashing
`node:crypto` `scrypt` with N=16384, r=8, p=1, a random 16-byte salt, and a 64-byte derived key. Stored as `scrypt:16384:8:1:<saltHex>:<hashHex>` so parameters travel with the hash. Verification recomputes with the stored parameters and compares via `crypto.timingSafeEqual`. The README notes that argon2id is the production-grade successor and why scrypt was chosen here (ships with Node, zero native compilation).

### 5.3 Sessions
On login, generate a 32-byte random token (`crypto.randomBytes(32).toString('hex')`). Store **SHA-256(token)** as the session id — a database leak then reveals no usable tokens — with a 7-day expiry. Set the raw token in a cookie: name `session`, `httpOnly`, `sameSite: 'lax'`, `secure` in production, `path: '/'`, `maxAge` 7 days. Lookup hashes the presented token and joins to the user, rejecting expired sessions and inactive users.

### 5.4 Renewal and logout
Sliding expiry: when an authenticated **action** runs and the session has less than 3.5 days remaining, extend it to 7 days and reset the cookie. Logout deletes the session row and clears the cookie.

### 5.5 Login hardening
Failed logins return one generic message ("Incorrect email or password.") regardless of which part failed. An in-memory map keyed by lowercased email counts failures; after 5 within 15 minutes, reject attempts for that email for 15 minutes with an explicit lockout message. The README notes this resets on server restart and names the production alternative (a persistent store).

Login accepts an optional `next` query parameter and redirects there on success **only if** it begins with a single `/` (rejecting `//` and absolute URLs); otherwise members go to `/portal` and admins to `/admin`. Authenticated users visiting `/login` or `/register` are redirected to their portal.

### 5.6 Password change and deactivation
Changing one's own password requires the current password, applies §10's password rule, and deletes **all other sessions** of that user. Administrators deactivate users rather than deleting them (reports must keep their authors); deactivation immediately deletes all of that user's sessions, and inactive users cannot log in ("This account has been deactivated. Contact the administration."). There is no self-service password reset (§16); the README lists this as a known limitation.

## 6. Authorization matrix

| Capability | Guest | Member | Admin |
|---|---|---|---|
| View Home, About | yes | yes | yes |
| Register, Login | yes | redirected | redirected |
| Submit report; comment on **own** report | — | yes | — |
| View report detail / image | — | owner only | any |
| Delete report | — | own, only while `pending` | any, with confirmation |
| Change report status; comment on any report | — | — | yes |
| View announcements & meetings pages | — | yes | yes |
| Create/delete announcements & meetings | — | — | yes |
| View all reports, users, analytics | — | — | yes |
| Toggle user active; change user role | — | — | yes, never on self |
| Edit own profile (name, phone), change own password | — | yes | yes |

Email is immutable after registration (it is the identity anchor). An admin attempting to deactivate or demote their own account receives an error result; the corresponding controls are also hidden on their own row.

## 7. Route and page specifications

Route groups: `(public)`, `(portal)` with a member layout, `(admin)` with an admin layout. Both portal layouts render the sidebar/topbar shell of §12.4; the portal layout calls `requireUser()`, the admin layout `requireAdmin()`, and both fetch the viewer's unread-notification count for the topbar bell.

### 7.1 Public

- **`/` Home.** A public explanation of the service. Hero: a plain declarative headline ("Report a problem in your community. Track it until it is resolved.") with Register/Login actions. A three-step "How it works" strip (submit → administration reviews → you are notified at every change) — the numbering is justified because the content is a real sequence. A category grid using the icon map of §12.5. A single quiet counter strip fed by a public server-side query: total reports received, reports resolved, upcoming meetings. No testimonials, no invented quotations.
- **`/about`.** Static: purpose of the system, who operates it (the school administration), what happens to a report after submission, and how meetings and announcements are used. Written in the interface voice of §12.7.
- **`/login`, `/register`.** Centered single-card forms per §5.

### 7.2 Member portal (`/portal`)

- **`/portal` Dashboard.** Stat cards: my reports (total), open (pending + under review + in progress), resolved. Then: latest 3 announcements (linked), next 3 meetings, my 5 most recent reports with status badges, and recent notifications with a "mark all as read" action.
- **`/portal/reports/new` Submit report.** Fields: title, category (select), location, description, optional image (§9). Client-side `required`/`minLength` attributes give immediate feedback; the server action is the authority. Success → toast "Report submitted" → redirect to the new report's detail page.
- **`/portal/reports` My reports.** Table of the viewer's reports (display number, title, category, status badge, created date), filterable by status and searchable by title, both via URL search params evaluated server-side. Empty state per §12.7.
- **`/portal/reports/[id]` Report detail.** Owner-only (§11). Shows the case header (display number, title, status badge, category, location, dates), the image if present, the description, the **status timeline** rendered from `report_status_history` (§12.6), and the comment thread with a reply form. Members may comment while status ≠ `closed`; on a closed report the form is replaced by a quiet notice that the case is closed. A "Delete report" control appears only while status is `pending`, behind a confirmation dialog.
- **`/portal/announcements`.** Reverse-chronological list; each card shows title, body, and date.
- **`/portal/meetings`.** Upcoming meetings first (soonest first), then a collapsed "Past meetings" section; each entry shows title, venue, date/time, description.
- **`/portal/profile`.** Two cards: edit name and phone (email shown read-only with a one-line explanation), and change password per §5.6.

### 7.3 Admin portal (`/admin`)

- **`/admin` Dashboard.** Five stat cards: total reports, pending reports, resolved reports, active users, upcoming meetings. Two charts: reports by status (donut) and submissions over the last 30 days (line, missing days filled with zero). A table of the 5 most recent reports linking into management.
- **`/admin/reports` Reports management.** Server-side paginated table (10 per page): display number, title, reporter name, category, status, created date. Controls, all URL-param-driven and combinable: text search over title and location (case-insensitive `LIKE`), status filter, category filter, sort by date ascending/descending. Row click → detail.
- **`/admin/reports/[id]`.** Everything the member detail shows, plus: a status-change form (select of the five statuses with an optional comment posted in the same submission; the action writes the history row, the comment if provided, `updated_at`, and the owner notification), the full status history, and a delete control behind a confirmation dialog.
- **`/admin/users`.** Paginated, searchable (name/email) table: name, email, phone, role, active state, joined date, report count. Row actions: toggle active, change role — each behind a confirmation dialog, each disabled on the viewer's own row.
- **`/admin/announcements`.** Create form (title, body) above a reverse-chronological list with per-item delete (confirmed). Success toasts use the exact verbs "Announcement published" / "Announcement deleted".
- **`/admin/meetings`.** Create form (title, venue, date/time via `datetime-local`, optional description; date must be in the future) above upcoming and past lists with per-item delete (confirmed).
- **`/admin/analytics`.** Reports by category (horizontal bar), category × status (stacked bar), 30-day submission trend (line), average resolution time in days (computed per resolved/closed report as the interval from `created_at` to the first history transition into `resolved`, averaged; shown as one large figure with its cohort size), and a "Top locations" table (top 5 by report count).
- **`/admin/settings`.** The admin's own profile and password cards (same components as `/portal/profile`).

## 8. Server actions inventory

All actions return the shared result type and never throw for expected failures:

```ts
type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };
```

| Action | Auth | Effect (beyond validation per §10) |
|---|---|---|
| `register` | guest | create member, open session, redirect `/portal` |
| `login` | guest | verify, rate-limit (§5.5), open session, safe redirect |
| `logout` | user | delete session, clear cookie, redirect `/` |
| `createReport` | member | multipart; store image (§9); insert report; notify admins |
| `addComment` | user | owner-or-admin on the report; reject if member and report `closed`; insert; notify counterpart |
| `updateReportStatus` | admin | write report + history (+ optional comment); notify owner |
| `deleteReport` | user | member: own + `pending` only; admin: any; cascades children |
| `deleteAnnouncement` / `deleteMeeting` | admin | delete row |
| `createAnnouncement` / `createMeeting` | admin | insert with author |
| `updateProfile` | user | update own name/phone |
| `changePassword` | user | §5.6 |
| `setUserActive` / `setUserRole` | admin | reject self-targeting; deactivation deletes target's sessions |
| `markNotificationsRead` | user | mark own unread as read |

Every action: (1) re-verifies session and role, (2) parses input with the Zod schema, (3) performs the ownership check, (4) mutates, (5) `revalidatePath` for every route whose data changed, (6) returns the result. Forms consume actions with `useActionState`, render field errors inline beneath the offending inputs, disable the submit control while pending (`useFormStatus`), and raise a sonner toast on the terminal outcome.

## 9. File upload handling

Report images are optional. Accepted types: JPEG, PNG, WebP; maximum size 5 MB — enforce the size on both the `File` object and the read buffer, and verify the type by **magic bytes** (`FF D8 FF`, `89 50 4E 47`, `RIFF….WEBP`), never by the client-supplied filename or MIME string alone. Store under `data/uploads/` (gitignored, directory ensured at startup alongside the database) with a generated name `crypto.randomUUID() + ext`; persist only that filename in `image_path`. The original filename is never trusted or stored.

Images are **not** publicly served. `src/app/uploads/[filename]/route.ts` validates the session, resolves the filename to its report, verifies the viewer is the owner or an admin, rejects any filename containing a path separator or `..`, and streams the file with the correct `Content-Type` and `X-Content-Type-Options: nosniff`.

## 10. Validation rules and error handling

`src/lib/validation.ts` defines every schema; nothing else restates a constraint.

| Field | Rule |
|---|---|
| full_name | string, trimmed, 2–80 |
| email | valid email, lowercased, ≤ 254 |
| password | 8–100, at least one letter and one digit |
| phone | optional; 7–20 of digits, spaces, `+`, `-` |
| report title | 5–120 |
| report description | 20–5000 |
| category / status | the exact enums of §4 |
| location | 3–200 |
| comment body | 1–2000 |
| announcement title / body | 5–150 / 10–5000 |
| meeting title / venue / description | 5–150 / 3–200 / optional ≤ 2000 |
| meeting_date | parseable datetime, strictly in the future at creation |

Expected failures surface as inline field errors and toasts; they never render an error boundary. Unexpected failures are caught by a root `error.tsx` that states, in the interface voice, that something failed and offers retry; the underlying error is logged server-side, never shown. A root `not-found.tsx` handles unknown routes and unknown report ids alike (an existing report the viewer may not see also renders not-found, so the response does not confirm the resource exists).

## 11. Security requirements

The following are requirements, not suggestions, and the README's security section must enumerate them: scrypt-hashed passwords with per-user salt and constant-time comparison (§5.2); opaque session tokens stored only as hashes, in httpOnly SameSite=Lax cookies (§5.3) — SameSite plus Next's same-origin enforcement on server actions is the CSRF posture; every server action re-checks authentication, role, and ownership independently of the UI (§3.3); object-level authorization on report reads and image reads so one member can never enumerate another's reports (IDOR); parameterized queries throughout via Drizzle (no string-built SQL); upload constraints of §9; open-redirect guard of §5.5; login rate limiting of §5.5; self-demotion/self-deactivation guards of §6; session destruction on password change and deactivation (§5.6); no secrets in the client bundle (there are no secrets at all — assert this); React's default output encoding as the XSS posture, with no use of `dangerouslySetInnerHTML`.

## 12. Design system

### 12.1 Identity
This is civic infrastructure — a public-service registry, not a SaaS product. The visual language borrows from public-works documentation: case numbers, stamped statuses, a plain institutional voice. Within the mandated blue/white/light-gray palette, the register is that of a government digital service, executed with precision. No gradients, no glassmorphism, no decorative illustration, no animation beyond 150 ms color/opacity transitions, and `prefers-reduced-motion` respected.

### 12.2 Tokens (define in `globals.css` via `@theme`)
- `--color-ink` #0F172A (primary text) · `--color-muted` #475569 · `--color-canvas` #F8FAFC (page background) · `--color-surface` #FFFFFF (cards) · `--color-line` #E2E8F0 (borders)
- `--color-primary` #1D4ED8, hover #1E40AF, focus ring #3B82F6
- `--color-sidebar` #172554 (deep institutional navy), sidebar text #E2E8F0, active item: white text on a #1E3A8A pill
- Destructive #DC2626, confined to confirmation dialogs and their triggering row actions.

### 12.3 Typography
Libre Franklin for display (page titles, stat figures, the hero) — the Franklin Gothic lineage of public notices is the point — and Public Sans, the typeface designed for government digital services, for body and UI. Scale: 30/24/18/14/13 px with weights 700/600/500/400. Stat figures and case numbers use `tabular-nums`.

### 12.4 Layout
Desktop: fixed 264 px navy sidebar (wordmark "Light Academy · Community Desk" top; nav items with lucide icons; the signed-in user and Logout pinned bottom) beside a 64 px white topbar (current page title, notification bell with unread count, avatar-initials menu) over a `max-w-6xl` content column with 24 px padding on the canvas color. Mobile (< 1024 px): sidebar becomes a shadcn Sheet behind a hamburger; tables gain horizontal scroll; stat cards stack. Cards: surface color, 1 px line border, 12 px radius, `shadow-sm` only. Table rows 48 px, hover #F8FAFC, no zebra striping.

### 12.5 Status and category vocabulary
Status badges are soft-tinted pills, consistent everywhere: pending — #B45309 on #FFFBEB; under review — #0369A1 on #F0F9FF; in progress — #4338CA on #EEF2FF; resolved — #047857 on #ECFDF5; closed — #475569 on #F1F5F9. Categories map to fixed lucide icons (infrastructure `Construction`, sanitation `Trash2`, security `Shield`, water supply `Droplets`, electricity `Zap`, environment `Leaf`, health `HeartPulse`, education `GraduationCap`, other `CircleDot`) used identically on Home, forms, tables, and detail pages. Charts draw from the same palette family — statuses use their badge hues; categorical charts use a restrained blue-range ramp.

### 12.6 Signature element
Two devices, used with total consistency, carry the identity. First, the **case number**: every report is displayed as `LA-` plus its id zero-padded to four digits (`LA-0042`) in tables, detail headers, and notification text — set in Libre Franklin with tabular figures. Second, the **status timeline** on report detail: a vertical rail built from `report_status_history`, each node a small filled circle in the status color with the status label, the actor's name, and the timestamp, the current status emphasized — the visual grammar of a tracked public case file. Spend the design's boldness on these two devices and keep everything else quiet.

### 12.7 Interface writing
Active voice, sentence case, plain verbs; a control names exactly what it does and keeps that name through the flow ("Submit report" → toast "Report submitted"). Errors state what happened and what to do next; they do not apologize and are never vague. Empty states are invitations with the relevant action ("No reports yet. When you submit one, you can track it here." + Submit report button). Loading uses skeletons via Suspense boundaries on the dashboards and tables, and pending states on every submit control. Quality floor, unannounced: responsive to 360 px, visible keyboard focus on every interactive element, labelled form controls, WCAG AA contrast (verify the sidebar and every badge pairing).

## 13. Seed data

`npm run db:seed` (a `tsx` script) is **deterministic** — fixed literals, no randomness — so every demonstration is identical. It creates: one administrator, `admin@lightacademy.ac.ug` / `Admin#2026`; six members (`amina.k@…`, `okello.j@…`, etc.), all with password `Member#2026`, one of them deactivated to demonstrate §5.6; **24 reports** authored by the members, spread across all nine categories and all five statuses with `created_at` values distributed over the past 60 days, each report title and description written as a plausible, specific community issue (a broken borehole pump, a collapsed culvert, streetlight outages — real registry entries, not lorem ipsum); coherent `report_status_history` for every non-pending report (pending → … in timestamp order, actor = the admin); comment threads on at least six reports showing both voices; **4 announcements** and **3 meetings** (two future, one past), authored by the admin; and unread notifications for two members consistent with the above. Seeded reports have no images (`image_path` null) so the upload path is exercised live during the demonstration. The README lists all credentials in a table.

## 14. Repository layout

```
├── data/                      # gitignored: app.db, uploads/
├── drizzle.config.ts
├── src/
│   ├── app/
│   │   ├── (public)/          #  /, about, login, register
│   │   ├── (portal)/portal/   #  member routes of §7.2
│   │   ├── (admin)/admin/     #  admin routes of §7.3
│   │   ├── uploads/[filename]/route.ts
│   │   ├── layout.tsx · globals.css · error.tsx · not-found.tsx
│   ├── components/            # shell/, reports/, charts/, ui/ (shadcn)
│   ├── db/                    # schema.ts, client.ts (ensures data/ exists)
│   ├── lib/
│   │   ├── actions/           # 'use server' modules of §8
│   │   ├── data/              # query layer of §3.2
│   │   ├── auth.ts · validation.ts · session.ts · passwords.ts
│   │   ├── rate-limit.ts · uploads.ts · format.ts · constants.ts
│   └── middleware.ts
├── scripts/seed.ts · scripts/reset.ts   # reset: Node fs (cross-platform), then push + seed
└── README.md
```

`constants.ts` holds the status/category enums with their labels, badge classes, and icons — the single vocabulary consumed by schema, validation, and UI.

## 15. Scripts, README, and definition of done

### 15.1 package.json scripts
`dev`, `build`, `start`, `db:push` (drizzle-kit push), `db:seed` (tsx scripts/seed.ts), `db:reset` (tsx scripts/reset.ts — delete `data/app.db` via Node `fs`, then push, then seed; must work identically on Windows, WSL, macOS, Linux).

### 15.2 README contents
Overview and purpose; stack with the §2 rationale; prerequisites (Node 20+ only); the three setup commands; the seeded-credentials table; a per-role walkthrough of what the system does; the two data-model decisions of §4 explained; the security section of §11; the sessions-over-JWT reasoning of §5; known limitations (no email delivery, no self-service password reset, in-memory rate limiting, single-node SQLite). Written formally; no marketing adjectives.

### 15.3 Acceptance walkthrough — the definition of done
1. Fresh clone: `npm install`, `npm run db:reset`, `npm run dev` — the app serves on :3000 with a clean console; Home shows live seeded counts; About renders.
2. Register a new member → lands authenticated on `/portal`.
3. Submit a report with a JPEG → detail page shows a case number, a `pending` badge, the image, and a one-node timeline.
4. In a second browser, log in as the seeded admin → dashboard totals include the new report → open it → set status to `under_review` with a comment.
5. The member's bell shows unread items; the report now shows the two-node timeline and the admin's comment; the member replies.
6. The admin is notified of the reply, resolves the report; the dashboard's resolved count and the analytics page reflect it.
7. The member cannot reach `/admin/*` (redirected to `/portal`); a guest hitting `/portal` is redirected to `/login?next=…` and returns there after login; a guest requesting another member's image URL receives no image.
8. The member deletes a different, still-pending seeded report of their own; the delete control is absent on any non-pending report.
9. The admin deactivates a seeded member → that member's open session is invalid on next navigation and login is refused with the deactivation message; the admin's own row exposes no deactivate/demote controls.
10. The seeded deactivated member cannot log in; the seeded past meeting appears under Past meetings.
11. `npm run build` completes with zero TypeScript errors.

## 16. Non-goals

No email delivery of any kind (hence no verification or self-service password reset); no real-time transport (notifications appear on navigation/refresh); no internationalization; no dark mode; no attachment types beyond the three image formats; no deployment configuration, Docker, or CI; no automated test suite (the type checker, the build, and §15.3 are the verification regime); no public API for third-party consumers; no hard deletion of user accounts.
