# Retheme Prompt — Adopting the *Subquadratic* Visual Language

## Community Problem Reporting and Communication System · Light Academy Secondary School

This document is a complete instruction set for re-skinning the existing application so that its
typography, colour, and overall visual character match the reference site **subq.ai**, while leaving
every behaviour, route, query, and security property untouched. It is written to be handed directly
to a coding agent working in the repository. Read it in full before making any edit; the ordering of
the sections mirrors the order in which the work should be undertaken.

The governing idea is a change of *register*, not of *structure*. The application today presents
itself as cool civic infrastructure — a public-works registry rendered in institutional navy and
slate. The reference presents itself as something more literary and considered: a warm, near-black
ink on a bone-cream page, large transitional-serif headlines carrying the voice, a quiet geometric
sans carrying the information, and a single burnt-orange accent used with great restraint. The task
is to move the application from the first register to the second without disturbing what the
application *does*.

---

## 1. Non-negotiable boundaries — what must not change

This is a presentation-only exercise. The following are out of scope and must remain byte-for-byte
as they are: every server action under `src/lib/actions/`, the entire data-access layer in
`src/lib/data/`, the Drizzle schema in `src/db/schema.ts`, the authentication and session machinery
(`auth.ts`, `session.ts`, `passwords.ts`, `rate-limit.ts`), the Zod validation in `validation.ts`,
the upload handling and the authenticated image route, and the request gate in `proxy.ts`. No query
is to be altered, no authorisation check relaxed, no field renamed, and no new runtime or development
dependency introduced. The typefaces arrive through the existing `next/font/google` mechanism and the
Tailwind v4 `@theme` block; nothing else is added to `package.json`.

The application's existing quality invariants survive the retheme unchanged and are to be treated as
acceptance criteria in their own right. It remains light-theme only. It carries no animation beyond
the existing colour and opacity transitions of roughly one hundred and fifty milliseconds, and it
must continue to honour `prefers-reduced-motion` globally by collapsing those transitions. It must
remain usable and uncramped down to a three-hundred-and-sixty-pixel viewport, every interactive
element must retain a visible keyboard-focus indicator, and every text and badge pairing must continue
to meet WCAG AA contrast. Because the new palette is warm and comparatively low in raw luminance
range, contrast is the single most likely thing to regress; it is called out repeatedly below and must
be verified rather than assumed.

---

## 2. Where every change belongs — the single sources of truth

The application was built so that its design decisions live in three files, and this retheme must
respect that discipline rather than scattering literal colours and font names across components. Every
colour is defined once, as a `--color-*` custom property inside the `@theme` block of
`src/app/globals.css`; Tailwind v4 turns each of these into `bg-*`, `text-*`, and `border-*` utilities
automatically. The consequence, which the agent must internalise, is that **changing the value of a
token silently updates every component that already consumes its utility** — so the majority of this
retheme is accomplished by rewriting values in one file, not by editing components. The typefaces are
declared once in `src/app/layout.tsx` and exposed as CSS variables that the `@theme` block maps onto
Tailwind's `font-display`, `font-sans`, and `font-mono` tokens. The status and category vocabulary —
badge colours, chart hues, and icons — lives once in `src/lib/constants.ts`. Component files are
edited only where markup itself must change (the public pages and the application shell); everywhere
else, the token rewrite carries the work.

A specific architectural subtlety must be preserved. The project deliberately reserves the token
`--color-muted` for a *text* colour, and for that reason the shadcn `table.tsx` was edited to use
`bg-canvas` and `bg-secondary` for its hover and footer surfaces rather than the conventional
`bg-muted/50`. Keep this arrangement intact: change the hex values, never the token roles, and do not
reintroduce `bg-muted` as a surface anywhere.

---

## 3. Typography — the serif/sans/mono system

The reference is built on a three-part type system, and adopting it is the change that does the most
visual work. Large statements — the hero line, section display headings, page titles — are set in
**Libre Baskerville**, a transitional serif with high stroke contrast and a screen-tuned x-height,
falling back through Georgia to a generic serif. Running text, form controls, navigation, table
content, and the small over-line labels are set in **Manrope**, an open-source geometric-humanist
sans that recedes into pure legibility beneath the serif. Technical and aligned figures — case
numbers, dashboard stat figures, and chart numerals — are best carried by a **monospace** with
reliable tabular figures, both because it matches the reference's treatment of its own technical
numbers and because it guarantees the column alignment the application's tables depend on.

Replace the current Libre Franklin and Public Sans declarations in `src/app/layout.tsx` with the
following, and apply all three variable class names to the root element exactly as the two existing
fonts are applied today:

