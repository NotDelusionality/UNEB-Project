import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project so a stray lockfile elsewhere
  // on the machine cannot change how the build resolves files.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
