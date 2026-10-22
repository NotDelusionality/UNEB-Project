# As-Built Specification — Community Problem Reporting and Communication System

## Light Academy Secondary School

This document records the system exactly as it was built: every technology
and its installed version, the architecture, the data model, the security
mechanics, the design system, and every deliberate decision — including the
few places where the implementation departs from the original build prompt
(`community-reporting-build-prompt.md`) and why. The visual design in §12
reflects the subsequent retheme to the *Subquadratic* visual language
(`subq-retheme-prompt.md`), a presentation-only change: no behaviour,
route, query, or security property moved with it.

---

## 1. Purpose

A web application through which community members report local problems to
the school administration, track those reports through a defined lifecycle
(`pending → under_review → in_progress → resolved → closed`), exchange
messages with administrators on each case, and view announcements and
upcoming local council meetings. Administrators triage reports, manage
users, publish announcements, schedule meetings, and read summary
statistics.

The project is demonstrated as a secondary-school project. The audience is
non-technical evaluators plus one technical reviewer who reads the code, so
the quality bar is twofold: a coherent, polished running application, and a
codebase legible enough that a student can explain any file in it.

A fresh clone runs with no environment variables and no external services:

```
npm install
npm run db:reset     # creates the SQLite file, applies the schema, seeds demo data
npm run dev          # http://localhost:3000
```

---

## 2. Technology stack (exact installed versions)

Runtime prerequisite: **Node.js 20+** (built and verified on Node 22.13.0,
Windows 11).

### Runtime dependencies

| Package | Version | Role |
|---|---|---|
| `next` | 16.2.10 | Framework — App Router, Turbopack, server components, server actions |
| `react` / `react-dom` | 19.2.4 | UI runtime (`useActionState`, `useFormStatus`, `cache()`) |
| `drizzle-orm` | 0.45.2 | Typed SQL over SQLite; every query is parameterized |
| `@libsql/client` | 0.17.4 | SQLite driver via `file:` URL — prebuilt binaries, no native compilation on student machines |
| `zod` | 4.4.3 | Single source of truth for every input constraint (`src/lib/validation.ts`) |
| `tailwindcss` | 4.3.3 | CSS-first configuration via `@theme` in `globals.css`; no tailwind.config file |
| `radix-ui` | 1.6.2 | Unified Radix primitives package consumed by the shadcn/ui components |
| `lucide-react` | 1.24.0 | Icon set; fixed icon-per-category vocabulary |
| `sonner` | 2.0.7 | Toasts |
| `recharts` | 3.9.2 | Charts, in client components fed serializable props |
| `class-variance-authority` | 0.7.1 | Variant styling for shadcn/ui components |
| `clsx` + `tailwind-merge` | 2.1.1 / 3.6.0 | The `cn()` helper (`src/lib/utils.ts`) |
| `tw-animate-css` | 1.4.0 | Enter/exit keyframes used by dialog/sheet/dropdown primitives |

### Development dependencies

| Package | Version | Role |
|---|---|---|
| `typescript` | 5.9.3 | `strict: true` |
| `drizzle-kit` | 0.31.10 | `drizzle-kit push` schema management (no migration files — the database is disposable demo data) |
| `tsx` | 4.23.1 | Runs `scripts/seed.ts` and `scripts/reset.ts` |
| `@tailwindcss/postcss` | 4.3.3 | Tailwind v4 PostCSS integration |
| `eslint` / `eslint-config-next` | 9.39.5 / 16.2.10 | Linting |
| `@types/node` / `@types/react` / `@types/react-dom` | 20.19.43 / 19.2.17 / 19.2.3 | Types |

### shadcn/ui

Components were generated with the shadcn CLI (style `new-york`, base color
`neutral`, CSS variables) into `src/components/ui/` and are owned by the
repository: `button`, `card`, `input`, `label`, `textarea`, `badge`,
`table`, `dialog`, `sheet`, `skeleton`, `dropdown-menu`, `select`,
`sonner`, `separator`. Two were edited after generation:

- `table.tsx` — `bg-muted/50` hover/footer classes replaced with
  `bg-canvas` / `bg-secondary`, because this project reserves the Tailwind
  token `--color-muted` for the warm-grey *text* color the design system
  specifies (see §12).
- `sonner.tsx` — the `next-themes` dependency was removed (the application
  is light-only); the toaster is pinned to `theme="light"`.

### Fonts

`next/font/google`: **Libre Baskerville** (display serif — the hero, page
and section titles; weights 400/700 plus true italic), **Manrope**
(body/UI sans — running text, forms, navigation, tables), and **Roboto
Mono** (case numbers, stat figures, chart numerals — the monospace the
reference site itself uses). Exposed as `--font-libre-baskerville` /
`--font-manrope` / `--font-roboto-mono` CSS variables and mapped to
`font-display` / `font-sans` / `font-mono` in `@theme`, with Georgia and
ui-monospace fallbacks.

### Explicitly excluded (by design)

Axios, Redux or any client state library, JWT libraries, Prisma, tRPC,
NextAuth/Auth.js/better-auth or any external identity service, CSS-in-JS,
moment/dayjs (all date formatting is `Intl.DateTimeFormat('en-GB', …)`),
Docker, and testing frameworks. The verification regime is the TypeScript
compiler, `next build`, and the manual acceptance walkthrough (§17).

