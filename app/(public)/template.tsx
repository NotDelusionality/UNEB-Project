/**
 * Page-transition fade (motion §6). Next.js re-mounts a template on each
 * navigation, so wrapping the page content in a brief fade-in gives every
 * navigation a gentle arrival. Placed at the route-group level so only the
 * content inside the public shell fades — the header and footer stay put. Pure
 * CSS, neutralised under reduced motion.
 */
export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in duration-[var(--dur)] ease-[var(--ease-out)] motion-reduce:animate-none">
      {children}
    </div>
  );
}
