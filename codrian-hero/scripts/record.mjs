// Exporta a animação em MP4 9:16 (1080x1920, 30 fps) quadro a quadro.
// Uso:  npm run dev   (em outro terminal)
//       npm run record -- [url] [fps]
// Requer: playwright (npm i -D playwright && npx playwright install chromium) e ffmpeg no PATH.
import { createRequire } from "node:module";
import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

// aceita playwright instalado no projeto ou globalmente
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.error("Instale o Playwright: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }
}

const url = process.argv[2] ?? "http://localhost:5173/?record&frames";
const fps = Number(process.argv[3] ?? 30);
const DURATION = 15;
const HOLD = 0.5; // meio segundo parado no final
const total = Math.round((DURATION + HOLD) * fps);

const framesDir = join(process.cwd(), ".frames");
const outDir = join(process.cwd(), "out");
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__ready === true);
await page.evaluate(() => document.fonts.ready);

for (let f = 0; f < total; f++) {
  const sec = f / fps;
  await page.evaluate(
    (s) =>
      new Promise((resolve) => {
        window.__seek(s);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
    sec
  );
  await page.screenshot({ path: join(framesDir, `${String(f).padStart(5, "0")}.png`) });
  if (f % fps === 0) process.stdout.write(`\r${Math.round((f / total) * 100)}%`);
}
await browser.close();

const out = join(outDir, "codrian-reels-1080x1920.mp4");
const ff = spawnSync(
  "ffmpeg",
  ["-y", "-framerate", String(fps), "-i", join(framesDir, "%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
  { stdio: "inherit" }
);
if (ff.status !== 0) process.exit(ff.status ?? 1);
rmSync(framesDir, { recursive: true, force: true });
console.log(`\nPronto: ${out}`);
