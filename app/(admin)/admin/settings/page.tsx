import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProfileCards } from "@/components/profile-cards";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { user } = await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your account details and password."
      />
      <ProfileCards user={user} />
    </div>
  );
}
