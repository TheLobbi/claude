import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio, tonalScale, luminance, SCALE_STEPS } from "../src/color.js";
import { loadCatalog, searchStyles, findStyle, resolveProfile } from "../src/catalog.js";
import { createServer } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const catalog = loadCatalog({}, () => {});
const handle = createServer(catalog);
const call = (name, args = {}, id = 1) => handle({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }).result;
const text = (r) => r.content[0].text;

test("contrast: black on white is 21:1; known mid-gray pair", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.ok(Math.abs(contrastRatio("#767676", "#ffffff") - 4.54) < 0.05);
});

test("tonal scale keeps the seed at 500 and darkens monotonically", () => {
  const scale = tonalScale("#2563eb");
  assert.equal(scale[500], "#2563eb");
  const lums = SCALE_STEPS.map((s) => luminance(scale[s]));
  for (let i = 1; i < lums.length; i++) assert.ok(lums[i] < lums[i - 1], `step ${SCALE_STEPS[i]} should be darker than ${SCALE_STEPS[i - 1]}`);
});

test("tonal scale rejects seeds that cannot be strictly monotonic", () => {
  assert.throws(() => tonalScale("#ffffff"), /strictly darkening/);
  assert.throws(() => tonalScale("#000000"), /strictly darkening/);
});

test("every bundled style has a strictly darkening tonal scale", () => {
  for (const style of catalog.styles.values()) {
    const { profile } = resolveProfile(catalog, style);
    const scale = tonalScale(profile.primary);
    const lums = SCALE_STEPS.map((s) => luminance(scale[s]));
    for (let i = 1; i < lums.length; i++) {
      assert.ok(lums[i] < lums[i - 1], `${style.id}: ${SCALE_STEPS[i]} should be darker than ${SCALE_STEPS[i - 1]}`);
    }
  }
});

test("catalog: 95 styles in 19 categories, search ranks name matches first", () => {
  assert.equal(catalog.styles.size, 95);
  assert.equal(catalog.categories.size, 19);
  assert.equal(searchStyles(catalog, { query: "glass" })[0].id, "glassmorphism");
  assert.ok(searchStyles(catalog, { query: "neon", category: "futuristic" }).every((s) => s.category === "futuristic-styles"));
  assert.equal(findStyle(catalog, "Neo-Brutalism").id, "neo-brutalism");
});

test("every style resolves a profile and renders all formats", () => {
  for (const style of catalog.styles.values()) {
    for (const format of ["chakra", "css", "tailwind", "json"]) {
      const r = call("generate_tokens", { style: style.id, format });
      assert.ok(!r.isError, `${style.id}/${format}: ${text(r)}`);
    }
  }
});

// Evaluate generated Chakra TS with stubbed Chakra APIs: proves it is valid JS and checks token shape.
function evalChakra(code) {
  const body = code.replace(/^import .*$/m, "").replace("export const system =", "const system =") + "\nreturn { config, system };";
  const stubs = { createSystem: (...a) => ({ merged: a }), defaultConfig: { stub: true }, defineConfig: (c) => c };
  return new Function("createSystem", "defaultConfig", "defineConfig", body)(stubs.createSystem, stubs.defaultConfig, stubs.defineConfig);
}

function assertValueLeaves(node, path = "") {
  if (node && typeof node === "object" && "value" in node) return;
  assert.ok(node && typeof node === "object", `${path} must be a { value } token`);
  for (const [k, v] of Object.entries(node)) assertValueLeaves(v, `${path}.${k}`);
}

test("chakra output: valid, {value}-wrapped, colorPalette contract complete, light+dark surfaces", () => {
  for (const id of ["glassmorphism", "cyberpunk", "clean-minimalism", "neo-brutalism"]) {
    const { config } = evalChakra(text(call("generate_chakra_system", { style: id })));
    const { tokens, semanticTokens } = config.theme;
    assertValueLeaves(tokens.colors, "tokens.colors");
    assert.deepEqual(Object.keys(tokens.colors.brand).map(Number), SCALE_STEPS);
    assert.deepEqual(Object.keys(semanticTokens.colors.brand), ["solid", "contrast", "fg", "muted", "subtle", "emphasized", "focusRing"]);
    assertValueLeaves(semanticTokens.colors, "semanticTokens.colors");
    assert.ok("base" in semanticTokens.colors.surface.canvas.value && "_dark" in semanticTokens.colors.surface.canvas.value);
    for (const key of ["solid", "contrast", "fg", "muted", "subtle", "emphasized", "focusRing"]) {
      assert.ok("base" in semanticTokens.colors.brand[key].value && "_dark" in semanticTokens.colors.brand[key].value, key);
    }
    assert.ok(semanticTokens.colors.brand.fg.value._dark.startsWith("{colors.brand."));
    assert.equal(config.globalCss.body.bg, "surface.canvas");
  }
});

test("chakra output never contains v2 patterns", () => {
  const out = text(call("generate_chakra_system", { style: "glassmorphism" }));
  for (const banned of ["extendTheme", "ColorModeScript", "colorScheme", "baseStyle", "theme={"]) assert.ok(!out.includes(banned), banned);
});

