"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/validation";

/**
 * Raises a toast on the terminal outcome of a form action and follows
 * `redirectTo` when the action asks for navigation (§8). Field errors are
 * rendered inline by the form itself, so they raise no toast here.
 */
export function useActionFeedback(
  state: ActionResult | null,
  options?: { onSuccess?: () => void },
) {
  const router = useRouter();
  const onSuccessRef = useRef(options?.onSuccess);
  onSuccessRef.current = options?.onSuccess;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
      onSuccessRef.current?.();
      if (state.redirectTo) router.push(state.redirectTo);
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, router]);
}
