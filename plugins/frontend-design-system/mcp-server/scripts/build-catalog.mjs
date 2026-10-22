#!/usr/bin/env node
/**
 * Builds data/styles.json from skills/design-styles/SKILL.md.
 * The skill is the editable source; the catalog is a committed artifact so the
 * MCP server has zero runtime dependencies and no build step.
 *
 *   node scripts/build-catalog.mjs          # write data/styles.json
 *   node scripts/build-catalog.mjs --check  # exit 1 if the file is stale
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const skillPath = join(root, "..", "skills", "design-styles", "SKILL.md");
const outPath = join(root, "data", "styles.json");

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseSkill(markdown) {
  const categories = [];
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^###\s+(\d+)\.\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { id: slugify(heading[2]), number: Number(heading[1]), name: heading[2], keywords: [], styles: [] };
      categories.push(current);
      continue;
    }
    if (!current) continue;
    if (/^##\s/.test(line) || /^####\s/.test(line)) {
      current = null;
      continue;
    }
    const style = /^-\s+\*\*(.+?)\*\*:\s*(.+?)\s*$/.exec(line);
    if (style) {
      current.styles.push({ id: slugify(style[1]), name: style[1], description: style[2] });
      continue;
    }
    const kw = /^\*\*Prompt Keywords\*\*:\s*(.+?)\s*$/.exec(line);
    if (kw) current.keywords = [...kw[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  }
  return categories.filter((c) => c.styles.length > 0);
}

export function buildCatalog(markdown) {
  const categories = parseSkill(markdown);
  const styles = categories.flatMap((c) =>
    c.styles.map((s) => ({
      id: s.id,
      name: s.name,
      category: c.id,
      description: s.description,
      keywords: c.keywords,
    })),
  );
  return {
    generatedFrom: "skills/design-styles/SKILL.md",
    note: "Subset catalog. The full 263+ style database lives in the Obsidian vault; point DESIGN_STYLES_PATH at an exported JSON of the same shape to extend it.",
    categories: categories.map((c) => ({ id: c.id, number: c.number, name: c.name, keywords: c.keywords, styleCount: c.styles.length })),
    styles,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = JSON.stringify(buildCatalog(readFileSync(skillPath, "utf8")), null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const prev = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    if (prev !== next) {
      console.error("data/styles.json is stale; run node scripts/build-catalog.mjs");
      process.exit(1);
    }
    console.log("data/styles.json is up to date");
  } else {
    writeFileSync(outPath, next);
    console.log(`wrote ${outPath}`);
  }
}