test("semantic fg and ink meet AA on their canvas in light and dark for every style", () => {
  for (const style of catalog.styles.values()) {
    const theme = JSON.parse(text(call("generate_tokens", { style: style.id, format: "json" })));
    for (const mode of ["light", "dark"]) {
      const s = theme.surfaces[mode];
      assert.ok(contrastRatio(s.ink, s.canvas) >= 4.5, `${style.id} ${mode} ink`);
      assert.ok(contrastRatio(s.inkMuted, s.canvas) >= 4.5, `${style.id} ${mode} inkMuted`);
    }
  }
});

test("dark-only styles resolve the same values in both modes", () => {
  const theme = JSON.parse(text(call("generate_tokens", { style: "cyberpunk", format: "json" })));
  assert.deepEqual(theme.surfaces.light, theme.surfaces.dark);
  const css = text(call("generate_tokens", { style: "cyberpunk", format: "css" }));
  assert.ok(!css.includes(".dark {"));
  assert.ok(!css.split("\n").some((l) => l.startsWith("//")), "css output must not contain // comments");
});

test("brandColor override and paletteName are honored; bad input is a tool error", () => {
  const out = text(call("generate_chakra_system", { style: "glassmorphism", brandColor: "#ff6600", paletteName: "accent" }));
  assert.ok(out.includes('500: { value: "#ff6600" }') && out.includes("accent: {"));
  assert.equal(call("generate_chakra_system", { style: "glassmorphism", brandColor: "nope" }).isError, true);
  assert.equal(call("generate_chakra_system", { style: "glassmorphism", paletteName: "Bad Name" }).isError, true);
  assert.equal(call("generate_chakra_system", { style: "glassmorphism", paletteName: "surface" }).isError, true);
  assert.equal(call("generate_tokens", { style: "glassmorphism", format: "constructor" }).isError, true);
  assert.match(text(call("get_style", { style: "glasmorphism" })), /Unknown style/);
  assert.equal(call("nope").isError, true);
});

test("check_contrast and list/search/get tools", () => {
  const c = JSON.parse(text(call("check_contrast", { foreground: "#000", background: "#fff" })));
  assert.equal(c.ratio, 21);
  assert.equal(c.aaNormalText, true);
  assert.equal(JSON.parse(text(call("list_style_categories"))).categories.length, 19);
  const g = JSON.parse(text(call("get_style", { style: "cyberpunk" })));
  assert.equal(g.profileSource, "style-override");
  assert.equal(JSON.parse(text(call("get_style", { style: "meditation" }))).profileSource, "style-override");
  assert.equal(JSON.parse(text(call("get_style", { style: "fitness" }))).profileSource, "category-default");
});

test("protocol: initialize, ping, tools/list, unknown method, notifications", () => {
  assert.equal(handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } }).result.protocolVersion, "2024-11-05");
  assert.equal(handle({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } }).result.protocolVersion, "2025-06-18");
  assert.deepEqual(handle({ jsonrpc: "2.0", id: 3, method: "ping" }).result, {});
  assert.equal(handle({ jsonrpc: "2.0", id: 4, method: "tools/list" }).result.tools.length, 6);
  assert.equal(handle({ jsonrpc: "2.0", id: 5, method: "bogus" }).error.code, -32601);
  assert.equal(handle({ jsonrpc: "2.0", method: "notifications/initialized" }), undefined);
});

test("DESIGN_STYLES_PATH extension merges styles; a bad path only warns", () => {
  const warnings = [];
  const bad = loadCatalog({ DESIGN_STYLES_PATH: join(here, "missing.json") }, (m) => warnings.push(m));
  assert.equal(bad.styles.size, 95);
  assert.equal(warnings.length, 1);
  const ext = loadCatalog({ DESIGN_STYLES_PATH: join(here, "fixtures", "extra.json") }, () => {});
  assert.equal(ext.styles.size, 96);
  const g = createServer(ext)({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "generate_tokens", arguments: { style: "test-style", format: "css" } } });
  assert.ok(!g.result.isError, g.result.content[0].text);
  const chakra = createServer(ext)({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "generate_chakra_system", arguments: { style: "test-style" } } });
  assert.match(chakra.result.content[0].text, /\/\/ - first line\n\/\/   second line\n\/\/ - third effect/);
  assert.match(chakra.result.content[0].text, /Test Style Injected/);
  assert.doesNotThrow(() => evalChakra(chakra.result.content[0].text));
});

test("stdio transport: real process answers initialize and tools/call, ignores notifications, survives garbage", async () => {
  const child = spawn(process.execPath, [join(here, "..", "src", "index.js")], { stdio: ["pipe", "pipe", "pipe"] });
  const lines = [];
  let buf = "";
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      lines.push(JSON.parse(buf.slice(0, i)));
      buf = buf.slice(i + 1);
    }
  });
  const waitFor = async (n) => {
    for (let t = 0; t < 100 && lines.length < n; t++) await new Promise((r) => setTimeout(r, 50));
    assert.ok(lines.length >= n, `expected ${n} replies, got ${lines.length}`);
  };
  try {
    child.stdin.write('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}\n');
    child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
    child.stdin.write("not json\n");
    child.stdin.write('{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_contrast","arguments":{"foreground":"#000","background":"#fff"}}}\n');
    await waitFor(3);
    assert.equal(lines[0].result.serverInfo.name, "design-styles");
    assert.equal(lines[1].error.code, -32700);
    assert.equal(JSON.parse(lines[2].result.content[0].text).ratio, 21);
  } finally {
    if (!child.stdin.destroyed) child.stdin.end();
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
});
