import { Badge } from "@/components/ui/badge";
import type { CommentWithAuthor } from "@/lib/data/reports";
import { formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The two-party message thread on a case (§4). */
export function CommentThread({
  comments,
}: {
  comments: CommentWithAuthor[];
}) {
  if (comments.length === 0) {
    return (
      <p className="py-2 text-[13px] text-muted">
        No messages on this case yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              comment.authorRole === "admin"
                ? "bg-sidebar text-sidebar-foreground"
                : "bg-secondary text-ink",
            )}
          >
            {initials(comment.authorName)}
          </span>
          <div className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3.5 py-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold text-ink">
                {comment.authorName}
              </span>
              {comment.authorRole === "admin" && (
                <Badge variant="secondary" className="text-[11px]">
                  Administration
                </Badge>
              )}
              <span className="text-xs text-muted">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-line text-ink">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
