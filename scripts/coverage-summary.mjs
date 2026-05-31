import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const summaryFiles = findCoverageSummaries(repoRoot);

if (summaryFiles.length === 0) {
  console.log("No coverage-summary.json files found.");
  process.exit(0);
}

const rows = summaryFiles.map((file) => {
  const summary = JSON.parse(readFileSync(file, "utf8"));
  const packageDir = relative(repoRoot, dirname(dirname(file)));
  const total = summary.total;

  return {
    packageDir,
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct,
  };
});

const markdown = [
  "## Coverage",
  "",
  "| Package | Statements | Branches | Functions | Lines |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...rows.map(
    (row) =>
      `| ${row.packageDir} | ${formatPct(row.statements)} | ${formatPct(row.branches)} | ${formatPct(row.functions)} | ${formatPct(row.lines)} |`,
  ),
  "",
].join("\n");

console.log(markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

function findCoverageSummaries(root) {
  const results = [];
  const ignored = new Set([".git", "node_modules", "dist"]);

  visit(root);
  return results;

  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignored.has(entry.name)) {
        continue;
      }

      const nextDir = join(dir, entry.name);
      const summaryFile = join(nextDir, "coverage", "coverage-summary.json");

      if (existsSync(summaryFile)) {
        results.push(summaryFile);
        continue;
      }

      visit(nextDir);
    }
  }
}

function formatPct(value) {
  return `${Number(value).toFixed(2)}%`;
}
