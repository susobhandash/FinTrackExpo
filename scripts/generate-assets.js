/**
 * Generates placeholder app assets for FinTrack:
 *   assets/icon.png          – 1024×1024, dark background + white circle + green bar chart
 *   assets/adaptive-icon.png – 1024×1024, transparent bg (Material3 adaptive foreground layer)
 *   assets/splash.png        – 1024×2048, dark background + centred logo
 */

const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg:    { r: 0x1e, g: 0x29, b: 0x3b },   // #1e293b  slate-800
  white: { r: 0xff, g: 0xff, b: 0xff },
  green: { r: 0x22, g: 0xc5, b: 0x5e },   // #22c55e  green-500
  teal:  { r: 0x0d, g: 0x94, b: 0x88 },   // #0d9488  teal-600 (accent)
};

// ── Primitive drawing helpers ─────────────────────────────────────────────────
function px(data, W, x, y, { r, g, b }, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= data.length / (4 * W)) return;
  const i = (W * y + x) * 4;
  data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
}

function rect(data, W, x, y, w, h, col, a = 255) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      px(data, W, x + dx, y + dy, col, a);
}

function circle(data, W, cx, cy, r, col, a = 255) {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (dx * dx + dy * dy <= r2)
        px(data, W, cx + dx, cy + dy, col, a);
}

// Rounded-top bar (pill cap)
function bar(data, W, x, y, w, h, col) {
  const cr = Math.floor(w / 2);
  rect(data, W, x, y + cr, w, h - cr, col);
  circle(data, W, x + cr, y + cr, cr, col);
}

// Thin anti-aliased-ish line between two points
function line(data, W, x0, y0, x1, y1, col, thickness = 6) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);
    circle(data, W, cx, cy, Math.floor(thickness / 2), col);
  }
}

// ── Icon artwork (shared by icon + adaptive-icon + splash) ────────────────────
/**
 * Draws the FinTrack logo centred at (cx, cy) scaled to `scale` (1 = full 1024 size).
 * transparent: if true, skip drawing the background circle (for adaptive foreground layer)
 */
function drawLogo(data, W, cx, cy, scale, transparent = false) {
  const R = Math.round(380 * scale);   // outer white circle radius

  // White backing circle
  if (!transparent) circle(data, W, cx, cy, R, C.white);

  // ── Bar chart ────────────────────────────────────────────────────────────
  const numBars  = 4;
  const barW     = Math.round(R * 0.28);
  const barGap   = Math.round(R * 0.09);
  const totalW   = numBars * barW + (numBars - 1) * barGap;
  const startX   = cx - Math.floor(totalW / 2);
  const bottomY  = cy + Math.round(R * 0.38);
  const maxH     = Math.round(R * 0.68);
  const heights  = [0.42, 0.64, 0.82, 1.00];

  heights.forEach((hf, i) => {
    const bh = Math.round(hf * maxH);
    const bx = startX + i * (barW + barGap);
    const by = bottomY - bh;
    bar(data, W, bx, by, barW, bh, C.green);
  });

  // ── Trend line over bars ─────────────────────────────────────────────────
  // Connect the midpoint tops of each bar
  const midXs = heights.map((_, i) => startX + i * (barW + barGap) + Math.floor(barW / 2));
  const midYs = heights.map(hf => bottomY - Math.round(hf * maxH));
  const lw = Math.max(2, Math.round(6 * scale));
  for (let i = 0; i < midXs.length - 1; i++) {
    line(data, W, midXs[i], midYs[i], midXs[i + 1], midYs[i + 1], C.teal, lw);
  }
  // Dots at each bar top
  const dotR = Math.max(2, Math.round(10 * scale));
  midXs.forEach((x, i) => circle(data, W, x, midYs[i], dotR, C.teal));
}

// ── Build PNGs ────────────────────────────────────────────────────────────────

// 1. icon.png – 1024×1024, opaque dark bg
function buildIcon() {
  const S = 1024;
  const png = new PNG({ width: S, height: S });
  rect(png.data, S, 0, 0, S, S, C.bg);
  drawLogo(png.data, S, S / 2, S / 2, 1, false);
  return png;
}

// 2. adaptive-icon.png – 1024×1024, transparent bg (Material3 foreground layer)
//    Content fits within 66 % safe-zone ≈ 676 px centred → use scale 0.82
function buildAdaptiveIcon() {
  const S = 1024;
  const png = new PNG({ width: S, height: S });
  png.data.fill(0);   // fully transparent
  // Draw at reduced scale so white circle stays within safe zone
  drawLogo(png.data, S, S / 2, S / 2, 0.82, false);
  return png;
}

// 3. splash.png – 1024×2048, dark bg + small centred logo
function buildSplash() {
  const W = 1024, H = 2048;
  const png = new PNG({ width: W, height: H });
  rect(png.data, W, 0, 0, W, H, C.bg);

  // Subtle gradient stripe (horizontal bands, slightly lighter)
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const extra = Math.round(8 * Math.sin(t * Math.PI));
    const stripe = { r: C.bg.r + extra, g: C.bg.g + extra, b: C.bg.b + extra };
    for (let x = 0; x < W; x++) px(png.data, W, x, y, stripe);
  }

  // Logo centred slightly above vertical centre
  const cy = Math.round(H * 0.40);
  drawLogo(png.data, W, W / 2, cy, 0.55, false);

  return png;
}

// ── Write files ───────────────────────────────────────────────────────────────
const outDir = path.resolve(__dirname, '../assets');
fs.mkdirSync(outDir, { recursive: true });

function save(png, name) {
  const dest = path.join(outDir, name);
  fs.writeFileSync(dest, PNG.sync.write(png));
  const kb = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  ✓  ${name}  (${kb} KB)`);
}

console.log('\nGenerating FinTrack assets…\n');
save(buildIcon(),         'icon.png');
save(buildAdaptiveIcon(), 'adaptive-icon.png');
save(buildSplash(),       'splash.png');
console.log('\nDone.\n');
