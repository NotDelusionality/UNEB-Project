"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal wrapper (motion §3). Watches for its content entering the
 * viewport and then transitions it from slightly-lowered-and-transparent to
 * in-place-and-opaque. Honours reduced motion by showing immediately, and
 * honours performance by disconnecting its observer once it has fired.
 *
 * Because the content starts hidden it degrades imperfectly without
 * JavaScript, so reserve this for below-the-fold decorative content rather
 * than anything essential to the page.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
