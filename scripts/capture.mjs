import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '..', 'docs', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser (Edge)...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait 5 seconds for 3D scene, models, and HUD to initialize smoothly
  console.log('Waiting for 3D scene initialization...');
  await page.waitForTimeout(5000);

  // 1. Capture Hero Workcell Overview
  const heroPath = path.join(assetsDir, 'hero-workcell.png');
  await page.screenshot({ path: heroPath, fullPage: false });
  console.log(`Captured: ${heroPath}`);

  // 2. Open Work Order & OEE Analytics Tab
  console.log('Triggering Work Order Modal & OEE Analytics...');
  // Click on the OEE Tab in the Left Drawer if available
  try {
    const oeeTab = page.locator('button:has-text("OEE")');
    if (await oeeTab.count() > 0) {
      await oeeTab.click();
      await page.waitForTimeout(600);
    }
  } catch (e) {
    console.log('OEE tab click skipped:', e.message);
  }

  // Trigger Work Order Modal (Press 'W' or click Work Order button)
  await page.keyboard.press('w');
  await page.waitForTimeout(1200);

  const diagPath = path.join(assetsDir, 'ai-diagnostic-hud.png');
  await page.screenshot({ path: diagPath, fullPage: false });
  console.log(`Captured: ${diagPath}`);

  // Close Work Order modal (Press Escape or click close)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // 3. Trigger Exploded View
  console.log('Triggering Exploded View...');
  await page.keyboard.press('e');
  // Wait for radial disassembly animation
  await page.waitForTimeout(2000);

  const explodedPath = path.join(assetsDir, 'exploded-view.png');
  await page.screenshot({ path: explodedPath, fullPage: false });
  console.log(`Captured: ${explodedPath}`);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
