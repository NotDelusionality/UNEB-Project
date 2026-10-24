import { Badge } from "@/components/ui/badge";
import { STATUS_META, type ReportStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Soft-tinted status pill, consistent everywhere (§12.5). */
export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn(meta.badgeClass, className)}>
      {meta.label}
    </Badge>
  );
}
