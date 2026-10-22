// Style catalog: load, extend via DESIGN_STYLES_PATH, search, and resolve visual profiles.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function loadCatalog(env = process.env, warn = (m) => process.stderr.write(`[design-styles] ${m}\n`)) {
  const base = readJson(join(dataDir, "styles.json"));
  const profiles = readJson(join(dataDir, "profiles.json"));
  const styles = new Map(base.styles.map((s) => [s.id, s]));
  const categories = new Map(base.categories.map((c) => [c.id, c]));
  const merged = { categories: { ...profiles.categories }, styles: { ...profiles.styles } };

  const extraPath = env.DESIGN_STYLES_PATH;
  if (extraPath) {
    try {
      if (!existsSync(extraPath)) throw new Error("file not found");
      const extra = readJson(extraPath);
      for (const c of extra.categories ?? []) categories.set(c.id, { ...categories.get(c.id), ...c });
      for (const s of extra.styles ?? []) styles.set(s.id ?? slugify(s.name), { ...s, id: s.id ?? slugify(s.name) });
      Object.assign(merged.categories, extra.profiles?.categories);
      Object.assign(merged.styles, extra.profiles?.styles);
    } catch (e) {
      warn(`ignoring DESIGN_STYLES_PATH (${e.message})`);
    }
  }
  return { styles, categories, profiles: merged, note: base.note };
}

export function findCategory(catalog, ref) {
  if (ref === undefined || ref === null || ref === "") return undefined;
  const key = slugify(ref);
  return (
    catalog.categories.get(key) ??
    [...catalog.categories.values()].find((c) => String(c.number) === String(ref) || c.id.includes(key) || slugify(c.name ?? "").includes(key))
  );
}

export function findStyle(catalog, ref) {
  const key = slugify(ref);
  return catalog.styles.get(key) ?? [...catalog.styles.values()].find((s) => s.id.includes(key) || slugify(s.name) === key);
}

const FIELD_WEIGHTS = [
  ["name", 5],
  ["keywords", 3],
  ["description", 2],
  ["category", 1],
];

const searchFields = (s) => ({
  name: `${s.id} ${s.name}`.toLowerCase(),
  keywords: (s.keywords ?? []).join(" ").toLowerCase(),
  description: (s.description ?? "").toLowerCase(),
  category: s.category.replace(/-/g, " "),
});

/** Weighted term hits across name, keywords, description, category. An empty query matches everything. */
function scoreStyle(style, terms) {
  if (terms.length === 0) return 1;
  const fields = searchFields(style);
  let score = 0;
  for (const term of terms) {
    for (const [field, weight] of FIELD_WEIGHTS) if (fields[field].includes(term)) score += weight;
  }
  return score;
}

const byScoreThenName = (a, b) => b.score - a.score || a.style.name.localeCompare(b.style.name);

export function searchStyles(catalog, { query = "", category, limit = 10 } = {}) {
  const cat = category ? findCategory(catalog, category) : undefined;
  if (category && !cat) return [];
  const terms = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const candidates = [...catalog.styles.values()].filter((s) => !cat || s.category === cat.id);
  return candidates
    .map((style) => ({ score: scoreStyle(style, terms), style }))
    .filter((x) => x.score > 0)
    .sort(byScoreThenName)
    .slice(0, Math.max(1, Math.min(50, limit)))
    .map((x) => x.style);
}

/** Merge category defaults with a per-style override. */
export function resolveProfile(catalog, style) {
  const base = catalog.profiles.categories[style.category];
  const override = catalog.profiles.styles[style.id];
  if (!base && !override) throw new Error(`No visual profile for style "${style.id}" or category "${style.category}"`);
  return { profile: { ...base, ...override }, source: override ? "style-override" : "category-default" };
}
