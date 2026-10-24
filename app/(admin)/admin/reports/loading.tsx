import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-44" />
        <Skeleton className="h-14 w-36" />
      </div>
      <Skeleton className="h-[520px]" />
    </div>
  );
}