---

## 3. Architecture

### 3.1 One application, one language

A single full-stack TypeScript application. No separate backend service, no
second process, no cross-origin traffic. This eliminates CORS, browser
token storage, and a hand-maintained client–server contract, and it means
the validation schema, the types, and the database model cannot drift
apart.

### 3.2 Server-first data flow

- **All reads** happen in server components, which call the data-access
  layer directly.
- **All writes** happen in server actions (`'use server'` modules under
  `src/lib/actions/`), invoked from forms via `useActionState` or from
  event handlers via `startTransition`.
- **The only route handler** in the application is the authenticated image
  endpoint `src/app/uploads/[filename]/route.ts`.
- After every successful mutation the action calls `revalidatePath` for
  each affected route; there is no client-side data fetching library.

### 3.3 Data-access layer

All Drizzle queries live in `src/lib/data/*.ts`, one module per aggregate:

| Module | Contents |
|---|---|
| `users.ts` | Lookup/create/update, role & active toggles, paginated admin listing with per-user report counts, active-admin id list |
| `reports.ts` | Viewer-scoped reads (ownership enforced **inside the query**), member and admin listings, transactional writes (insert + notify, comment + notify, status change + history + optional comment + notify, cascading delete) |
| `announcements.ts` | List / latest / create / delete |
| `meetings.ts` | Upcoming / past / counts / create / delete |
| `notifications.ts` | Unread count, recent list, mark-all-read |
| `stats.ts` | Public home counters, admin dashboard aggregates, 30-day zero-filled trend, category and category×status matrices, average resolution time, top locations |

Pages, layouts, and actions call these functions; no component or action
imports the Drizzle client directly. Multi-row writes that must be atomic
(report + notifications, status + history + comment + notification,
cascading delete) are implemented as `db.transaction` **inside** the data
layer, so atomicity and the layer boundary are preserved simultaneously.
Child rows are deleted explicitly in the transaction rather than relying on
SQLite foreign-key pragmas.

### 3.4 Authorization discipline

Authorization is enforced at the point of data access, never only at the
point of navigation. `src/lib/auth.ts` exports:

- `getSession()` — resolves the session cookie to `{ user, session } |
  null`; wrapped in React `cache()` so one request resolves it once.
  Expired sessions and deactivated users resolve to `null`. The returned
  user object never includes the password hash.
- `requireUser()` — returns the session or
  `redirect('/login?next=<current path>')`. The current path comes from an
  `x-pathname` request header set by the proxy (below).
- `requireAdmin()` — as above, and additionally redirects non-admins to
  `/portal`.

Every protected layout and page calls the appropriate helper. **Every
server action independently re-verifies the session and role as its first
statement** and re-verifies resource ownership before touching a row — a
client that never rendered a button can still invoke the action.

