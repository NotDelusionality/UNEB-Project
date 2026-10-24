import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, portalPathFor, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Authenticated visitors are sent to their portal (§5.5).
  const auth = await getSession();
  if (auth) redirect(portalPathFor(auth.user.role));

  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted">
            Community Desk
          </p>
          <CardTitle className="font-display text-2xl font-bold">
            Login
          </CardTitle>
          <CardDescription>
            Sign in to submit and track your reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-[13px] text-muted">
        No account yet?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
