import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/**
 * Quiet figure card; stat figures use the tabular monospace (§12.3).
 * `index` drives a tight staggered fade-and-rise on load (motion §5) so a row
 * of cards arrives as a composed group rather than blinking into place.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  index?: number;
}) {
  return (
    <Card
      className="py-5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div>
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p className="mt-1 font-mono text-3xl font-medium tabular-nums text-ink">
            {value}
          </p>
        </div>
        {Icon && (
          <span className="rounded-md bg-canvas p-2 text-muted" aria-hidden>
            <Icon className="size-5" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}
