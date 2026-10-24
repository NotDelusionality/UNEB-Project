import { getSession } from "@/lib/auth";
import { getReportByImagePath } from "@/lib/data/reports";
import {
  contentTypeForFilename,
  readReportImage,
  UPLOAD_FILENAME_PATTERN,
} from "@/lib/uploads";

/**
 * The only route handler in the application (§3.1): report images are not
 * publicly served. A missing file, a foreign report, and no session all
 * answer 404 alike, so the response never confirms a resource exists (§10).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const notFound = new Response("Not found", { status: 404 });

  const auth = await getSession();
  if (!auth) return notFound;

  const { filename } = await context.params;
  const decoded = decodeURIComponent(filename);
  if (
    decoded.includes("/") ||
    decoded.includes("\\") ||
    decoded.includes("..") ||
    !UPLOAD_FILENAME_PATTERN.test(decoded)
  ) {
    return notFound;
  }

  const report = await getReportByImagePath(decoded);
  if (!report) return notFound;
  if (auth.user.role !== "admin" && report.userId !== auth.user.id) {
    return notFound;
  }

  const file = await readReportImage(decoded);
  if (!file) return notFound;

  const contentType = contentTypeForFilename(decoded);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
