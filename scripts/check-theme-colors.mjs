import { readFile } from "node:fs/promises";
import path from "node:path";

const filesToCheck = [
  "src/app/page.tsx",
  "src/app/(app)/layout.tsx",
  "src/app/sign-in/access-denied-recovery-actions.tsx",
  "src/app/sign-in/credentials-sign-in-form.tsx",
  "src/app/sign-in/page.tsx",
  "src/app/sign-in/sign-in-button.tsx",
  "src/app/(app)/documents/page.tsx",
  "src/components/documents/document-more-actions-menu.tsx",
  "src/components/documents/document-table-row-actions.tsx",
  "src/components/layout/library-nav-sidebar.tsx",
  "src/components/layout/library-page-shell.tsx",
  "src/components/layout/owner-documents-sidebar.tsx",
  "src/components/layout/owner-top-bar.tsx",
  "src/components/layout/upload-sidebar-panel.tsx",
];

const filesToCheckForColorFunctions = new Set([
  "src/app/(app)/documents/page.tsx",
  "src/components/documents/document-more-actions-menu.tsx",
  "src/components/documents/document-table-row-actions.tsx",
  "src/components/layout/owner-documents-sidebar.tsx",
]);

const allowedHexValues = new Set([
  "#4285F4",
  "#34A853",
  "#FBBC05",
  "#EA4335",
]);

const hexColorPattern = /#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
const rgbaColorPattern = /\brgba?\s*\(/;

const violations = [];

for (const relativeFile of filesToCheck) {
  const absoluteFile = path.join(process.cwd(), relativeFile);
  const source = await readFile(absoluteFile, "utf8");
  const lines = source.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matches = line.match(hexColorPattern);

    if (filesToCheckForColorFunctions.has(relativeFile) && rgbaColorPattern.test(line)) {
      violations.push(
        `${relativeFile}:${index + 1} contains disallowed hardcoded color function rgba()/rgb()`,
      );
    }

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      if (allowedHexValues.has(match.toUpperCase())) {
        continue;
      }

      violations.push(`${relativeFile}:${index + 1} contains disallowed hardcoded color ${match}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Theme color guard failed:");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log(`Theme color guard passed for ${filesToCheck.length} files.`);
