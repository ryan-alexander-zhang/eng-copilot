import { rm, mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const rootDir = process.cwd();
const extensionDir = path.join(rootDir, "extensions", "eng-copilot-clipper");
const outDir = path.join(extensionDir, "dist");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(path.join(extensionDir, "manifest.json"), path.join(outDir, "manifest.json"));
await cp(path.join(extensionDir, "static"), outDir, { recursive: true });

await build({
  entryPoints: {
    popup: path.join(extensionDir, "src", "popup.ts"),
    options: path.join(extensionDir, "src", "options.ts"),
    "content-script": path.join(extensionDir, "src", "content-script.ts"),
  },
  outdir: outDir,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  logLevel: "info",
  entryNames: "[name]",
});
