"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ShellNotification = {
  id: number;
  message: string;
  isRead: boolean;
  timeLabel: string;
  href: string | null;
};

type NavItem = { href: string; label: string; icon: LucideIcon };

const MEMBER_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reports/new", label: "Submit report", icon: FilePlus2 },
  { href: "/portal/reports", label: "My reports", icon: FileText },
  { href: "/portal/announcements", label: "Announcements", icon: Megaphone },
  { href: "/portal/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/portal/profile", label: "Profile", icon: UserRound },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function bestMatch(pathname: string, items: NavItem[]): NavItem | null {
  let best: NavItem | null = null;
  for (const item of items) {
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best;
}

function SidebarContent({
  items,
  pathname,
  userName,
  roleLabel,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  userName: string;
  roleLabel: string;
  onNavigate?: () => void;
}) {
  const active = bestMatch(pathname, items);
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-display text-lg font-bold leading-tight text-sidebar-foreground">
          Light Academy
        </p>
        <p className="text-[13px] text-sidebar-foreground/80">Community Desk</p>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active?.href === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground",
                isActive
                  ? "bg-sidebar-active font-medium text-sidebar-foreground"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-sidebar-foreground"
          >
            {initials(userName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="text-xs text-sidebar-foreground/70">{roleLabel}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] outline-none hover:bg-white/5 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-foreground"
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

function NotificationBell({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: ShellNotification[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // One-shot bell wiggle (motion §6): drawn once when the page loads carrying
  // unread items, or when the count crosses up from zero — never a loop, and
  // silent under reduced motion. The badge itself pops in via a zoom entrance.
  const [wiggle, setWiggle] = useState(false);
  const prevCount = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (unreadCount > 0 && prevCount.current === 0) {
      setWiggle(true);
      const timer = setTimeout(() => setWiggle(false), 700);
      prevCount.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell
            aria-hidden
            className={cn(
              "origin-top",
              wiggle && "animate-[bell-wiggle_0.7s_ease-in-out]",
            )}
          />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] animate-in items-center justify-center rounded-full bg-primary px-1 font-mono text-[11px] font-medium tabular-nums text-primary-foreground zoom-in duration-[var(--dur)] ease-[var(--ease-spring)]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="link"
            size="xs"
            onClick={markAllRead}
            disabled={isPending || unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-muted">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => {
                  if (notification.href) router.push(notification.href);
                }}
                className="flex-col items-start gap-0.5 py-2"
              >
                <span className="flex w-full items-start gap-2">
                  {!notification.isRead && (
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                  )}
                  <span
                    className={cn(
                      "text-[13px] leading-snug",
                      notification.isRead
                        ? "text-muted"
                        : "font-medium text-ink",
                    )}
                  >
                    {notification.message}
                  </span>
                </span>
                <span className="pl-3.5 text-xs text-muted">
                  {notification.timeLabel}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  variant,
  user,
  unreadCount,
  notifications,
  children,
}: {
  variant: "member" | "admin";
  user: { name: string; email: string };
  unreadCount: number;
  notifications: ShellNotification[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const items = variant === "admin" ? ADMIN_NAV : MEMBER_NAV;
  const roleLabel = variant === "admin" ? "Administrator" : "Member";
  const profileHref = variant === "admin" ? "/admin/settings" : "/portal/profile";

  const active = bestMatch(pathname, items);
  const title = active
    ? active.label
    : /^\/(portal|admin)\/reports\/\d+/.test(pathname)
      ? "Report detail"
      : "Community Desk";

  return (
    <div className="min-h-screen bg-canvas lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[264px] bg-sidebar lg:block">
        <SidebarContent
          items={items}
          pathname={pathname}
          userName={user.name}
          roleLabel={roleLabel}
        />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[264px] border-r-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent
                items={items}
                pathname={pathname}
                userName={user.name}
                roleLabel={roleLabel}
                onNavigate={() => setSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <h1 className="truncate font-display text-lg font-bold text-ink">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell
              unreadCount={unreadCount}
              notifications={notifications}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Account menu"
                >
                  <span
                    aria-hidden
                    className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  >
                    {initials(user.name)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>
                    {variant === "admin" ? (
                      <Settings aria-hidden />
                    ) : (
                      <UserRound aria-hidden />
                    )}
                    {variant === "admin" ? "Settings" : "Profile"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => startTransition(() => logout())}
                >
                  <LogOut aria-hidden />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
