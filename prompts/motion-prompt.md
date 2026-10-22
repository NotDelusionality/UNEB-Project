# Motion Prompt — Breathing Life into the Interface

## Community Problem Reporting and Communication System · Light Academy Secondary School

This document is a complete instruction set for adding a layer of *motion* to the application: the
small, purposeful animations that make an interface feel responsive and alive rather than static and
inert. It is written to be handed directly to a coding agent, and it is also written to be legible to
a maintainer who does not think of themselves as a designer, so it explains the reasoning behind each
choice before giving the instruction. Read it in full before making any edit. As with the earlier
retheme, this is a presentation-only exercise: it changes how the interface *feels*, never what it
does.

A word on why the interface currently feels flat, because understanding the cause points directly at
the cure. The application today is visually considered but temporally dead — nothing acknowledges a
press, nothing arrives, nothing responds. A screen that never moves gives the user no confirmation
that their actions registered and no sense of continuity as content changes, and the cumulative effect
reads as lifelessness even when every static pixel is correct. The remedy is not to animate
everything; it is to introduce motion at the precise moments where it carries meaning, and to keep it
restrained enough to match the dignified, editorial character the application has earned.

---

## 1. Boundaries — what must not change, and three hard motion constraints

This is a presentation-only exercise, and the boundaries of the earlier work carry over unchanged.
Nothing under `src/lib/actions/`, `src/lib/data/`, `src/db/`, the authentication and session
machinery, the Zod validation, the upload handling, or the request gate is to be touched. No query,
route, or authorisation check moves. No behaviour changes; a report is submitted, a status is
advanced, and a redirect is followed exactly as before, because motion is decoration layered over an
interface that is already complete and already correct.

Three constraints specific to motion are absolute and are stated here so they are impossible to miss.

The first is the **reduced-motion contract**. A meaningful fraction of people experience discomfort,
nausea, or worse from interface animation, and the operating system exposes their preference through
`prefers-reduced-motion`. The application already honours this globally by collapsing transitions to a
near-instant duration, and every animation introduced by this document must fall under the same
contract: entrances become instant, scroll reveals show their content immediately, counting figures
jump straight to their final value, and any looping motion does not loop. This is not optional and is
the first thing to verify when the work is done.

The second is that **the charts' own animation stays switched off**. The spec records that Recharts 3
under React 19 painted blank or mis-sized charts on mount when its intro animation ran, which is why
every chart carries `isAnimationActive={false}`. That flag must remain exactly as it is on every
chart; the internal drawing animation is not to be re-enabled under any circumstances. Charts may still
participate in the motion system, but only through the container that holds them and the figures
beside them, never through Recharts' own animation engine — §5 makes this precise.

The third is that **no new runtime dependency is introduced**. It is tempting to reach for a
physics-based animation library, but the application's whole ethos is a minimal dependency surface and
a codebase a student can explain file by file, and a large motion library would violate both. The
`tw-animate-css` package is already installed and already drives the enter and exit keyframes of the
dialog, sheet, and dropdown; it, together with plain CSS transitions and keyframes and two very small
hand-written helper components, is entirely sufficient for everything described here. Physics-based
libraries such as Framer Motion are deliberately declined; if, much later, the application wants
gesture-driven or spring-physics motion, that is the moment to revisit the decision, but it is out of
scope now.

---

## 2. The intuition — what motion is for

Because the maintainer is not a designer, it is worth making the governing principle explicit, since
every specific instruction below is an application of it. Motion in an interface earns its place by
doing one of four jobs, and motion that does none of them is noise to be removed.

Its first job is **feedback**: confirming that an action was received. When a button dips slightly as
it is pressed, or a control shows a spinner while its work is underway, the interface is answering the
user's implicit question — *did that work?* — and the answer, delivered in motion, is more immediate
and more trusted than any static change.

Its second job is **directing attention**: drawing the eye to what is new or what has changed. When a
freshly appeared notification count gently scales into view, or the sequence of steps in a process
reveals one after another, motion is guiding the reader's focus in the order that makes sense, doing
work that static layout alone cannot.

