// Turns a resolved style profile into a neutral theme object, then renders it as
// Chakra UI v3 (createSystem/defineConfig), CSS variables, Tailwind, or JSON.
import { SCALE_STEPS, contrastRatio, hexToHsl, hslToHex, mix, normalizeHex, tonalScale } from "./color.js";

const PALETTE_NAME = /^[a-z][a-zA-Z0-9]*$/;
const RESERVED_PALETTE_NAMES = new Set(["surface", "ink", "edge"]);
const AA = 4.5;
const NON_TEXT_UI = 3;

function semanticStep(profile, field, fallback) {
  const step = profile[field] === undefined ? fallback : profile[field];
  if (!SCALE_STEPS.includes(step)) throw new Error(`${field} must be one of: ${SCALE_STEPS.join(", ")}`);
  return step;
}

const pickFirstPassing = (candidates, bg) => candidates.find((c) => contrastRatio(c.hex, bg) >= AA) ?? candidates[candidates.length - 1];

function deriveDarkSurface(primary) {
  const [h, s] = hexToHsl(primary);
  const tint = Math.min(s, 25);
  return {
    canvas: hslToHex([h, tint, 8]),
    ink: hslToHex([h, Math.min(tint, 20), 94]),
  };
}

function surfaces(canvas, ink, isDark) {
  const raised = isDark ? mix(canvas, "#ffffff", 0.06) : mix(canvas, "#ffffff", 0.6);
  let amount = 0.35;
  let inkMuted = mix(ink, canvas, amount);
  while (amount > 0.05 && contrastRatio(inkMuted, canvas) < AA) {
    amount -= 0.05;
    inkMuted = mix(ink, canvas, amount);
  }
  return { canvas, raised, ink, inkMuted, edge: mix(canvas, ink, isDark ? 0.18 : 0.14) };
}

/** Semantic palette steps: fg picks the first step that reaches AA against the canvas. */
function paletteSteps(scale, canvas, dark) {
  const order = dark ? [300, 200, 100, 50] : [700, 800, 900, 950];
  const fg = pickFirstPassing(order.map((step) => ({ step, hex: scale[step] })), canvas).step;
  return { fg, muted: dark ? 900 : 100, subtle: dark ? 800 : 200, emphasized: dark ? 700 : 300 };
}

export function buildTheme({ style, profile, source, brandColor, paletteName = "brand" }) {
  if (!PALETTE_NAME.test(paletteName) || RESERVED_PALETTE_NAMES.has(paletteName)) {
    throw new Error(`paletteName must match ${PALETTE_NAME} and cannot be reserved (surface, ink, edge): ${JSON.stringify(paletteName)}`);
  }
  const warnings = [];
  const primary = normalizeHex(brandColor ?? profile.primary);
  const scale = tonalScale(primary);
  const darkOnly = profile.mode === "dark";
  const solid = semanticStep(profile, "solidStep", 500);
  const focusRing = semanticStep(profile, "focusRingStep", 500);

  const derived = deriveDarkSurface(primary);
  const light = darkOnly ? undefined : surfaces(normalizeHex(profile.canvas), normalizeHex(profile.ink), false);
  const dark = surfaces(
    normalizeHex(darkOnly ? profile.canvas : (profile.darkCanvas ?? derived.canvas)),
    normalizeHex(darkOnly ? profile.ink : (profile.darkInk ?? derived.ink)),
    true,
  );
  const base = light ?? dark;

  if (profile.mode === "light") warnings.push("Style is light-first; the dark values are derived automatically and need a design review.");
  if (profile.mode === "dark") warnings.push("Style is dark-only; light mode resolves to the same dark values.");
  if (brandColor) warnings.push("brandColor replaced the style's primary; surface colors still come from the style profile.");

  const solidContrast = pickFirstPassing([{ hex: "#ffffff" }, { hex: "#000000" }, { step: 950, hex: scale[950] }], scale[solid]);
  if (contrastRatio(solidContrast.hex, scale[solid]) < AA) {
    warnings.push(`${paletteName}.contrast on ${paletteName}.solid is ${contrastRatio(solidContrast.hex, scale[solid]).toFixed(2)}:1 (< 4.5); pick a different seed for filled buttons.`);
  }

  const palette = {
    solid,
    contrast: solidContrast,
    focusRing,
    light: paletteSteps(scale, base.canvas, false),
    dark: paletteSteps(scale, dark.canvas, true),
  };
  for (const [mode, surf] of [["light", base], ["dark", dark]]) {
    const step = palette[mode].fg;
    const ratio = contrastRatio(scale[step], surf.canvas);
    if (ratio < AA) warnings.push(`${mode} ${paletteName}.fg (${step}) is ${ratio.toFixed(2)}:1 on the canvas (< 4.5).`);
    const focusRatio = contrastRatio(scale[focusRing], surf.canvas);
    if (focusRatio < NON_TEXT_UI) warnings.push(`${mode} ${paletteName}.focusRing (${focusRing}) is ${focusRatio.toFixed(2)}:1 on the canvas (< 3).`);
    const solidRatio = contrastRatio(scale[solid], surf.canvas);
    if (solidRatio < NON_TEXT_UI) warnings.push(`${mode} ${paletteName}.solid (${solid}) is ${solidRatio.toFixed(2)}:1 on the canvas (< 3).`);
  }
  if (contrastRatio(base.ink, base.canvas) < AA) warnings.push("Style ink on canvas is below 4.5:1 in light mode.");

  return {
    style: { id: style.id, name: style.name, category: style.category },
    profileSource: source,
    paletteName,
    mode: profile.mode,
    scale,
    palette,
    surfaces: { light: base, dark },
    fonts: { heading: profile.fontHeading ?? profile.fontBody ?? "system-ui, sans-serif", body: profile.fontBody ?? profile.fontHeading ?? "system-ui, sans-serif" },
    radius: profile.radius ?? "8px",
    shadow: profile.shadow ?? "none",
    effects: profile.effects ?? [],
    warnings,
  };
}