```ts
import { Libre_Baskerville, Manrope, JetBrains_Mono } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
```

Then, in the `@theme` block of `src/app/globals.css`, point the Tailwind font tokens at the new
variables:

```css
@theme {
  --font-display: var(--font-libre-baskerville);
  --font-sans:    var(--font-manrope);
  --font-mono:    var(--font-jetbrains-mono);
  /* colour tokens follow in §4 */
}
```

The important move here is that the Tailwind token *names* — `font-display`, `font-sans`,
`font-mono` — are retained; only what they resolve to changes. Every existing `font-display` and
`font-sans` utility in the codebase therefore adopts the new faces with no further edits. The
remaining typographic work is to route the numeric identity elements onto `font-mono`: apply it to the
`CaseNumber` component, to the figures inside `StatCard`, and to any Recharts tick and tooltip
formatters, each with `tabular-nums` retained so the figures stay aligned.

Two constraints follow from the faces themselves and must be observed. Libre Baskerville ships only in
weights four hundred and seven hundred, so hierarchy among headings is expressed through *size and
italic*, never through the intermediate weights the old sans offered; prefer weight four hundred at
the largest display sizes, in keeping with the reference's restraint, and reserve seven hundred for
smaller, more emphatic headings. Manrope carries no true italic, which matters for the emphasis
mechanic described in §7: inline italic emphasis should be set in Libre Baskerville italic within the
sans body, an intentional serif-italic-within-sans contrast rather than a synthesised oblique.

---

## 4. Colour — the warm editorial palette

Rewrite the colour tokens in the `@theme` block from the current cool civic set to the warm set below.
The left column is the token as it exists today; the centre column is its new value; the right column
records the surface each value is intended to sit on, which is what makes the contrast obligations
concrete. Where a value is marked *approximate*, it is a considered estimate that should be replaced
with a measured value per §10; everything unmarked is settled.

| Token | Current | New | Intended use / background |
|---|---|---|---|
| `--color-ink` | `#0F172A` | `#0F0E0D` | primary text, on canvas |
| `--color-muted` | `#475569` | `#57534E` | secondary text, on canvas — warm grey, verify AA |
| `--color-canvas` | `#F8FAFC` | `#F0EDE8` | page background (the bone-cream "paper") |
| `--color-surface` | `#FFFFFF` | `#FBFAF7` | cards and topbar — a warm white lifted just off the canvas |
| `--color-secondary` | *(cool subtle)* | `#EFEAE2` | table footer / subtle fills |
| `--color-line` | `#E2E8F0` | `#E4DED4` | hairline borders (warm) |
| `--color-primary` | `#1D4ED8` | `#0F0E0D` | solid button fill (near-black, as the reference) |
| `--color-primary-hover` | `#1E40AF` | `#26221E` | button hover |
| *primary foreground* | *(white)* | `#F0EDE8` | cream label on the near-black button |
| `--color-sidebar` | `#172554` | `#0F0E0D` | near-black sidebar |
| *sidebar text* | `#E2E8F0` | `rgba(240,237,232,0.80)` | cream at ~80% opacity |
| `--color-sidebar-active` | `#1E3A8A` | `#26221E` | active-item pill (raised warm dark) |
| `--color-ring` (focus) | `#3B82F6` | `#0F0E0D` | visible focus — ink is the safest AA choice |
| *destructive* | `#DC2626` | `#DC2626` (or warm `#C0362C`) | confirmation dialogs only |
| `--color-emphasis` *(new)* | — | `#C4451F` *(approximate)* | rust editorial accent — text emphasis, accent heading line |
| `--color-emphasis-hover` *(new)* | — | `#A63A18` *(approximate)* | hover / pressed state of the accent |
| *row hover* | `#F8FAFC` | `#EAE4DB` | warm row hover (no zebra striping) |

The reference derives its muted, secondary text not from a distinct grey but from its foreground
colour dropped in opacity, and this is worth honouring precisely where text sits on the dark sidebar:
use cream at roughly eighty per cent for idle navigation text and full cream on hover and when active,
rather than inventing a separate mid-grey. On the light canvas, by contrast, a solid warm grey
(`--color-muted` above) is more predictable than compositing opacity and should be used for secondary
text; confirm it clears the four-and-a-half-to-one ratio against the cream canvas before accepting it.

A caution about the two accent tokens. The reference reserves its burnt orange almost entirely for
inline text emphasis and for the second line of a two-line display heading; it is never the fill of a
primary button. Introduce `--color-emphasis` as a *new* token for exactly that editorial purpose, and
do **not** remap shadcn's internal `--accent` and `--accent-foreground` variables to it — those
continue to drive the subtle neutral hover states of menu items and similar primitives and must stay
quiet warm neutrals. Conflating the two would turn every dropdown hover rust.

