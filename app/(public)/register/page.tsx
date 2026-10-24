import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, portalPathFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  // Authenticated visitors are sent to their portal (§5.5).
  const auth = await getSession();
  if (auth) redirect(portalPathFor(auth.user.role));

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted">
            Community Desk
          </p>
          <CardTitle className="font-display text-2xl font-bold">
            Register
          </CardTitle>
          <CardDescription>
            Create an account to report problems in your community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