Its third job is **continuity**: explaining where something came from or where it went, so that
changes feel like transformations of a coherent space rather than abrupt substitutions. When a panel
slides in from the edge it came from, or a page fades in as it replaces the last, the user's mental
model of the interface stays intact across the change.

Its fourth job is **personality**: expressing the character of the thing. A restrained, well-timed
lean of an arrow on a call to action tells the user, wordlessly, that care went into this product.
For an application whose character is a dignified public-works registry in an editorial register, this
personality is expressed through subtlety and precision, never through spectacle.

Four disciplines make the difference between motion that feels like craft and motion that feels like
chaos, and they run through every instruction below. **Timing**: feedback should be fast, on the order
of a tenth to a fifth of a second, while entrances and transitions can take a fifth to two-fifths of a
second; anything slower feels sluggish, and sluggish motion is worse than none. **Easing**: things
that arrive should decelerate as they settle, which reads as natural, so entrances use an ease-out
curve; things that move or morph use a symmetric ease-in-out; a gentle overshoot lends a tactile
liveliness to presses. Linear motion, which neither accelerates nor decelerates, feels mechanical and
is avoided except for genuinely continuous effects. **Stagger**: when several elements arrive together,
offsetting each one from the last by a few tens of milliseconds produces a pleasing cascade and
quietly guides the reading order, where a simultaneous arrival would feel abrupt. **Restraint**: a
small number of consistent motions, drawn from a shared vocabulary of durations and curves, reads as
intentional; a profusion of one-off motions reads as busy. This is why the very first thing to build
is a shared set of motion tokens.

---

## 3. Foundation — motion tokens, the reduced-motion rule, and two small helpers

Motion, like colour before it, must live in one place and be drawn from consistently rather than
scattered as magic numbers across components. Add a small set of motion tokens to
`src/app/globals.css`, define the handful of supplementary keyframes the design needs, and extend the
existing reduced-motion rule to cover them. Everything downstream references these tokens, so the feel
of the whole application can be tuned from one location.

```css
/* motion tokens — in :root (or the @theme block) of globals.css */
:root {
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);    /* decelerate — for things arriving */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* symmetric — for things moving/morphing */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* gentle overshoot — for presses and pops */
  --dur-fast: 120ms;  /* feedback: hover, press */
  --dur:      220ms;  /* default: most transitions */
  --dur-slow: 380ms;  /* entrances and reveals */
}

/* supplementary keyframes — at the top level of globals.css, outside @theme */
@keyframes shimmer {
  from { background-position: -150% 0; }
  to   { background-position:  250% 0; }
}
@keyframes bell-wiggle {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(6deg); }
  60% { transform: rotate(-4deg); }
  80% { transform: rotate(2deg); }
}

/* the reduced-motion contract — extend whatever already exists to guarantee these too */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;   /* finite: loops do not loop */
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The vocabulary the components will actually use is the `tw-animate-css` utility set that is already in
the project. Its `animate-in` together with `fade-in` and `slide-in-from-bottom-*` composes into the
gentle fade-and-rise that serves as the default entrance throughout; its `zoom-in` serves for things
that pop into being, such as a count badge; and its enter and exit keyframes already animate the
overlays. Prefer these utilities, paired with the duration and easing tokens above (expressed as
`duration-[var(--dur-slow)] ease-[var(--ease-out)]`), over hand-rolled keyframes, so the motion stays
consistent and the code stays legible.

A crucial distinction determines whether a given entrance needs JavaScript at all, and getting it
right keeps almost all of this work inside the server-first architecture. An entrance that should play
**when the element first appears on screen at load** needs no JavaScript: a CSS animation runs
automatically on mount, and a server component can even stagger a list by computing an
`animation-delay` per item from its index and setting it as an inline style, since the number of items
is known at render time. An entrance that should play **when the element scrolls into view further
down a long page** does need JavaScript, because something must watch the scroll position. Only the
second case requires a client component, and the whole application needs exactly two such components,
which centralise every line of motion JavaScript into two small, documented files.

The first is a reveal wrapper, `src/components/motion/reveal.tsx`, which watches for its content
entering the viewport and then transitions it from slightly-lowered-and-transparent to
in-place-and-opaque, honouring reduced motion by showing immediately and honouring performance by
disconnecting its observer once it has fired.

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]
                  ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}
    >
      {children}
    </div>
  );
}
```

