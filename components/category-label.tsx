import { CATEGORY_META, type ReportCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Category with its fixed lucide icon — identical on every surface (§12.5). */
export function CategoryLabel({
  category,
  className,
}: {
  category: ReportCategory;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      {meta.label}
    </span>
  );
}