Finally, wire the shadcn semantic variables to the same source so the generated primitives and the
bespoke components draw from one palette, keeping the existing mapping architecture and only updating
values: background from canvas, foreground from ink, card and popover from surface with ink
foreground, primary from the near-black primary with the cream foreground, secondary from the warm
secondary, muted-foreground from the warm muted text, accent from a subtle warm neutral (not the
rust), destructive from destructive, and border, input, and ring from line and ink respectively.

---

## 5. Flatness, borders, and radius — the editorial surface

The reference is visually flat. It separates content with generous whitespace, full-bleed bands of
colour, and thin rules, not with drop shadows. The application today lifts its cards with `shadow-sm`;
to match the reference, retire that shadow in favour of the one-pixel warm hairline border already
specified by `--color-line`, and lean on vertical spacing and the occasional horizontal rule to
create separation. Increase the vertical rhythm between sections and cards modestly so the page
breathes the way the reference does rather than filling every pixel.

The corner radius should tighten. The current half-rem base gives twelve-pixel cards and six-pixel
controls, which reads as contemporary SaaS; reduce `--radius` to `0.375rem` for a crisper, more
printed feel, or to `0.25rem` if a sharper, more documentary character is wanted. Because the shadcn
radius scale is derived from this single variable, everything rescales proportionally from the one
change.

---

## 6. Two tiers of treatment — public pages versus the application

A marketing site and a working portal are not the same object, and the retheme must acknowledge this
rather than literally converting dashboards into a scrolling landing page. The instruction is to apply
the reference's full editorial rhythm to the *public* surfaces and to apply its palette and typography,
but not its landing-page choreography, to the *application* surfaces.

On the public pages — the home page, the about page, and the login and registration screens — adopt
the reference's editorial devices wholeheartedly. Set the hero and section headlines large in Libre
Baskerville. Precede each major section with a small uppercase, wide-tracked Manrope over-line in the
muted tone, in the manner of the reference's "USE CASES" and "ARCHITECTURE" labels, so each section is
quietly announced above its serif headline. Where a headline naturally divides into two clauses, set
the first clause in ink and the second in the rust emphasis colour, reproducing the reference's "Not
just another model. / An architectural breakthrough." motif. Let the page alternate full-bleed between
the cream canvas with dark ink and the near-black surface with cream text as it descends, which is the
mechanism behind the reference's sense of rhythm. Continue to observe the application's own content
rules while doing so: the home page keeps its live three-figure counter strip, its numbered
"how it works" steps, and its nine-category icon grid, and it invents no testimonials or quotations.

On the application pages — the member portal and the admin console — retain the existing functional
layout entirely. The fixed sidebar, the sticky topbar, the content column, the data tables, the stat
cards, the charts, and the forms all stay where they are and behave as they do. What changes is only
their finish: the sidebar becomes near-black with cream navigation text, the canvas becomes cream,
cards become bordered warm-white panels without shadow, buttons become near-black with cream labels,
figures move onto the monospace, and section or page titles move onto the serif. The editorial
choreography of §6's first paragraph — alternating bands, two-colour headlines — is deliberately *not*
carried into the working screens, where it would impede legibility and scanning.

---

## 7. Emphasis and the signature motifs

Emphasis in the reference is carried in two ways that should both be reproduced, and the distinction
between them matters. Structural emphasis within running text — a defined term, a load-bearing phrase —
remains bold, set in a heavier Manrope weight, exactly as the application already emphasises text
today. Editorial emphasis on a key phrase is different: it is rendered in italic *and* in the rust
emphasis colour together, and, per §3, that italic is Libre Baskerville italic set inline within the
Manrope body. Reserve this second treatment for the public pages and use it sparingly, in the spirit
of the reference, where it appears only on a handful of phrases per page.

The arrow glyph is a genuine signature and should be used consistently: as the marker that opens items
in a feature list and as the trailing element on calls to action, so that a primary action reads
"Request early access →" rather than carrying an icon component. This is a typographic character, not
an SVG, and costs nothing to adopt.

The application's own two signature elements survive and are simply refinished. The case number
continues to render as `LA-` followed by the zero-padded identifier, and continues to appear in
tables, detail headers, and notification text; it now sets in the monospace with tabular figures,
which suits an official registry number and guarantees alignment. The status timeline remains the
vertical rail built from the status history, with its first node the submission itself and its current
node emphasised; only its colours shift with the palette. Everything else stays quiet, which is itself
part of the reference's discipline.

