import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // A soft warm-white highlight sweeps across the block under the
        // `shimmer` keyframe (motion §6), so the wait feels active rather than
        // inert. Change propagates everywhere skeletons are used. Under reduced
        // motion the global rule collapses the loop to a single instant pass.
        "relative overflow-hidden rounded-md bg-accent",
        "after:absolute after:inset-0 after:content-[''] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] after:bg-[length:200%_100%] after:bg-no-repeat after:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
