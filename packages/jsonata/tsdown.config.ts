import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  platform: "browser",
  target: "esnext",
  splitting: false,
  onSuccess: async () => {
    // Copy CSS file to dist after successful build
    const { copyFile } = await import("node:fs/promises");
    await copyFile("src/styles.css", "dist/styles.css");
    console.log("✓ Copied styles.css to dist");
  },
});
