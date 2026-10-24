import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Handles unknown routes and unknown report ids alike. A report the viewer
 * may not see renders this same page, so the response does not confirm the
 * resource exists (§10).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl font-bold text-ink">
          Page not found
        </p>
        <p className="mt-2 text-sm text-muted">
          The page you requested does not exist, or you do not have access to
          it.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
