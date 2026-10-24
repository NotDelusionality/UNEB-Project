import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProfileCards } from "@/components/profile-cards";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user } = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details and password."
      />
      <ProfileCards user={user} />
    </div>
  );
}