### 3.5 Request gate (`src/proxy.ts`)

Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`; the file
was renamed accordingly (the original prompt predates the rename). Its role
is unchanged and deliberately minimal: a **coarse, optimistic** redirect of
cookie-less requests to `/portal/*` and `/admin/*` toward
`/login?next=<path>`, plus forwarding the requested path as `x-pathname`.
It never touches the database (the edge runtime has no SQLite) and is not a
security boundary. Matcher: `"/((?!_next|uploads|.*\\..*).*)"` — excludes
`/_next/*`, `/uploads/*` (the image route guards itself), and static files
with an extension.

### 3.6 Framework specifics observed

- `cookies()`, `headers()`, `params`, and `searchParams` are asynchronous
  and awaited everywhere.
- Cookies are read/written only in server actions and the route handler,
  never during server-component render; session *renewal* therefore
  happens lazily in actions only.
- Uploaded images render with a plain `<img>` pointing at the route
  handler — not `next/image`, which would add remote-pattern configuration
  for no benefit.
- Recharts components carry `'use client'` and receive already-aggregated
  plain data (numbers and preformatted strings) computed in
  `lib/data/stats.ts`.
- All timestamps are stored as UTC and formatted at render time with
  `Intl.DateTimeFormat('en-GB', …)` (`src/lib/format.ts`).
- The public home page sets `export const dynamic = "force-dynamic"` so its
  counters are always live; every other data-bearing page is dynamic
  automatically because it reads cookies.
- `next.config.ts` pins `turbopack.root` to the project directory so stray
  lockfiles elsewhere on a machine cannot change build resolution.
- `<body>` carries `suppressHydrationWarning` because browser extensions
  (e.g. Grammarly) inject attributes before React hydrates; this silences
  the resulting dev-only false positive and nothing else.

---

## 4. Repository layout

```
├── data/                        # gitignored: app.db, uploads/
├── drizzle.config.ts            # dialect sqlite, url file:data/app.db
├── next.config.ts               # turbopack.root pin
├── components.json              # shadcn/ui configuration
├── scripts/
│   ├── seed.ts                  # deterministic demo data (tsx)
│   └── reset.ts                 # Node-fs delete → push → seed (cross-platform)
├── src/
│   ├── proxy.ts                 # request gate (Next 16 middleware convention)
│   ├── app/
│   │   ├── (public)/            # layout + /, /about, /login, /register
│   │   ├── (portal)/            # member layout + /portal/* pages
│   │   ├── (admin)/             # admin layout + /admin/* pages
│   │   ├── uploads/[filename]/route.ts   # the only route handler
│   │   ├── layout.tsx           # fonts, metadata, <Toaster/>
│   │   ├── globals.css          # design tokens (@theme)
│   │   ├── error.tsx            # unexpected failures only
│   │   └── not-found.tsx        # unknown routes AND unauthorized resources
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (14 files)
│   │   ├── shell/app-shell.tsx  # sidebar/topbar shell, bell, avatar menu, mobile Sheet
│   │   ├── charts/              # status-donut, trend-line, category-bar, category-status-stacked
│   │   ├── forms/               # one client component per form + submit-button, field-error, use-action-feedback
│   │   ├── reports/             # status-timeline, comment-thread, report-filters
│   │   ├── notifications/       # mark-all-read-button
│   │   └── *.tsx                # status-badge, category-label, case-number, stat-card, page-header, empty-state, pagination, search-box, confirm-action, profile-cards
│   ├── db/
│   │   ├── schema.ts            # tables, enums, checks, indexes
│   │   └── client.ts            # libsql client (globalThis singleton), ensures data/ + uploads/
│   └── lib/
│       ├── actions/             # 'use server': auth, reports, announcements, meetings, profile, users, notifications
│       ├── data/                # query layer (§3.3)
│       ├── auth.ts · session.ts · passwords.ts · rate-limit.ts
│       ├── uploads.ts · validation.ts · format.ts · constants.ts · utils.ts
├── package.json                 # scripts: dev, build, start, lint, db:push, db:seed, db:reset
├── README.md                    # user-facing documentation
├── SPEC.md                      # this document
└── community-reporting-build-prompt.md   # the original build prompt
```

`src/lib/constants.ts` holds the status/category enums with their labels,
badge classes, chart hexes, and lucide icons — the single vocabulary
consumed by the schema, the validation, and the UI. `src/db/schema.ts`
imports it via a relative path so the file also loads outside the Next.js
resolver (drizzle-kit and tsx).

---

## 5. Domain model

Schema in `src/db/schema.ts`. Timestamps use Drizzle
`integer({ mode: 'timestamp' })` (Unix seconds) with
`$defaultFn(() => new Date())`; `reports.updated_at` also has
`$onUpdateFn`. String enumerations are enforced three ways: TypeScript
literal types, Zod enums, and SQLite `CHECK` constraints generated
explicitly with `check(...)` (Drizzle's `text({ enum })` alone is
compile-time only).

**users** — id pk autoincrement · full_name · email (unique, stored
lowercased) · password_hash · phone (nullable) · role `member | admin`
(default member, CHECK) · is_active boolean (default true) · created_at.

**sessions** — id **text pk = SHA-256 hex of the raw token** · user_id fk →
users (cascade) · expires_at · created_at.

**reports** — id pk · title · description · category (9-value enum, CHECK)
· location (free text) · image_path (nullable; stored generated filename
only) · status (5-value enum, CHECK, default pending) · user_id fk → users
(**restrict** — users are deactivated, never deleted) · created_at ·
updated_at.

**report_comments** — id pk · report_id fk → reports (cascade) · author_id
fk → users · body · created_at. *Administrator feedback is deliberately a
thread, not an overwritable column: the system's purpose is communication,
and communication is a thread both parties participate in.*

**report_status_history** — id pk · report_id fk (cascade) · changed_by fk
→ users · from_status · to_status · created_at. *Status is deliberately not
just a mutable field: recording every transition yields the audit trail,
the case timeline on the detail page, and the average-resolution-time
statistic from one table.*

**announcements** — id pk · title · body · author_id fk · created_at.

**meetings** — id pk · title · venue · description (nullable) ·
meeting_date · author_id fk · created_at.

**notifications** — id pk · user_id fk (cascade) · report_id fk nullable
(cascade) · message · is_read boolean (default false) · created_at.

**Indexes** — `reports(user_id)`, `reports(status)`, `reports(category)`,
`reports(created_at)`, `report_comments(report_id)`,
`report_status_history(report_id)`, `sessions(user_id)`,
`notifications(user_id, is_read)`, `meetings(meeting_date)`.

**Notification triggers** (inside the relevant server actions, same
transaction): admin comments on a report or changes its status → notify the
report's owner; member submits a report or comments on their own report →
notify every active administrator. Messages are short templates naming the
case by display number, e.g. `Status of report LA-0042 changed to In
progress.` A status change with an attached comment produces **one**
notification (the status message), matching the prompt's singular wording.

---

## 6. Authentication and sessions

JWTs were rejected deliberately: in a same-origin application a bearer
token held by browser JavaScript is exposed to any script injection, cannot
be revoked server-side without rebuilding the session store it was meant to
avoid, and complicates every request. The system uses database-backed
sessions.

- **Registration** (`register` action): public form (name, email, optional
  phone, password ×2). Creates a `member`, opens a session, redirects to
  `/portal`. Duplicate email returns a field-level error, including on the
  insert-race path (unique-constraint catch).
- **Password hashing** (`src/lib/passwords.ts`): `node:crypto` scrypt,
  N=16384, r=8, p=1, random 16-byte salt, 64-byte key, stored as
  `scrypt:16384:8:1:<saltHex>:<hashHex>` so parameters travel with the
  hash. Verification recomputes with the *stored* parameters and compares
  with `crypto.timingSafeEqual`. (argon2id is the production-grade
  successor; scrypt ships with Node and needs zero native compilation.)
- **Sessions** (`src/lib/session.ts`): on login, a 32-byte random token
  (`randomBytes(32).toString('hex')`). The database stores only
  SHA-256(token) as the session id — a database leak reveals no usable
  tokens. Cookie: name `session`, httpOnly, `sameSite: 'lax'`, `secure` in
  production, `path: '/'`, `maxAge` 7 days. Lookup hashes the presented
  token, joins to the user, and rejects expired sessions and inactive
  users.
- **Sliding renewal**: when an authenticated **action** runs and the
  session has under 3.5 days remaining, it is extended to 7 days and the
  cookie reset. Renewal is skipped during pure renders, where cookie writes
  are forbidden.
- **Logout**: deletes the session row, clears the cookie, redirects `/`.
- **Login hardening** (`src/lib/rate-limit.ts`): failures return one
  generic message ("Incorrect email or password.") regardless of cause. An
  in-memory map keyed by lowercased email (a `globalThis` singleton so dev
  hot-reload doesn't reset it) counts failures: 5 within 15 minutes locks
  that email for 15 minutes with an explicit lockout message. Resets on
  server restart; the production alternative is a persistent store. The
  deactivation message is only shown **after** the password verifies, so an
  attacker without the password cannot distinguish a deactivated account.
- **`next` redirect guard**: honoured only when it begins with a single
  `/` (rejects `//…` and absolute URLs); otherwise members land on
  `/portal` and admins on `/admin`. Authenticated visitors to `/login` or
  `/register` are redirected to their portal by the page itself (the proxy
  cannot know roles).
- **Password change**: requires the current password, applies the standard
  password rule, and deletes **all other sessions** of that user.
- **Deactivation**: admins deactivate rather than delete (reports keep
  their authors). Deactivation immediately deletes all of the target's
  sessions; inactive users cannot log in ("This account has been
  deactivated. Contact the administration."). No self-service password
  reset (no email delivery exists).

---

## 7. Authorization matrix

| Capability | Guest | Member | Admin |
|---|---|---|---|
| View Home, About | yes | yes | yes |
| Register, Login | yes | redirected | redirected |
| Submit report; comment on own report | — | yes | — |
| View report detail / image | — | owner only | any |
| Delete report | — | own, only while `pending` | any, with confirmation |
| Change report status; comment on any report | — | — | yes |
| View announcements & meetings pages | — | yes | yes |
| Create/delete announcements & meetings | — | — | yes |
| View all reports, users, analytics | — | — | yes |
| Toggle user active; change user role | — | — | yes, never on self |
| Edit own profile (name, phone), change own password | — | yes | yes |

Email is immutable after registration (it is the identity anchor). An admin
attempting to deactivate or demote their own account receives an error from
the action, and the controls are also hidden on their own row (rendered as
"—"). Members may comment while a case's status ≠ `closed`; on a closed
case the form is replaced by a quiet notice. Admins may always comment.

---

## 8. Routes and pages

Route groups: `(public)`, `(portal)`, `(admin)`. The portal group layout
calls `requireUser()`, the admin group layout `requireAdmin()`; both fetch
the viewer's unread-notification count and 8 most recent notifications for
the topbar bell.

### Public

- **`/`** — over-line "Community Desk" above a two-colour serif hero
  ("Report a problem in your community." in ink, "Track it until it is
  resolved." in rust) with Register →/Login actions; a three-figure
  counter strip (total reports, resolved reports, upcoming meetings) fed
  by a public server-side query, set as cream monospace figures on a
  near-black band; a numbered three-step "How it works" strip on the
  cream canvas; the nine-category grid using the fixed icon map on a
  second near-black band. No testimonials, no invented quotations.
  `force-dynamic`.
- **`/about`** — static: purpose, operator, what happens to a report
  (lifecycle in plain words), how announcements and meetings are used;
  over-line + serif headline treatment, arrow-suffixed Register call to
  action.
- **`/login`, `/register`** — centered single-card forms with a small
  over-line; authenticated visitors are redirected to their portal.

### Member portal (`/portal`)

- **Dashboard** — stat cards (my reports / open = pending+under
  review+in progress / resolved), latest 3 announcements, next 3 meetings,
  5 most recent reports with status badges, recent notifications with
  "Mark all as read".
- **`/portal/reports/new`** — title, category (select), location,
  description, optional image. Client `required`/`minLength` attributes
  give immediate feedback; the server action is the authority. Success →
  toast "Report submitted" → redirect to the new case.
- **`/portal/reports`** — the viewer's reports; status filter and title
  search via URL search params evaluated server-side; invitation-style
  empty state.
- **`/portal/reports/[id]`** — owner-only. Case header (display number,
  status badge, category, location, dates), image if present, description,
  the **status timeline**, and the message thread with a reply form (or a
  closed-case notice). "Delete report" appears only while `pending`,
  behind a confirmation dialog.
- **`/portal/announcements`** — reverse-chronological cards.
- **`/portal/meetings`** — upcoming first (soonest first), then a
  collapsed native `<details>` "Past meetings" section.
- **`/portal/profile`** — profile card (email read-only with a one-line
  explanation) and change-password card.

### Admin portal (`/admin`)

- **Dashboard** — five stat cards (total, pending, resolved, active users,
  upcoming meetings); reports-by-status donut; 30-day submissions line
  (missing days zero-filled); 5 most recent reports linking into
  management.
- **`/admin/reports`** — server-side paginated table (10/page): case,
  title, reporter, category, status, created. Controls, all
  URL-param-driven and combinable: case-insensitive `LIKE` search over
  title and location, status filter, category filter, date sort. Row click
  opens the case (a CSS `after:absolute after:inset-0` overlay on the
  title link — no client JS).
- **`/admin/reports/[id]`** — everything the member sees, plus reporter
  identity, a status-change form (five statuses + optional comment posted
  in the same submission; writes the history row, the comment,
  `updated_at`, and the owner notification in one transaction), the full
  history timeline, and a confirmed delete.
- **`/admin/users`** — paginated, searchable (name/email): name, email,
  phone, role, state, joined, report count. Row actions
  (deactivate/reactivate, change role) behind confirmation dialogs, hidden
  on the viewer's own row.
- **`/admin/announcements`** — create form above the list, per-item
  confirmed delete. Toast verbs exactly "Announcement published" /
  "Announcement deleted".
- **`/admin/meetings`** — create form (title, venue, `datetime-local`,
  optional description; date must be in the future) above upcoming and
  past lists with confirmed deletes.
- **`/admin/analytics`** — reports by category (horizontal bars),
  category × status (stacked bars), 30-day trend, average resolution time
  (per resolved/closed report, the interval from `created_at` to the first
  history transition into `resolved`, averaged; shown as one large figure
  with its cohort size), and a top-5 locations table.
- **`/admin/settings`** — the same profile/password cards as
  `/portal/profile` (shared `ProfileCards` component).

`loading.tsx` skeletons cover both dashboards and both report tables.
Unknown routes, unknown report ids, and reports the viewer may not see all
render the same not-found page, so responses never confirm a resource
exists.

---

## 9. Server actions

All actions return the shared result type and never throw for expected
failures:

```ts
type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };
```

| Action (module) | Auth | Effect beyond validation |
|---|---|---|
| `register` (auth) | guest | create member, open session, redirect `/portal` |
| `login` (auth) | guest | verify, rate-limit, open session, safe `next` redirect |
| `logout` (auth) | user | delete session, clear cookie, redirect `/` |
| `createReport` (reports) | member | multipart; store image; insert report; notify admins; `redirectTo` detail |
| `addComment` (reports) | user | owner-or-admin via viewer-scoped query; reject member on closed case; insert; notify counterpart |
| `updateReportStatus` (reports) | admin | transactional report + history (+ optional comment) + owner notification; rejects no-op status |
| `deleteReport` (reports) | user | member: own + pending only; admin: any; explicit child cascade + image file removal |
| `createAnnouncement` / `deleteAnnouncement` | admin | insert with author / delete row |
| `createMeeting` / `deleteMeeting` | admin | insert with author (future date) / delete row |
| `updateProfile` (profile) | user | update own name/phone |
| `changePassword` (profile) | user | verify current, rehash, delete all other sessions |
| `setUserActive` / `setUserRole` (users) | admin | reject self-targeting; deactivation deletes target's sessions |
| `markNotificationsRead` (notifications) | user | mark own unread as read |

Every action follows the same six steps: (1) re-verify session and role
(and renew the session), (2) parse input with the Zod schema, (3) perform
the ownership check, (4) mutate, (5) `revalidatePath` for every route whose
data changed, (6) return the result. Forms consume actions with
`useActionState`, render field errors inline beneath the offending inputs,
disable the submit control while pending (`useFormStatus` in
`SubmitButton`), and raise a sonner toast on the terminal outcome via the
shared `useActionFeedback` hook, which also follows `redirectTo`.
Row-level actions (deletes, user toggles) are bound server references
(`action.bind(null, id)`) passed to the `ConfirmAction` dialog component
and invoked in a transition.

---

## 10. File uploads

Optional report images only. Accepted: JPEG, PNG, WebP; max 5 MB, enforced
on both the `File` object and the read buffer. Type is verified by **magic
bytes** (`FF D8 FF`; `89 50 4E 47`; `RIFF….WEBP`), never by the
client-supplied filename or MIME string. Files are stored under
`data/uploads/` (gitignored, ensured at startup) as
`crypto.randomUUID() + ext`; only that filename is persisted in
`image_path`. The original filename is never trusted or stored.

Images are **not** publicly served. `src/app/uploads/[filename]/route.ts`
validates the session, rejects any name containing a path separator or
`..`, additionally requires the strict generated-name pattern
(`uuid.(jpg|png|webp)`), resolves the filename to its report, verifies the
viewer is the owner or an admin, and streams the file with the correct
`Content-Type`, `X-Content-Type-Options: nosniff`, and
`Cache-Control: private, no-store`. Guest, foreign member, missing file,
and traversal attempts all answer the same 404.

---

## 11. Validation

`src/lib/validation.ts` defines every schema (Zod 4); nothing else restates
a constraint. Client-side `required`/`minLength`/`maxLength` attributes
merely echo them for immediate feedback.

| Field | Rule |
|---|---|
| full_name | trimmed, 2–80 |
| email | valid email, lowercased, ≤ 254 |
| password | 8–100, at least one letter and one digit |
| phone | optional; 7–20 of digits, spaces, `+`, `-`; empty string → null |
| report title | 5–120 |
| report description | 20–5000 |
| category / status / role | exact enums from `constants.ts` |
| location | 3–200 |
| comment body | 1–2000 |
| announcement title / body | 5–150 / 10–5000 |
| meeting title / venue / description | 5–150 / 3–200 / optional ≤ 2000 |
| meeting_date | parseable datetime, strictly in the future at creation |

Expected failures surface as inline field errors (first issue per field)
and toasts; they never reach an error boundary. Unexpected failures are
caught by the root `error.tsx`, which states in the interface voice that
something failed and offers retry; the underlying error is logged
server-side only.

---

## 12. Design system

### Identity

A public-works registry in an editorial register — the *Subquadratic*
visual language (`subq-retheme-prompt.md`): warm near-black ink on a
bone-cream page, large transitional-serif headlines carrying the voice, a
quiet geometric sans carrying the information, technical figures in a
monospace, and a single rust accent used with great restraint. Still no
gradients, no glassmorphism, no decorative illustration, no drop shadows,
no animation beyond ~150 ms color/opacity transitions,
`prefers-reduced-motion` respected globally (animations and transitions
collapse to 0.01 ms). Light theme only.

### Tokens (in `globals.css` via `@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#0F0E0D` | primary text |
| `--color-muted` | `#57534E` | secondary text (warm grey; 6.5:1 on canvas) |
| `--color-canvas` | `#F0EDE8` | page background (the bone-cream "paper"), row hover |
| `--color-surface` | `#FBFAF7` | cards, topbar (warm white lifted just off the canvas) |
| `--color-line` | `#E4DED4` | borders (warm hairline) |
| `--color-primary` | `#0F0E0D` | solid buttons — near-black with a cream `#F0EDE8` label; hover `#26221E` (`--color-primary-hover`); focus ring ink `#0F0E0D` |
| `--color-sidebar` | `#0F0E0D` | near-black sidebar; cream text at 80 % idle, 100 % hover/active; active item on `#26221E` pill (`--color-sidebar-active`); cream focus ring on the dark surface |
| `--color-emphasis` | `#B8401C` | rust editorial accent (hover `#9A3414`, `--color-emphasis-hover`): text emphasis and the second line of two-line display headings, public pages only, never a button fill. The reference measures `#E04E1F`; darkened to clear 4.5:1 on the cream canvas |
| destructive | `#DC2626` | confined to confirmation dialogs and their triggering row actions |

The same palette also populates the shadcn semantic variables
(`--background`, `--primary`, `--border`, `--ring`, …) so the generated
primitives and bespoke components draw from one source; shadcn's
`--accent` stays a quiet warm neutral (`#EFEAE2`) for menu-item hovers and
is never the rust. `--radius` is 0.375rem, which lands cards (rounded-xl)
at 10 px and inputs/buttons at 4 px.

### Typography

A three-part system. **Libre Baskerville** (400/700 + italic) for display
— hero, page and section titles; it ships no intermediate weights, so
hierarchy is expressed through size and italic: 400 at the largest display
sizes, 700 reserved for smaller, more emphatic headings. **Manrope**
(400–800) for body/UI — running text, forms, navigation, tables, and the
uppercase over-line labels; it has no true italic, so inline italic
emphasis is set in Libre Baskerville italic within the sans body.
**Roboto Mono** (400/500) for case numbers, stat figures, and chart
numerals, always with `tabular-nums`. Scale 30/24/18/14/13 px
(text-3xl/2xl/lg/sm/[13px]); public display headlines reach
text-4xl/5xl.

### Layout

Desktop: fixed 264 px near-black sidebar (wordmark "Light Academy ·
Community Desk"; nav items with lucide icons; signed-in user and Logout
pinned bottom) beside a 64 px sticky warm-white topbar (current page title
derived from the pathname, set in the serif; notification bell with unread
count, avatar-initials menu) over a `max-w-6xl` content column with 24 px
padding on the cream canvas. Mobile (< 1024 px): the sidebar becomes a
shadcn Sheet behind a hamburger; tables scroll horizontally inside their
container; stat cards stack. Cards: surface color, 1 px warm hairline
border, 10 px radius, **no shadow** — separation comes from the border and
whitespace, matching the reference's flatness. Table rows 48 px (`h-12`),
hover the canvas cream `#F0EDE8`, no zebra striping.

### Editorial register — two tiers of treatment

The **public pages** carry the reference's full editorial rhythm: a small
uppercase, wide-tracked Manrope over-line in the muted tone above each
serif headline; the two-colour headline motif on the hero (first clause
ink, second clause rust); inline emphasis set in Libre Baskerville italic
*and* the rust colour together, confined to a handful of phrases per page;
full-bleed alternation between the cream canvas and the near-black surface
(the counter strip and the category grid sit on dark bands, their figures
in cream monospace); and calls to action that end in a typographic arrow
("Register →" — a character, not an icon). The **application pages** (the
member portal and admin console) take only the palette and the type
system: the functional layout is untouched, and the italic-plus-rust
mechanic does not appear there. Structural emphasis in running text
remains bold Manrope everywhere.

### Status and category vocabulary

Status badges are soft-tinted pills, identical everywhere (tables, detail
headers, dashboards, charts). The five semantic hues survive the warm
palette; the tints are warmed to sit on the cream canvas, "closed" is
built from the palette's warm greys, and pending's badge text is darker
than its chart hue because amber-700 misses 4.5:1 on any warm tint. Every
text-on-tint pairing measures ≥ 4.5:1.

| Status | Badge text | Tint | Chart/timeline hue |
|---|---|---|---|
| Pending | `#92400E` | `#F8EFDC` | `#B45309` |
| Under review | `#0369A1` | `#E9F1F4` | `#0369A1` |
| In progress | `#4338CA` | `#ECEDF8` | `#4338CA` |
| Resolved | `#047857` | `#E9F2EA` | `#047857` |
| Closed | `#57534E` | `#EAE6DE` | `#57534E` |

Categories map to fixed lucide icons used identically on Home, forms,
tables, and detail pages: infrastructure `Construction`, sanitation
`Trash2`, security `Shield`, water supply `Droplets`, electricity `Zap`,
environment `Leaf`, health `HeartPulse`, education `GraduationCap`, other
`CircleDot`. Status charts use the chart hues above; categorical charts
use a warm rust sequential ramp (`CHART_RAMP` in `constants.ts`), dark →
light with every step ≥ 3:1 against the card surface — identity in those
charts is carried by axis labels, so the ramp decorates magnitude rather
than encoding category.

### Signature elements

1. **The case number**: every report displays as `LA-` + id zero-padded to
   four digits (`LA-0042`) — tables, detail headers, notification text —
   set in Roboto Mono with tabular figures, the register number of an
   official record (`CaseNumber` component, `caseNumber()` in
   `format.ts`).
2. **The status timeline**: a vertical rail on report detail built from
   `report_status_history`, whose first node is the submission itself
   (actor = reporter). Each node is a small filled circle in the status
   color with label, actor, and timestamp; the current status is
   emphasized with a ring and a "current" tag.

Everything else stays quiet.

### Interface writing

Active voice, sentence case, plain verbs; a control names exactly what it
does and keeps that name through the flow ("Submit report" → toast "Report
submitted"; "Publish announcement" → "Announcement published"). Errors
state what happened and what to do next, without apology or vagueness.
Empty states are invitations with the relevant action ("No reports yet.
When you submit one, you can track it here." + Submit report). Loading uses
skeletons via `loading.tsx` on dashboards and tables, plus pending states
on every submit control. Quality floor: responsive to 360 px, visible
keyboard focus on every interactive element, labelled form controls
(`sr-only` where visually absent), WCAG AA contrast on the sidebar and
every badge pairing.

### Charts

Recharts 3, all with `isAnimationActive={false}` — required by the
no-animation rule, and also the reliable-paint fix for Recharts 3 under
React 19 (see §16). The donut uses fixed pixel radii (55/85) inside a fixed
`h-64` container and strokes its slices with the surface color; axes and
grids use the warm line/muted colors; numeric ticks and tooltips are set
in the monospace; tooltips share one warm bordered style on the surface
color. The 30-day trend line draws in the rust accent.

---

## 13. Seed data (`scripts/seed.ts`)

Deterministic: fixed literals, no randomness. Day *offsets* are relative to
the run date so the 30-day chart and "upcoming meetings" always contain
data, but every run from the same day is identical. Seeding refuses to run
on a non-empty database (use `db:reset`).

- **1 administrator** — Grace Nakato, `admin@lightacademy.ac.ug` /
  `Admin#2026`.
- **6 members** — password `Member#2026`: Amina Kintu, Okello James, Betty
  Namusoke, David Ssemwanga, Florence Achieng, and Peter Wasswa
  (deactivated, to demonstrate refused login while his reports remain).
  Every password is hashed individually, so salts are per-user even in
  seed data.
- **24 reports** across all nine categories and all five statuses
  (6 pending, 5 under review, 3 in progress, 7 resolved, 3 closed),
  submitted over the past 60 days, each written as a plausible, specific
  community issue (a broken borehole pump, a collapsed culvert, streetlight
  outages — registry entries, not lorem ipsum). Amina holds two pending
  reports so the delete-while-pending demonstration works on seed data.
- **Coherent status history** for every non-pending report (transitions in
  timestamp order, actor = the admin), including one case closed without
  resolution (dismissed) so "closed" ≠ "resolved" in the analytics cohort.
- **Comment threads on 7 reports** showing both voices.
- **4 announcements** and **3 meetings** (two future, one past), authored
  by the admin.
- **8 notifications** consistent with the events above: unread for Amina
  (2) and Betty (1), read for Okello (2), and a mix for the admin's bell.
- Seeded reports carry **no images** (`image_path` null) so the upload
  path is exercised live during a demonstration.

`scripts/reset.ts` deletes `app.db` (and `-wal`/`-shm`/`-journal`) with
Node `fs`, then runs `drizzle-kit push --force` and the seed — identical on
Windows, WSL, macOS, and Linux.

---

## 14. Security posture (summary)

- scrypt-hashed passwords, per-user salt, parameters stored with the hash,
  constant-time comparison.
- Opaque session tokens stored only as SHA-256 hashes, in httpOnly
  SameSite=Lax cookies; SameSite plus Next.js's same-origin enforcement on
  server actions is the CSRF posture.
- Every server action re-checks authentication, role, and ownership
  independently of the UI; the proxy is a convenience, not a boundary.
- Object-level authorization on report reads and image reads happens
  inside the queries (IDOR-proof by construction); unauthorized and
  nonexistent resources are indistinguishable (same not-found page / same
  404).
- Parameterized queries throughout via Drizzle; no string-built SQL.
- Upload constraints of §10; images served only through the authenticated
  handler with `nosniff`.
- Open-redirect guard on `next`; per-email login rate limiting with
  lockout; generic credential-failure message; deactivation message only
  after password verification.
- Self-demotion/self-deactivation rejected server-side and hidden in the
  UI; session destruction on logout, password change, and deactivation.
- No secrets in the client bundle — the application has no secrets at all.
- React's default output encoding is the XSS posture;
  `dangerouslySetInnerHTML` appears nowhere.

---

## 15. Scripts

| Script | Command | Effect |
|---|---|---|
| `dev` | `next dev` | development server on :3000 |
| `build` | `next build` | production build; passes with zero TypeScript errors |
| `start` | `next start` | production server |
| `lint` | `eslint` | linting |
| `db:push` | `drizzle-kit push --force` | apply `schema.ts` to `data/app.db` |
| `db:seed` | `tsx scripts/seed.ts` | deterministic demo data (empty DB only) |
| `db:reset` | `tsx scripts/reset.ts` | delete DB → push → seed |

---

## 16. Deviations from the original build prompt, and why

An as-built record is only honest if it lists where and why the build
departed from its prompt. All four deviations are forced by the framework
or by verified runtime behavior; none changes the product.

1. **`src/middleware.ts` → `src/proxy.ts`.** Next.js 16 renamed the
   convention and deprecates the old filename with a build warning. The
   file's content and role are exactly the specified middleware.
2. **Chart animation disabled.** Recharts 3 under React 19 painted blank
   or mis-sized charts on mount when its intro animation ran;
   `isAnimationActive={false}` fixes rendering — and the design rules
   prohibit that animation anyway.
3. **The admin status select is controlled, with a hidden input.** Radix
   Select's `defaultValue` renders no visible value during SSR (the item
   text registers only when the portal-rendered item list first mounts)
   and its hidden native select submits an empty string if the control is
   never opened. The form therefore keeps the status in React state,
   renders the label explicitly inside `SelectValue`, and submits through
   a plain `<input type="hidden" name="status">`. The form is keyed by the
   current status so it remounts cleanly after each change.
4. **`suppressHydrationWarning` on `<body>` and `turbopack.root` in
   `next.config.ts`.** Both silence machine-environment noise (browser
   extensions injecting attributes; stray lockfiles elsewhere on disk)
   without affecting behavior.

Minor: the shadcn `table.tsx` and `sonner.tsx` edits described in §2, both
consequences of the light-only palette decision.

The later retheme (`subq-retheme-prompt.md`) departed from its own prompt
in three measured places, none behavioural:

1. **Roboto Mono instead of the proposed JetBrains Mono** — the retheme
   prompt sanctioned substituting the reference's actual monospace once
   inspected; the reference's stylesheet declares `"Roboto Mono"`, which
   is available on Google Fonts.
2. **`--color-emphasis` is `#B8401C`, not the measured `#E04E1F`** — the
   reference's own accent orange reaches only ~3.9:1 on the cream canvas,
   below the prompt's non-negotiable 4.5:1 requirement for text; the
   shipped value is the same hue darkened just enough to pass.
3. **Table row hover renders the canvas cream `#F0EDE8`, not the prompt's
   `#EAE4DB`** — the prompt also required keeping `table.tsx` consuming
   the `bg-canvas` token rather than scattering a literal, and the token
   architecture won; the warm hover against the card surface is visibly
   equivalent. (`#EAE4DB` survives as the chart tooltip cursor fill.)

---

## 17. Verification regime

There is no automated test suite by design. "Done" was verified as:

1. `npm run build` — compiles with **zero TypeScript errors** under
   `strict`.
2. `npm run db:reset` — clean push + seed on a fresh clone.
3. The full acceptance walkthrough, executed against the running app:
   registration lands authenticated on `/portal`; a report submitted with
   a JPEG produces a case number, pending badge, visible image, and
   one-node timeline; the admin's totals include the new report and a
   status change with comment writes history, thread, and the owner
   notification; the member's bell shows unread, the two-node timeline and
   comment render, and a reply notifies the admin; resolving updates the
   dashboard's resolved count; a member hitting `/admin/*` is redirected
   to `/portal`; a guest hitting `/portal/*` is redirected to
   `/login?next=…` and returns to the exact page after login; image URLs
   answer 404 to guests, other members, and traversal attempts, 200 with
   `nosniff` to owner/admin; a member can delete their own pending report
   and the control is absent on any non-pending report; deactivating a
   member kills their live session on the next request and the admin's own
   row exposes no deactivate/demote controls; the seeded deactivated
   member's login is refused with the exact deactivation message; the
   seeded past meeting appears under "Past meetings".

## 18. Known limitations (accepted non-goals)

No email delivery (hence no verification or self-service password reset);
no real-time transport (notifications appear on navigation/refresh); no
internationalization; no dark mode; no attachment types beyond the three
image formats; no deployment configuration, Docker, or CI; no automated
tests; no public API; no hard deletion of user accounts; in-memory login
rate limiting (resets on restart); single-node SQLite.
