"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Catches unexpected failures only — expected failures surface as inline
 * field errors and toasts (§10). The underlying error is logged server-side
 * by Next.js and never shown here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl font-bold text-ink">
          Something went wrong
        </p>
        <p className="mt-2 text-sm text-muted">
          The request could not be completed. Try again, or return to the home
          page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
