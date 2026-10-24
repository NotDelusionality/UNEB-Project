import { cn } from "@/lib/utils";

/** Empty states are invitations with the relevant action (§12.7). */
export function EmptyState({
  message,
  action,
  className,
}: {
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}
