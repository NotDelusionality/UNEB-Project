import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Statically scoped to data/uploads so the bundler can trace file access.
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Generated filenames are a UUID plus a sniffed extension — nothing else is ever served. */
export const UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type SniffedType = { ext: ".jpg" | ".png" | ".webp"; contentType: string };

/**
 * File type is decided by magic bytes (§9), never by the client-supplied
 * filename or MIME string.
 */
export function sniffImageType(bytes: Uint8Array): SniffedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: ".jpg", contentType: "image/jpeg" };
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: ".png", contentType: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return { ext: ".webp", contentType: "image/webp" };
  }
  return null;
}

export type SaveImageResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

export async function saveReportImage(file: File): Promise<SaveImageResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "The image must be 5 MB or smaller." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: "The image must be 5 MB or smaller." };
  }

  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return { ok: false, error: "The image must be a JPEG, PNG, or WebP file." };
  }

  const filename = `${randomUUID()}${sniffed.ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return { ok: true, filename };
}

export function contentTypeForFilename(filename: string): string | null {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? null;
}

export async function readReportImage(filename: string): Promise<Buffer | null> {
  if (!UPLOAD_FILENAME_PATTERN.test(filename)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS_DIR, filename));
  } catch {
    return null;
  }
}

/** Called when a report with an image is deleted so no orphan file remains. */
export async function deleteReportImage(filename: string | null): Promise<void> {
  if (!filename || !UPLOAD_FILENAME_PATTERN.test(filename)) return;
  await fs.rm(path.join(UPLOADS_DIR, filename), { force: true });
}
