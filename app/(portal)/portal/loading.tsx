import { Skeleton } from "@/components/ui/skeleton";

export default function PortalDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-56" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </div>
  );
}
