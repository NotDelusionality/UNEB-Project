import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SCHOOL_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]">
        About
      </p>
      <h1
        className="mt-4 font-display text-4xl leading-tight text-ink animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        style={{ animationDelay: "80ms" }}
      >
        About the Community Desk
      </h1>

      <section className="mt-12">
        <h2 className="font-display text-lg font-bold text-ink">
          Purpose
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The Community Desk is the channel through which community members
          report local problems — a broken water point, a damaged road, a
          security concern — to the administration of {SCHOOL_NAME}. Every
          report receives a case number and stays visible to its reporter{" "}
          <em className="font-display italic text-emphasis">
            from submission to resolution
          </em>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">
          Who operates it
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The school administration operates the desk. Administrators review
          each report, decide what happens next, and record every decision
          against the case.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">
          What happens to a report
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A new report starts as <strong>Pending</strong>. When an
          administrator picks it up it becomes <strong>Under review</strong>,
          then <strong>In progress</strong> once work has started. It ends as{" "}
          <strong>Resolved</strong> when the problem is fixed, or{" "}
          <strong>Closed</strong> when no further action will be taken. Each
          change is recorded on the case timeline, and the reporter is notified
          at every step. Reporters and administrators can exchange messages on
          the case until it is closed.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">
          Announcements and meetings
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The administration publishes announcements about matters that affect
          the whole community and schedules local council meetings. Both appear
          in your portal, so decisions taken outside the reporting system stay
          visible inside it.
        </p>
      </section>

      <div className="mt-12">
        <Button className="group" asChild>
          <Link href="/register">
            Register to submit a report{" "}
            <span
              aria-hidden
              className="inline-block transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
