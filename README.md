# Community Problem Reporting and Communication System

## Light Academy Secondary School

A web application through which community members report local problems to
the administration of Light Academy Secondary School, track those reports
through a defined lifecycle, exchange messages with administrators about
them, and view announcements and upcoming local council meetings.
Administrators triage reports, manage users, publish announcements, schedule
meetings, and read summary statistics.

## Setup

Prerequisites: Node.js 20 or newer. Nothing else — no environment variables,
no external services.

```
npm install
npm run db:reset     # creates the SQLite file, applies the schema, seeds demo data
npm run dev          # application available at http://localhost:3000
```

`npm run build` compiles the production build with zero TypeScript errors.

### Scripts

| Script | Effect |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` / `npm run start` | Production build and server |
| `npm run db:push` | Apply the schema in `src/db/schema.ts` to `data/app.db` |
| `npm run db:seed` | Insert the deterministic demo data (empty database only) |
| `npm run db:reset` | Delete the database, then push and seed — identical on Windows, WSL, macOS, and Linux |

## Seeded credentials

| Role | Email | Password | Note |
|---|---|---|---|
| Administrator | `admin@lightacademy.ac.ug` | `Admin#2026` | |
| Member | `amina.k@example.com` | `Member#2026` | Has pending, open, and resolved reports |
| Member | `okello.j@example.com` | `Member#2026` | |
| Member | `betty.n@example.com` | `Member#2026` | Has an unread notification |
| Member | `david.s@example.com` | `Member#2026` | |
| Member | `florence.a@example.com` | `Member#2026` | |
| Member | `peter.w@example.com` | `Member#2026` | Deactivated — login is refused |

The seed is deterministic: fixed literals, no randomness, day offsets relative
to the run date so charts and upcoming meetings always contain data. Seeded
reports carry no images so the upload path is exercised live during a
demonstration.

## What the system does, per role

**Guest.** Reads the public pages: the home page with live counters, the
About page, registration, and login. Everything else redirects to login.

**Member.** Registers and signs in to a portal with a dashboard (report
counts, latest announcements, next meetings, recent reports, notifications).
Submits reports with a title, category, location, description, and an
optional photo. Each report becomes a numbered case (`LA-0042`) with a status
timeline and a message thread shared with the administration. Members are
notified on every status change and reply, may comment until a case is
closed, and may delete a report only while it is still pending.

**Administrator.** Sees a dashboard with totals and charts, a paginated and
filterable register of all reports, and each case in full. Changes a case's
status (optionally with a comment in the same submission), which writes the
audit trail and notifies the reporter. Manages users (deactivate/reactivate,
change role — never their own account), publishes announcements, schedules
meetings, and reads analytics including the average resolution time.

## Architecture

A single full-stack TypeScript application: Next.js (App Router), SQLite via
Drizzle ORM, Zod for validation, Tailwind CSS v4 with shadcn/ui primitives,
and Recharts for charts. There is no separate backend service, no second
language, and no cross-origin traffic.

**Why one application instead of a separate frontend and API.** A same-origin
application eliminates CORS, token storage in the browser, and a
hand-maintained client–server contract — the three largest defect classes in
the two-server design this one replaces. One language end to end means the
validation schema, the types, and the database model cannot drift apart.

**Why SQLite.** At this scale it is the correct database, and a single file
(`data/app.db`) makes the project trivially portable and demonstrable. It is
accessed through the `@libsql/client` driver with a `file:` URL, chosen over
`better-sqlite3` to avoid native-module compilation on student machines
(Windows and WSL included).

All reads happen in server components through the data-access layer in
`src/lib/data/`; all writes happen in server actions in `src/lib/actions/`.
The only route handler is the authenticated image endpoint
(`src/app/uploads/[filename]/route.ts`). One file, `src/lib/validation.ts`,
holds every input constraint; one file, `src/lib/constants.ts`, holds the
status and category vocabulary used by the schema, the validation, and the
interface alike.

One naming note: the request gate lives in `src/proxy.ts` because Next.js 16
renamed the `middleware.ts` convention to `proxy.ts`. Its role is unchanged —
a coarse redirect based on the presence of the session cookie, never a
security boundary.

## Two data-model decisions

**Feedback is a thread, not a column.** The system's stated purpose is
communication, and communication is a thread. Administrator feedback is
therefore not a single overwritable field on the report but a
`report_comments` table in which both parties participate, rendered as the
message thread on every case.

**Status changes are recorded, not overwritten.** Every transition is written
to `report_status_history`. That one table yields an audit trail, the status
timeline on the report page, and the average-resolution-time statistic on the
analytics page at no extra cost.

## Sessions, not JWTs

The naive design for a system like this uses JWTs. In a same-origin
application, a bearer token held by browser JavaScript is strictly worse than
an httpOnly session cookie: it is exposed to any script injection, it cannot
be revoked server-side without rebuilding the very session store it was meant
to avoid, and it complicates every request. This application uses
database-backed sessions: an opaque 32-byte random token in an httpOnly,
SameSite=Lax cookie, stored server-side only as its SHA-256 hash — a database
leak therefore reveals no usable tokens. Sessions last seven days with
sliding renewal and are destroyed on logout, password change, and account
deactivation.

## Security

- Passwords are hashed with scrypt (N=16384, r=8, p=1, 16-byte per-user salt,
  64-byte key), stored as `scrypt:N:r:p:salt:hash` so parameters travel with
  the hash, and verified with a constant-time comparison. argon2id is the
  production-grade successor; scrypt was chosen here because it ships with
  Node and requires zero native compilation.
- Session tokens are opaque and stored only as SHA-256 hashes, in httpOnly
  SameSite=Lax cookies. SameSite plus Next.js's same-origin enforcement on
  server actions is the CSRF posture.
- Every server action independently re-verifies the session, the role, and
  resource ownership before touching a row — a client that never rendered a
  button can still invoke the action. The middleware performs only an
  optimistic cookie-presence redirect and is not a security boundary.
- Object-level authorization is enforced inside the queries: a member's
  report reads and image reads are scoped to their own rows, so one member
  can never enumerate another's reports (IDOR).
- All queries are parameterized through Drizzle; no SQL is built from
  strings.
- Uploads are limited to 5 MB and to JPEG, PNG, and WebP, verified by magic
  bytes — never by the client-supplied filename or MIME type. Files are
  stored under a generated UUID name outside the public directory and served
  only through an authenticated route handler with
  `X-Content-Type-Options: nosniff`; the original filename is never stored.
- The login `next` parameter is honoured only when it begins with a single
  `/`, rejecting `//` and absolute URLs (open-redirect guard).
- Login is rate-limited per email: five failures within fifteen minutes lock
  that email for fifteen minutes.
- Administrators cannot deactivate or demote their own account; deactivation
  and password change destroy the affected sessions immediately.
- There are no secrets in the client bundle — the application has no secrets
  at all: no API keys, no token-signing keys, no external services.
- React's default output encoding is the XSS posture;
  `dangerouslySetInnerHTML` is not used anywhere.

## Known limitations

- No email delivery of any kind, hence no address verification and no
  self-service password reset. A forgotten password is reset by an
  administrator by other means; the walkthrough treats this as out of scope.
- Login rate limiting is held in memory and resets on server restart. The
  production alternative is a persistent store.
- SQLite runs single-node; the application is not designed for horizontal
  scaling.
- Notifications appear on navigation or refresh; there is no real-time
  transport.
