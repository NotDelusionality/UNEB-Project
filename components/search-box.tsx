"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** URL-param-driven search box; results are filtered server-side. */
export function SearchBox({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <form
      role="search"
      className="flex max-w-md items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const params = new URLSearchParams(searchParams.toString());
        if (typeof value === "string" && value.trim() !== "") {
          params.set("q", value.trim());
        } else {
          params.delete("q");
        }
        params.delete("page");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="search-box" className="text-[13px] text-muted">
          {label}
        </Label>
        <Input
          id="search-box"
          name="q"
          type="search"
          placeholder={placeholder}
          defaultValue={searchParams.get("q") ?? ""}
        />
      </div>
      <Button type="submit" variant="outline" size="icon" aria-label="Search">
        <Search aria-hidden />
      </Button>
    </form>
  );
}
