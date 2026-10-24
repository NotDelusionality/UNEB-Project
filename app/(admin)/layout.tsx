import {
  AppShell,
  type ShellNotification,
} from "@/components/shell/app-shell";
import { requireAdmin } from "@/lib/auth";
import {
  recentNotifications,
  unreadNotificationCount,
} from "@/lib/data/notifications";
import { formatDateTime } from "@/lib/format";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();
  const [unreadCount, recent] = await Promise.all([
    unreadNotificationCount(user.id),
    recentNotifications(user.id, 8),
  ]);

  const notifications: ShellNotification[] = recent.map((notification) => ({
    id: notification.id,
    message: notification.message,
    isRead: notification.isRead,
    timeLabel: formatDateTime(notification.createdAt),
    href: notification.reportId
      ? `/admin/reports/${notification.reportId}`
      : null,
  }));

  return (
    <AppShell
      variant="admin"
      user={{ name: user.fullName, email: user.email }}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
