import Link from "next/link";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_META,
  REPORT_CATEGORIES,
  SCHOOL_NAME,
} from "@/lib/constants";
import { publicHomeCounts } from "@/lib/data/stats";

// The counter strip reads live totals, so this page is always rendered
// per request rather than at build time.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Submit a report",
    body: "Describe the problem, say where it is, and attach a photo if you have one.",
  },
  {
    title: "The administration reviews it",
    body: "Your report receives a case number and moves through a defined lifecycle.",
  },
  {
    title: "You are notified at every change",
    body: "Each status change and reply appears in your portal until the case is resolved.",
  },
];

// Shared entrance for above-the-fold hero elements (motion §5): a gentle
// fade-and-rise, held from its starting state until each element's delayed
// turn arrives, so the eye is led down the hero in reading order.
const HERO_ENTER =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]";

export default async function HomePage() {
  const counts = await publicHomeCounts();

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <div className="max-w-3xl">
          <p
            className={`text-[11px] font-semibold tracking-[0.2em] uppercase text-muted ${HERO_ENTER}`}
          >
            Community Desk
          </p>
          <h1
            className={`mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl ${HERO_ENTER}`}
            style={{ animationDelay: "80ms" }}
          >
            Report a problem in your community.
            <span className="block text-emphasis">
              Track it until it is resolved.
            </span>
          </h1>
          <p
            className={`mt-6 max-w-2xl text-[15px] leading-relaxed text-muted ${HERO_ENTER}`}
            style={{ animationDelay: "160ms" }}
          >
            The administration of {SCHOOL_NAME} receives reports about local
            problems, reviews each one, and keeps you informed{" "}
            <em className="font-display italic text-emphasis">
              at every step
            </em>
            .
          </p>
          <div
            className={`mt-10 flex flex-wrap gap-3 ${HERO_ENTER}`}
            style={{ animationDelay: "240ms" }}
          >
            <Button size="lg" className="group" asChild>
              <Link href="/register">
                Register{" "}
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-sidebar text-sidebar-foreground">
        <Reveal className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          {[
            { label: "Reports received", value: counts.totalReports },
            { label: "Reports resolved", value: counts.resolvedReports },
            { label: "Upcoming meetings", value: counts.upcomingMeetings },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-mono text-4xl font-medium tabular-nums">
                <CountUp value={item.value} />
              </p>
              <p className="mt-2 text-[13px] font-medium text-sidebar-foreground/70">
                {item.label}
              </p>
            </div>
          ))}
        </Reveal>
      </section>

      <section
        aria-labelledby="how-it-works"
        className="mx-auto w-full max-w-6xl px-6 py-20"
      >
        <Reveal>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted">
            The process
          </p>
          <h2 id="how-it-works" className="mt-3 font-display text-3xl text-ink">
            How it works
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="list-none">
              <Reveal
                delay={index * 80}
                className="h-full rounded-xl border border-line bg-surface p-6"
              >
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-primary font-mono text-sm font-medium text-primary-foreground"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {step.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="categories"
        className="bg-sidebar text-sidebar-foreground"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-sidebar-foreground/70">
              Nine categories
            </p>
            <h2 id="categories" className="mt-3 font-display text-3xl">
              What you can report
            </h2>
          </Reveal>
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {REPORT_CATEGORIES.map((category, index) => {
              const meta = CATEGORY_META[category];
              const Icon = meta.icon;
              return (
                <li key={category} className="list-none">
                  <Reveal delay={index * 60}>
                    <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-[transform,background-color,border-color] duration-[var(--dur)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]">
                      <Icon
                        className="size-5 shrink-0 text-sidebar-foreground/80 transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-hover:scale-110"
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
