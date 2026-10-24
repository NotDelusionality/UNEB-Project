import { STATUS_META, type ReportStatus } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function metaFor(status: string) {
  return STATUS_META[status as ReportStatus] ?? STATUS_META.pending;
}

/**
 * Signature element (§12.6): the vertical case rail. The first node is the
 * submission itself; every later node comes from report_status_history.
 */
export function StatusTimeline({
  submittedBy,
  submittedAt,
  entries,
}: {
  submittedBy: string;
  submittedAt: Date;
  entries: HistoryEntry[];
}) {
  const nodes = [
    {
      key: "submitted",
      label: "Submitted — Pending",
      color: STATUS_META.pending.hex,
      actor: submittedBy,
      at: submittedAt,
    },
    ...entries.map((entry) => ({
      key: String(entry.id),
      label: metaFor(entry.toStatus).label,
      color: metaFor(entry.toStatus).hex,
      actor: entry.actorName,
      at: entry.createdAt,
    })),
  ];

  return (
    <ol className="mt-1">
      {nodes.map((node, index) => {
        const isCurrent = index === nodes.length - 1;
        return (
          // Each node fades and slides gently into place a beat after the one
          // above it, so the history of the case unfolds down the rail. The
          // delay comes from the index as an inline style, so no client
          // JavaScript is needed (motion §5).
          <li
            key={node.key}
            className="relative flex gap-4 pb-6 last:pb-0 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {index < nodes.length - 1 && (
              <span
                aria-hidden
                className="absolute top-4 left-[7px] h-full w-px bg-line"
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative mt-0.5 size-[15px] shrink-0 rounded-full border-2 border-surface",
                isCurrent && "ring-2 ring-offset-1",
              )}
              style={{
                backgroundColor: node.color,
                ...(isCurrent ? { ["--tw-ring-color" as string]: node.color } : {}),
              }}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm text-ink",
                  isCurrent ? "font-semibold" : "font-medium",
                )}
              >
                {node.label}
                {isCurrent && (
                  <span className="ml-2 text-[13px] font-normal text-muted">
                    current
                  </span>
                )}
              </p>
              <p className="text-[13px] text-muted">
                {node.actor} · {formatDateTime(node.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
