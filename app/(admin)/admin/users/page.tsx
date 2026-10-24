import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setUserActive, setUserRole } from "@/lib/actions/users";
import { requireAdmin } from "@/lib/auth";
import { listUsersPage } from "@/lib/data/users";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { user: viewer } = await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() || undefined;

  const { rows, total, pageCount } = await listUsersPage({ page, query });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Registered accounts. Deactivated accounts keep their reports but cannot log in."
      />

      <SearchBox label="Search" placeholder="Search by name or email" />

      {rows.length === 0 ? (
        <EmptyState
          message="No users match this search."
          action={
            <Button variant="outline" asChild>
              <Link href="/admin/users">Clear search</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="py-0 animate-in fade-in fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Reports</TableHead>
                    <TableHead className="pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => {
                    const isSelf = user.id === viewer.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="pl-4 font-medium text-ink">
                          {user.fullName}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-normal text-muted">
                              (you)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted">
                          {user.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role === "admin" ? "Admin" : "Member"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline">Active</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-destructive/30 text-destructive"
                            >
                              Deactivated
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px] text-muted">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right text-[13px] tabular-nums text-muted">
                          {user.reportCount}
                        </TableCell>
                        <TableCell className="pr-4">
                          {/* Self-targeting controls are hidden as well as
                              rejected server-side (§6). */}
                          {isSelf ? (
                            <span className="text-[13px] text-muted">—</span>
                          ) : (
                            <div className="flex gap-2">
                              <ConfirmAction
                                title={
                                  user.isActive
                                    ? "Deactivate account"
                                    : "Reactivate account"
                                }
                                description={
                                  user.isActive
                                    ? `${user.fullName} will be signed out immediately and can no longer log in. Their reports stay on record.`
                                    : `${user.fullName} will be able to log in again.`
                                }
                                confirmLabel={
                                  user.isActive ? "Deactivate" : "Reactivate"
                                }
                                destructive={user.isActive}
                                action={setUserActive.bind(
                                  null,
                                  user.id,
                                  !user.isActive,
                                )}
                                trigger={
                                  <Button variant="outline" size="xs">
                                    {user.isActive ? "Deactivate" : "Reactivate"}
                                  </Button>
                                }
                              />
                              <ConfirmAction
                                title="Change role"
                                description={
                                  user.role === "admin"
                                    ? `${user.fullName} will become a member and lose access to the admin portal.`
                                    : `${user.fullName} will become an administrator with full access to the admin portal.`
                                }
                                confirmLabel={
                                  user.role === "admin"
                                    ? "Make member"
                                    : "Make admin"
                                }
                                action={setUserRole.bind(
                                  null,
                                  user.id,
                                  user.role === "admin" ? "member" : "admin",
                                )}
                                trigger={
                                  <Button variant="outline" size="xs">
                                    {user.role === "admin"
                                      ? "Make member"
                                      : "Make admin"}
                                  </Button>
                                }
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            basePath="/admin/users"
            searchParams={{ q: query }}
          />
        </>
      )}
    </div>
  );
}