The second is a counting figure, `src/components/motion/count-up.tsx`, which animates a number up to
its target when it enters view. It renders its final value on the server so that the figure is correct
with JavaScript disabled and so that the surrounding layout never shifts, and it resets and counts only
once, in view, with motion enabled.

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export function CountUp({ value, duration = 800, className = '' }: {
  value: number; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value); // final value for SSR / no-JS / reduced motion
  const started = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        setDisplay(0);
        const tick = (t: number) => {
          const p = Math.min((t - t0) / duration, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return <span ref={ref} className={`tabular-nums ${className}`}>{display}</span>;
}
```

Because the reveal wrapper starts its content hidden, it degrades imperfectly if JavaScript never runs;
the reduced-motion path mitigates the common case, and the wrapper should be reserved for below-the-fold
decorative content rather than anything essential, so that the page remains comprehensible even in the
rare event that the observer never fires.

---

## 4. Micro-interactions — the largest return, almost all in pure CSS

The single biggest improvement to perceived aliveness comes from making the interface respond to the
pointer and the keyboard, and almost all of it is achieved by adding transition classes to existing
components with no JavaScript whatsoever, which means it works within the server components untouched.
The governing rule of taste here is that motion on hover implies that a thing is interactive, so
hover motion belongs only on elements that are actually clickable; animating a static card's hover
misleads the user into expecting an action that does not exist.

Buttons are where feedback matters most. Every button should transition its background and transform
on the fast duration with the ease-out curve, should shift to its defined hover colour smoothly rather
than instantly, and should dip very slightly — a scale to about ninety-seven per cent — while actively
pressed, which gives the tactile sense of a physical key. The keyboard focus ring must remain and must
appear without delay, since a focus indicator that animates in slowly reads as unresponsive to
keyboard users. On the public pages, the calls to action end in a typographic arrow, and that arrow is
an opportunity for the application's one moment of playfulness: wrap the arrow in a span that
translates a few pixels to the right when its button is hovered, with the button carrying the `group`
class and the arrow carrying `transition-transform group-hover:translate-x-1`, so that the arrow leans
forward as if eager to proceed. It is a small thing that people notice.

Cards that link somewhere — the report cards, the dashboard's recent-report rows, the announcement and
meeting cards, the category tiles on the home page — should lift almost imperceptibly on hover, a
translate of half a pixel to two pixels upward combined with a slight darkening of their warm hairline
border toward the ink colour, transitioned on the default duration. Because the design is deliberately
shadowless, this restraint is essential; the lift and the border are the whole effect, and it should
read as a gentle response rather than a pop. On the category tiles specifically, letting the lucide
icon scale up modestly on hover, while the tile itself lifts, gives the home page's grid a satisfying
tactility.

The navigation, the icons, and the form fields each take a lighter touch. Sidebar items already raise
their text from the idle cream to full cream on hover; ensuring that shift is transitioned on the fast
duration is all that is required, and if the active item carries a rust accent bar, letting that bar
scale into place when the item becomes active adds a quiet sense of arrival. Icons that sit inside
interactive controls should inherit the control's hover transition for colour and, where appropriate,
a slight scale, while purely decorative icons stay still. Form inputs should transition their border
and ring on focus so that the field visibly wakes as the cursor enters it. The overlays — the dropdown
menu, the confirmation dialog, the mobile navigation sheet — are already animated by `tw-animate-css`;
the only work there is to confirm their durations sit comfortably alongside the new token scale so the
whole application feels of a piece.

---

## 5. Entrance choreography — content that arrives

Where micro-interactions make the interface respond, entrance animations make it feel composed, giving
the sense that a screen assembles itself with intent rather than simply blinking into existence. The
technique divides along the load-versus-scroll distinction established in §3.

On the public pages, which form the first impression and therefore deserve the most care, the content
above the fold animates on load. The hero assembles in sequence — the small uppercase over-line, then
the serif headline, then the supporting sentence, then the call to action — each using the
fade-and-rise entrance with a staggered delay of roughly eighty milliseconds between them and a
fill-mode that holds the starting state until each element's turn arrives, so the eye is led down the
hero in the order the content should be read. The sections further down the page, being below the
fold, are each wrapped in the reveal component so that they fade and rise into place as the reader
scrolls to them, and where a section contains a set of peers — the numbered how-it-works steps, the
grid of category tiles — staggering their reveals guides the eye across them in sequence. The
full-bleed dark bands that carry the headline figures are the natural home for the counting component:
as the counter strip scrolls into view, its numbers count up from zero to their live values, which
turns a static statistic into a small moment of demonstration.

On the application dashboards, the same fade-and-rise entrance gives the stat cards a composed arrival,
staggered on load but with the stagger kept tight — steps of around sixty milliseconds — so that five
cards finish settling almost at once rather than dragging. Here a nuance of taste matters: dense,
paginated data tables are instruments for scanning, and replaying a per-row cascade every time the
user pages through them quickly becomes irritating, so the admin tables should fade in as a whole
rather than row by row, reserving the gentle per-item stagger for the short, dashboard-level lists
where it delights rather than delays. The charts participate only through their surrounding container:
wrap each chart's card so that the card fades in as it arrives, while the chart inside continues to
render with its own animation switched off, and let the count-up of the figures beside the charts
supply the sense of life that the charts themselves cannot.

The report detail page holds the application's most rewarding entrance. The status timeline — the
vertical rail that narrates a case from submission through each transition — should reveal its nodes in
sequence down the rail, each fading and sliding gently into place a beat after the one above it, so
that the history of the case unfolds before the reader rather than appearing all at once. Because the
number of nodes is known when the page renders, this is achievable with no client JavaScript at all,
by setting each node's `animation-delay` from its index as an inline style in the server component; if
a further touch is wanted, the connecting line of the rail can appear to draw itself downward by
animating a vertical scale from a top origin. It is the one place where a slightly more expressive
entrance is warranted, because the motion mirrors the meaning.

---

## 6. State and feedback — motion that answers the user

The final category is the motion that responds to what the user does and to what changes underneath
them, and it is where the interface stops feeling like a document and starts feeling like a
conversation.

The loading skeletons are the easiest and most rewarding target. The application already shows
skeletons while dashboards and tables load, but a skeleton that merely sits there is only marginally
better than a blank space; giving it a shimmer — a soft highlight that sweeps across it, produced by a
warm gradient moving under the `shimmer` keyframe defined in §3 — makes the wait feel active and
premium. This is a change to the single `skeleton` component and therefore propagates everywhere
skeletons are used.

The forms should acknowledge their own submission. While a submit action is pending, which the
existing form plumbing already exposes, the button should show a small spinning indicator — a lucide
loader with the standard spin animation — alongside or in place of its label, so that the user sees
their submission is in flight; the terminal success or failure is already announced by a toast, so the
button need only cover the interval in between. The toasts themselves, provided by sonner, already
slide and fade and need no further work.

Two touches serve the notification bell, which is the application's live pulse. When the unread count
appears or increases, the small count badge should scale into being with the zoom entrance rather than
snapping on, and the bell itself may perform a single brief wiggle — a couple of small rotations under
the `bell-wiggle` keyframe — to draw the eye to the fact that something new has arrived. The wiggle
must be a one-shot, played when the page loads carrying unread items or when the count crosses from
zero, never a perpetual loop, and like everything else it falls silent under reduced motion.

Finally, the transitions between pages can be smoothed at the framework level. Adding a `template.tsx`
that wraps its children in a brief fade-in gives every navigation a gentle arrival, because Next.js
re-mounts a template on each navigation; kept fast and subtle, and neutralised under reduced motion,
it lends the whole application a sense of continuity as the user moves through it. A slim top-of-page
loading bar would deepen that effect but would mean either a new dependency or bespoke wiring, so it is
left out in favour of the template fade and the shimmer skeletons, which together already make
navigation feel responsive.

---

## 7. The obligations that constrain every animation

Several requirements apply to everything above at once and are gathered here so none is overlooked, and
they are the difference between motion that is a courtesy and motion that is a liability.

Reduced motion is honoured twice over: the global CSS rule of §3 neutralises transitions and
keyframes, and the two client helpers additionally short-circuit in JavaScript, showing content
immediately and skipping the count. This must be verified by actually toggling the operating system's
reduce-motion setting and confirming that the application becomes still and remains fully usable, with
figures at their final values and content visible.

Layout must never shift as a consequence of animation, since content that jumps as it settles is
worse than content that never moved. Every entrance animates only transform and opacity, never a
property such as height, width, margin, top, or left that would reflow the page; the counting figures
render their final value on the server and use tabular figures so their width is stable as the digits
change; and revealed content occupies its space before it becomes visible rather than being toggled in
and out of the layout.

Performance and accessibility set the remaining bounds. Animating transform and opacity keeps the work
on the compositor and off the main thread, so those two properties are strongly preferred and
expensive ones such as shadow or filter are avoided across many elements at once. Scroll-driven motion
uses the intersection observer of the helper components rather than scroll listeners, and those
observers disconnect once fired. The keyboard focus indicator remains immediate and clearly visible
throughout, never delayed or obscured by an animation, and the tab order is unchanged. And motion is
never placed on the critical path of interaction: nothing waits for an animation to finish before
becoming usable, because the motion is always a layer over an interface that already works.

---

## 8. Where motion does not belong

Restraint is as much a part of this brief as the motion itself, and a few places are deliberately left
still. Rapidly repeating events should not each trigger motion — validation messages may fade in once
as they appear but must not jitter as the user types, and nothing should animate on every keystroke.
Persistent interface chrome should not carry perpetual looping motion, the single brief bell wiggle
being the sole sanctioned exception; a constantly pulsing element is a constant distraction. The
charts' internal animation stays off, as §1 requires. And the overall intensity stays matched to the
application's dignified character: a gentle overshoot on a press is welcome, but the bouncy,
spring-heavy motion of a playful consumer application is off-brand here and is to be avoided. When in
doubt, less motion, slightly faster, is the safer choice.

---

## 9. Choices left open for the maintainer

A few matters are genuine questions of taste and are surfaced so they can be decided deliberately. The
overall intensity is the main one: the values in this document aim for restraint, and the application
can be left there or dialled up by lengthening the slide distances, widening the stagger, and leaning
on the spring curve, all of which are adjustable from the tokens of §3 without touching a component.
Whether the notification bell wiggles at all is the second; it is recommended but is the effect most
likely to divide opinion, and dropping it costs nothing. Whether to adopt the page-transition template
of §6 is the third; it is recommended as a subtle unifier but is entirely separable. And whether the
counting figures appear only on the public pages or also on the dashboard stat cards is the fourth,
with the public pages the confident yes and the dashboard an optional flourish.

---

## 10. Acceptance

The work is complete when the following all hold. The project still builds with zero TypeScript errors
under strict mode, `next build` passes, `npm run db:reset` is unaffected, and `package.json` has gained
no new dependency, `tw-animate-css` having already been present. Toggling the operating system's
reduce-motion preference stills every entrance, reveal, count, and wiggle, leaving the application fully
usable with all figures at their final values. No layout shift occurs on load or on reveal, observable
by watching the counters and cards as a page settles. Every chart still carries
`isAnimationActive={false}` and paints correctly on mount, confirming the original rendering bug has not
returned. Keyboard focus remains immediate and visible on every control and the tab order is unchanged.
A behavioural spot-check — submitting a report, advancing its status, following the authorisation
redirects — confirms the application does exactly what it did before, because only its feel was ever
touched. And the motion code is centralised as intended: the tokens and keyframes live in
`globals.css`, and the only client-side motion logic is the two documented helper components in
`src/components/motion/`, alongside the inline per-index delays used for load-time stagger in server
components.
