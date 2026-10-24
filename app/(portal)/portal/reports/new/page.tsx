import type { Metadata } from "next";
import { ReportForm } from "@/components/forms/report-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Submit report" };

export default async function NewReportPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit report"
        description="Describe the problem. The administration reviews every report and you are notified at each change."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <ReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
