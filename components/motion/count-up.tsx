"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counting figure (motion §3). Animates a number up to its target when it
 * enters view. Renders its final value on the server so the figure is correct
 * with JavaScript disabled and the surrounding layout never shifts; resets and
 * counts only once, in view, with motion enabled. Uses tabular figures so the
 * width stays stable as the digits change.
 */
export function CountUp({
  value,
  duration = 800,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value); // final value for SSR / no-JS / reduced motion
  const started = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          setDisplay(0);
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}
