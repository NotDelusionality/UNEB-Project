import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Ensured at startup so a fresh clone can run before any seed or upload.
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// A single client survives dev-server hot reloads instead of accumulating
// one file handle per reload.
const globalForDb = globalThis as unknown as { libsqlClient?: Client };
const client = (globalForDb.libsqlClient ??= createClient({
  url: "file:data/app.db",
}));

export const db = drizzle(client, { schema });
