"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/lib/actions/notifications";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function markAllRead() {
    startTransition(async () => {
      const result = await markNotificationsRead();
      if (result.ok) {
        toast.success(result.message ?? "All notifications marked as read");
      } else {
        toast.error(result.formError ?? "The action could not be completed.");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={markAllRead}
      disabled={isPending || disabled}
    >
      Mark all as read
    </Button>
  );
}
