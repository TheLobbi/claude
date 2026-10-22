// Tool definitions and handlers. Handlers return plain strings or objects; index.js wraps them.
import { wcag, normalizeHex } from "./color.js";
import { findCategory, findStyle, resolveProfile, searchStyles } from "./catalog.js";
import { RENDERERS, buildTheme } from "./generators.js";

const str = (description) => ({ type: "string", description });

export const TOOL_DEFS = [
  {
    name: "list_style_categories",
    description: "List design style categories with ids, prompt keywords, and style counts.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "search_styles",
    description: "Search the design style catalog by keyword (name, prompt keywords, description). Returns ranked styles.",
    inputSchema: {
      type: "object",
      properties: {
        query: str("Free-text query, e.g. 'dark neon dashboard'. Empty returns the first styles alphabetically."),
        category: str("Optional category id, number, or name fragment (see list_style_categories)."),
        limit: { type: "integer", minimum: 1, maximum: 50, description: "Max results (default 10)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_style",
    description: "Get one style with its resolved visual profile (palette seed, surfaces, radius, shadow, fonts, effects) and profile source.",
    inputSchema: { type: "object", properties: { style: str("Style id or name, e.g. 'glassmorphism'.") }, required: ["style"], additionalProperties: false },
  },
  {
    name: "generate_chakra_system",
    description:
      "Generate a Chakra UI v3 system (createSystem/defineConfig) for a style: color tokens 50-950, the colorPalette semantic contract, light/dark surface semantic tokens, radii/shadows tokens, and globalCss. Recipes (component visuals) are not generated.",
    inputSchema: {
      type: "object",
      properties: {
        style: str("Style id or name."),
        brandColor: str("Optional hex (#rgb or #rrggbb) replacing the style's primary color. It must support a strictly darkening 50-950 tonal scale; extreme black/white seeds are rejected."),
        paletteName: str("colorPalette key, default 'brand'. Must match ^[a-z][a-zA-Z0-9]*$ and cannot be surface, ink, or edge."),
      },
      required: ["style"],
      additionalProperties: false,
    },
  },
  {
    name: "generate_tokens",
    description: "Generate design tokens for a style as 'chakra' (Chakra UI v3 system), 'css' (CSS variables with .dark), 'tailwind' (theme.extend config), or 'json' (neutral theme object).",
    inputSchema: {
      type: "object",
      properties: {
        style: str("Style id or name."),
        format: { type: "string", enum: Object.keys(RENDERERS), description: "Output format." },
        brandColor: str("Optional hex replacing the style's primary color. It must support a strictly darkening 50-950 tonal scale; extreme black/white seeds are rejected."),
        paletteName: str("Palette key, default 'brand'. Must match ^[a-z][a-zA-Z0-9]*$ and cannot be surface, ink, or edge."),
      },
      required: ["style", "format"],
      additionalProperties: false,
    },
  },
  {
    name: "check_contrast",
    description: "WCAG 2.x contrast ratio for two hex colors, with AA/AAA results for normal text, large text, and non-text UI (3:1).",
    inputSchema: {
      type: "object",
      properties: { foreground: str("Hex color, e.g. #1a1a1a."), background: str("Hex color, e.g. #ffffff.") },
      required: ["foreground", "background"],
      additionalProperties: false,
    },
  },
];

function requireStyle(catalog, ref) {
  if (typeof ref !== "string" || !ref.trim()) throw new Error("'style' is required");
  const style = findStyle(catalog, ref);
  if (!style) {
    const hints = searchStyles(catalog, { query: ref, limit: 5 }).map((s) => s.id);
    throw new Error(`Unknown style ${JSON.stringify(ref)}.${hints.length ? ` Did you mean: ${hints.join(", ")}?` : " Use search_styles."}`);
  }
  return style;
}

function themeFor(catalog, args) {
  const style = requireStyle(catalog, args.style);
  const { profile, source } = resolveProfile(catalog, style);
  return buildTheme({ style, profile, source, brandColor: args.brandColor, paletteName: args.paletteName });
}

export function createHandlers(catalog) {
  return {
    list_style_categories: () => ({
      note: catalog.note,
      categories: [...catalog.categories.values()].map((c) => ({
        id: c.id,
        name: c.name,
        keywords: c.keywords,
        styleCount: [...catalog.styles.values()].filter((s) => s.category === c.id).length,
      })),
    }),

    search_styles: ({ query = "", category, limit = 10 } = {}) => {
      if (category && !findCategory(catalog, category)) throw new Error(`Unknown category ${JSON.stringify(category)}. Use list_style_categories.`);
      const results = searchStyles(catalog, { query, category, limit });
      return { count: results.length, styles: results };
    },

    get_style: ({ style }) => {
      const s = requireStyle(catalog, style);
      const { profile, source } = resolveProfile(catalog, s);
      return { style: s, profileSource: source, profile };
    },

    generate_chakra_system: (args) => {
      const theme = themeFor(catalog, args);
      return RENDERERS.chakra(theme) + warningsFooter(theme);
    },

    generate_tokens: (args) => {
      const render = Object.hasOwn(RENDERERS, args.format) ? RENDERERS[args.format] : undefined;
      if (!render) throw new Error(`format must be one of: ${Object.keys(RENDERERS).join(", ")}`);
      const theme = themeFor(catalog, args);
      return args.format === "json" ? render(theme) : render(theme) + warningsFooter(theme, args.format);
    },

    check_contrast: ({ foreground, background }) => ({
      foreground: normalizeHex(foreground),
      background: normalizeHex(background),
      ...wcag(foreground, background),
    }),
  };
}

function warningsFooter(theme, format = "chakra") {
  if (!theme.warnings.length) return "";
  if (format === "css") {
    const lines = theme.warnings.map((w) => ` * ${w}`).join("\n");
    return `\n/* Review notes:\n${lines}\n */\n`;
  }
  const lines = theme.warnings.map((w) => `// - ${w}`).join("\n");
  return `\n// Review notes:\n${lines}\n`;
}
