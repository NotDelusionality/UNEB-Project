"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_META,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  STATUS_META,
} from "@/lib/constants";

const ALL = "all";

/**
 * Filter controls for report tables. All state lives in URL search params
 * and is evaluated server-side (§7.2, §7.3).
 */
export function ReportFilters({
  searchPlaceholder,
  showCategory = false,
  showSort = false,
}: {
  searchPlaceholder: string;
  showCategory?: boolean;
  showSort?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // Filter changes always restart at page 1.
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form
        role="search"
        className="flex min-w-56 flex-1 items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          apply({ q: typeof value === "string" ? value.trim() : null });
        }}
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="report-search" className="text-[13px] text-muted">
            Search
          </Label>
          <Input
            id="report-search"
            name="q"
            type="search"
            placeholder={searchPlaceholder}
            defaultValue={searchParams.get("q") ?? ""}
          />
        </div>
        <Button type="submit" variant="outline" size="icon" aria-label="Search">
          <Search aria-hidden />
        </Button>
      </form>

      <div className="space-y-1.5">
        <Label htmlFor="filter-status" className="text-[13px] text-muted">
          Status
        </Label>
        <Select
          value={searchParams.get("status") ?? ALL}
          onValueChange={(value) => apply({ status: value })}
        >
          <SelectTrigger id="filter-status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {REPORT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCategory && (
        <div className="space-y-1.5">
          <Label htmlFor="filter-category" className="text-[13px] text-muted">
            Category
          </Label>
          <Select
            value={searchParams.get("category") ?? ALL}
            onValueChange={(value) => apply({ category: value })}
          >
            <SelectTrigger id="filter-category" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {REPORT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_META[category].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showSort && (
        <div className="space-y-1.5">
          <Label htmlFor="filter-sort" className="text-[13px] text-muted">
            Sort
          </Label>
          <Select
            value={searchParams.get("sort") === "oldest" ? "oldest" : "newest"}
            onValueChange={(value) =>
              apply({ sort: value === "newest" ? null : value })
            }
          >
            <SelectTrigger id="filter-sort" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