const q = (v) => JSON.stringify(v);
const ref = (name, step) => `{colors.${name}.${step}}`;
const safeCommentText = (v) => String(v).replace(/[\r\n\u2028\u2029]/g, " ").replace(/\*\//g, "* /");

function chakraSemanticPalette(theme) {
  const n = theme.paletteName;
  const { light, dark, solid, contrast, focusRing } = theme.palette;
  const pair = (key) => `{ value: { base: ${q(ref(n, light[key]))}, _dark: ${q(ref(n, dark[key]))} } }`;
  const sameMode = (value) => {
    const token = value.step === undefined ? value.hex : ref(n, value.step);
    return `{ value: { base: ${q(token)}, _dark: ${q(token)} } }`;
  };
  return [
    `          solid: ${sameMode({ step: solid })},`,
    `          contrast: ${sameMode(contrast)},`,
    `          fg: ${pair("fg")},`,
    `          muted: ${pair("muted")},`,
    `          subtle: ${pair("subtle")},`,
    `          emphasized: ${pair("emphasized")},`,
    `          focusRing: ${sameMode({ step: focusRing })},`,
  ].join("\n");
}

function chakraSurfaceTokens(theme) {
  const { light, dark } = theme.surfaces;
  const row = (key) => `{ value: { base: ${q(light[key])}, _dark: ${q(dark[key])} } }`;
  return [
    "        surface: {",
    `          canvas: ${row("canvas")},`,
    `          raised: ${row("raised")},`,
    "        },",
    "        ink: {",
    `          strong: ${row("ink")},`,
    `          muted: ${row("inkMuted")},`,
    "        },",
    "        edge: {",
    `          subtle: ${row("edge")},`,
    "        },",
  ].join("\n");
}

export function renderChakra(theme) {
  const scaleLines = SCALE_STEPS.map((s) => `          ${s}: { value: ${q(theme.scale[s])} },`).join("\n");
  const effects = theme.effects
    .flatMap((effect) => String(effect).split(/[\r\n\u2028\u2029]/).map((line, index) => `${index === 0 ? "// - " : "//   "}${safeCommentText(line)}`))
    .join("\n");
  const styleName = safeCommentText(theme.style.name);
  const styleId = safeCommentText(theme.style.id);
  const profileSource = safeCommentText(theme.profileSource);
  return `import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// Style: ${styleName} (${styleId}, profile: ${profileSource}). Generated by the design-styles MCP server.
// Layers 1, 2 and 4 (tokens, semantic tokens, global CSS). Layer 3 (recipes) is hand-authored:
//   use radii.surface / shadows.surface in your recipes. Effects to express there:
${effects || "// - (none listed)"}

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        ${theme.paletteName}: {
${scaleLines}
        },
      },
      radii: {
        surface: { value: ${q(theme.radius)} },
      },
      shadows: {
        surface: { value: ${q(theme.shadow)} },
      },
    },
    semanticTokens: {
      colors: {
        ${theme.paletteName}: {
${chakraSemanticPalette(theme)}
        },
${chakraSurfaceTokens(theme)}
      },
    },
  },
  globalCss: {
    html: { fontFamily: ${q(theme.fonts.body)} },
    "h1, h2, h3, h4, h5, h6": { fontFamily: ${q(theme.fonts.heading)} },
    body: { bg: "surface.canvas", color: "ink.strong" },
  },
})

export const system = createSystem(defaultConfig, config)

// Next: npx @chakra-ui/cli typegen <path-to-this-theme.ts>   (then use <Button colorPalette="${theme.paletteName}">)
`;
}

function cssVarMap(theme, mode) {
  const n = theme.paletteName;
  const surf = theme.surfaces[mode];
  const side = theme.palette[mode];
  const vars = {
    [`--${n}-fg`]: theme.scale[side.fg],
    [`--${n}-muted`]: theme.scale[side.muted],
    [`--${n}-subtle`]: theme.scale[side.subtle],
    [`--${n}-emphasized`]: theme.scale[side.emphasized],
    "--surface-canvas": surf.canvas,
    "--surface-raised": surf.raised,
    "--ink-strong": surf.ink,
    "--ink-muted": surf.inkMuted,
    "--edge-subtle": surf.edge,
  };
  return vars;
}

const block = (selector, vars) => `${selector} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;

export function renderCss(theme) {
  const n = theme.paletteName;
  const styleName = safeCommentText(theme.style.name);
  const styleId = safeCommentText(theme.style.id);
  const shared = {
    ...Object.fromEntries(SCALE_STEPS.map((s) => [`--${n}-${s}`, theme.scale[s]])),
    [`--${n}-solid`]: theme.scale[theme.palette.solid],
    [`--${n}-contrast`]: theme.palette.contrast.hex,
    [`--${n}-focus-ring`]: theme.scale[theme.palette.focusRing],
    "--radius-surface": theme.radius,
    "--shadow-surface": theme.shadow,
    "--font-heading": theme.fonts.heading,
    "--font-body": theme.fonts.body,
  };
  const darkOnly = theme.mode === "dark";
  const root = block(":root", { ...shared, ...cssVarMap(theme, darkOnly ? "dark" : "light") });
  const dark = darkOnly ? "" : "\n\n" + block(".dark", cssVarMap(theme, "dark"));
  return `/* ${styleName} (${styleId}). Generated by the design-styles MCP server. */\n${root}${dark}\n`;
}

export function renderTailwind(theme) {
  const n = theme.paletteName;
  const colors = {
    ...theme.scale,
    DEFAULT: theme.scale[theme.palette.solid],
    focusRing: theme.scale[theme.palette.focusRing],
  };
  const config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          [n]: colors,
          surface: { canvas: "var(--surface-canvas)", raised: "var(--surface-raised)" },
          ink: { strong: "var(--ink-strong)", muted: "var(--ink-muted)" },
          edge: { subtle: "var(--edge-subtle)" },
        },
        borderRadius: { surface: "var(--radius-surface)" },
        boxShadow: { surface: "var(--shadow-surface)" },
        fontFamily: { heading: ["var(--font-heading)"], body: ["var(--font-body)"] },
      },
    },
  };
  return `// tailwind.config.js (theme.extend). Pair with the CSS variables from format "css".\nexport default ${JSON.stringify(config, null, 2)}\n`;
}

export function renderJson(theme) {
  return JSON.stringify(theme, null, 2);
}

export const RENDERERS = { chakra: renderChakra, css: renderCss, tailwind: renderTailwind, json: renderJson };
