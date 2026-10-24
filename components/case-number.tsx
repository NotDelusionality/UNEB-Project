import { caseNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Signature element (§12.6): the case number, always monospace with
 * tabular figures — the register number of an official record.
 */
export function CaseNumber({
  id,
  className,
}: {
  id: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums tracking-tight",
        className,
      )}
    >
      {caseNumber(id)}
    </span>
  );
}
