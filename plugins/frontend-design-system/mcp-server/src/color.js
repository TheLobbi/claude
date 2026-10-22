// Pure color math: hex parsing, HSL conversion, tonal scales, WCAG contrast.

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(input) {
  const m = HEX.exec(String(input ?? "").trim());
  if (!m) throw new Error(`Invalid hex color: ${JSON.stringify(input)} (expected #rgb or #rrggbb)`);
  let h = m[1].toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return `#${h}`;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl([r, g, b]) {
  const [rn, gn, bn] = [r, g, b].map((v) => v / 255);
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

export function hslToRgb([h, s, l]) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export const hexToHsl = (hex) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl) => rgbToHex(hslToRgb(hsl));

export function mix(hexA, hexB, amountB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * amountB));
}

export function luminance(hex) {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

export function wcag(fg, bg) {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormalText: ratio >= 4.5,
    aaLargeText: ratio >= 3,
    aaaNormalText: ratio >= 7,
    aaaLargeText: ratio >= 4.5,
    aaNonTextUi: ratio >= 3,
  };
}

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const LIGHTER = { 50: 0.94, 100: 0.86, 200: 0.72, 300: 0.55, 400: 0.3 };
const DARKER = { 600: 0.2, 700: 0.42, 800: 0.62, 900: 0.8, 950: 0.92 };

/** Tonal 50-950 scale with the seed placed exactly at 500. */
export function tonalScale(seedHex) {
  const [h, s, l] = hexToHsl(seedHex);
  const scale = {};
  for (const step of SCALE_STEPS) {
    if (step === 500) scale[step] = normalizeHex(seedHex);
    else if (step < 500) scale[step] = hslToHex([h, s, l + (97 - l) * LIGHTER[step]]);
    else {
      // Very dark seeds (for example #111111) must move toward black rather
      // than toward the default 8% floor, which would make darker steps lighter.
      const darkLightness = l >= 8 ? l - (l - 8) * DARKER[step] : l * (1 - DARKER[step]);
      scale[step] = hslToHex([h, s, darkLightness]);
    }
  }
  return scale;
}
