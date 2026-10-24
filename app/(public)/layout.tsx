import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession, portalPathFor } from "@/lib/auth";
import { SCHOOL_NAME } from "@/lib/constants";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-display text-base font-bold text-ink">
              Light Academy
            </span>
            <span className="text-sm text-muted"> · Community Desk</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" asChild>
              <Link href="/about">About</Link>
            </Button>
            {auth ? (
              <Button asChild>
                <Link href={portalPathFor(auth.user.role)}>Open portal</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-[13px] text-muted">
          <p>{SCHOOL_NAME}</p>
          <p>Operated by the school administration.</p>
        </div>
      </footer>
    </div>
  );
}
