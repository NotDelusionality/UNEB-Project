/**
 * Deletes the SQLite database, re-applies the schema, and seeds demo data.
 * Uses Node fs only, so it behaves identically on Windows, WSL, macOS, Linux.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });

for (const name of ["app.db", "app.db-wal", "app.db-shm", "app.db-journal"]) {
  const file = path.join(dataDir, name);
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.log(`Removed ${path.relative(process.cwd(), file)}`);
  }
}

const run = (command: string) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
};

run("npx drizzle-kit push --force");
run("npx tsx scripts/seed.ts");