---

## 8. Status and category vocabulary under the warm palette

The five status badges encode meaning and must remain legible and distinct, so the instruction is to
preserve the semantic hue system rather than flatten it into the monochrome of the reference. Keep the
existing five hues — the amber of pending, the sky of under-review, the indigo of in-progress, the
emerald of resolved, and the neutral of closed — because they carry information a single accent could
not. Two adjustments are warranted. The pale tint backgrounds were chosen against a cool white and
should be nudged warmer so they sit comfortably on the cream canvas and warm-white cards rather than
appearing faintly blue against them; and the neutral "closed" badge in particular should be rebuilt
from the warm greys of the new palette rather than the cool slate it uses today. After any adjustment,
re-verify that each badge's text-on-tint pairing still meets AA, since the tints are moving.

The category icons are unchanged; the fixed lucide vocabulary is part of the application's identity and
carries across cleanly. The charts should continue to use the status hues for status-coded views. The
categorical ramp, presently a range of blues, may be retained for continuity or retuned toward a warm
or warm-neutral progression to sit better within the new palette; either is defensible, and this is
noted among the open decisions in §11.

---

## 9. Accessibility and the invariants to re-verify

Because the palette is warm and its raw luminance range is narrower than the outgoing cool set, treat
the following as a checklist to *measure*, not to assume. Primary ink on the cream canvas and cream on
the near-black sidebar both sit at very high contrast and are safe. The warm muted text on cream, the
eighty-per-cent cream navigation text on the near-black sidebar, every status badge's text on its
newly warmed tint, and the rust emphasis colour wherever it carries actual text rather than mere
decoration must each be checked against the four-and-a-half-to-one threshold for normal text. The
focus ring must remain plainly visible on both the cream and the near-black surfaces; ink serves on
cream, and a cream or high-contrast ring serves on the dark sidebar. Reduced-motion behaviour, the
light-only constraint, the three-hundred-and-sixty-pixel floor, and the labelling of every control all
remain exactly as specified in the as-built document and must survive untouched.

---

## 10. Values to replace with measured data

Two values in this document are estimates rather than measurements, because they could not be read
from the reference's stylesheet directly, and both should be replaced once captured. The rust emphasis
colour (`--color-emphasis`) is given as `#C4451F`, a considered approximation of the reference's burnt
orange; to obtain the exact value, open the reference, inspect either the accented second line of a
two-line heading — the element carrying the class in the family of `arch__display-line` — or one of the
inline italic emphasis phrases, and copy the computed `color`. The monospace family is proposed as
JetBrains Mono, a tasteful and freely available pairing, but the reference's own technical figures are
set in a mono this document could not identify; if fidelity there matters, inspect one of the
reference's numeric or code-like figures, read its `font-family`, and substitute that family in the
`next/font/google` import if it is available there. Neither substitution affects any other part of this
plan.

---

## 11. Decisions left open for the maintainer

A small number of choices are genuine matters of taste rather than correctness, and are surfaced here
so they can be settled deliberately rather than by the agent's default. The face of the case number and
of the large dashboard stat figures is the first: this document recommends the monospace for both, for
alignment and for the technical-registry character, but Libre Baskerville is the more overtly literary
alternative and would lean the identity further toward the documentary. The corner radius is the
second, offered at `0.375rem` with a sharper `0.25rem` as the more editorial option. The categorical
chart ramp is the third, retained as blues for continuity or retuned warm for palette coherence.
Whether the italic-plus-rust emphasis mechanic appears at all within the working application screens,
rather than only on the public pages, is the fourth; the recommendation is to confine it to the public
pages.

---

## 12. Acceptance

The retheme is complete when the following all hold. `npm run build` compiles with zero TypeScript
errors under strict mode, exactly as before. `npm run db:reset` still produces a clean push and seed on
a fresh clone, confirming that nothing in the data or schema path was disturbed. A visual pass over the
public pages shows the serif headlines, the uppercase over-line labels, the two-colour headline motif,
the alternating cream-and-near-black bands, and the arrow-suffixed calls to action. A visual pass over
the portal and admin screens shows the near-black sidebar with cream navigation, the cream canvas, the
bordered shadowless cards, the near-black cream-labelled buttons, and the monospace case numbers and
figures, all atop the unchanged functional layout. A contrast pass confirms every pairing named in §9
meets AA. And a behavioural spot-check — submitting a report, changing its status, receiving the
notification, and traversing the authorisation redirects — confirms that the application does exactly
what it did before, because nothing but its appearance was ever touched.
