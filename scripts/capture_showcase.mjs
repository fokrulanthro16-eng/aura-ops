import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const showcaseDir = path.join(rootDir, 'showcase');
const docsAssetsDir = path.join(rootDir, 'docs', 'assets');

if (!fs.existsSync(showcaseDir)) fs.mkdirSync(showcaseDir, { recursive: true });
if (!fs.existsSync(docsAssetsDir)) fs.mkdirSync(docsAssetsDir, { recursive: true });

async function main() {
  console.log('=== Step 1: Capturing 5 Ultra-High-Resolution Screenshots ===');

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
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (err) {
    console.warn('Localhost navigation slow, falling back to production URL...');
    await page.goto('https://aura-ops-sand.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  // Allow 5 seconds for complete WebGL canvas initialization
  console.log('Initializing WebGL Spatial Scene and OSHA elements...');
  await page.waitForTimeout(5000);

  // 1. 01_workcell_hero.png
  console.log('Capturing 01_workcell_hero.png...');
  const heroPath = path.join(showcaseDir, '01_workcell_hero.png');
  await page.screenshot({ path: heroPath });
  fs.copyFileSync(heroPath, path.join(docsAssetsDir, '01_workcell_hero.png'));
  console.log(`✓ Saved: ${heroPath}`);

  // 2. 02_pick_and_place.png (Switch to Tool Camera and wait for grasp phase)
  console.log('Switching to CAM 02: TOOL END-EFFECTOR...');
  try {
    const toolCamBtn = page.locator('button:has-text("TOOL")').first();
    if (await toolCamBtn.count() > 0) {
      await toolCamBtn.click();
    } else {
      await page.keyboard.press('c');
    }
  } catch {
    await page.keyboard.press('c');
  }
  // Wait for camera lerp and keyframe motion
  await page.waitForTimeout(3500);

  console.log('Capturing 02_pick_and_place.png...');
  const pnpPath = path.join(showcaseDir, '02_pick_and_place.png');
  await page.screenshot({ path: pnpPath });
  fs.copyFileSync(pnpPath, path.join(docsAssetsDir, '02_pick_and_place.png'));
  console.log(`✓ Saved: ${pnpPath}`);

  // 3. 03_ai_scanner_diagnostic.png (Trigger AI diagnostic scan and open OEE panel)
  console.log('Activating AI Diagnostics and OEE Telemetry...');
  // Switch back to ISO view
  try {
    const isoBtn = page.locator('button:has-text("ISO")').first();
    if (await isoBtn.count() > 0) await isoBtn.click();
  } catch {}
  await page.waitForTimeout(1000);

  // Open OEE Analytics Tab
  try {
    const oeeTab = page.locator('button:has-text("OEE")').first();
    if (await oeeTab.count() > 0) await oeeTab.click();
  } catch {}

  // Trigger AI Diagnostics
  await page.keyboard.press('d');
  await page.waitForTimeout(2000);

  console.log('Capturing 03_ai_scanner_diagnostic.png...');
  const diagPath = path.join(showcaseDir, '03_ai_scanner_diagnostic.png');
  await page.screenshot({ path: diagPath });
  fs.copyFileSync(diagPath, path.join(docsAssetsDir, '03_ai_scanner_diagnostic.png'));
  console.log(`✓ Saved: ${diagPath}`);

  // 4. 04_radial_exploded_view.png
  console.log('Engaging Radial Exploded View...');
  await page.keyboard.press('e');
  // Wait 2.2 seconds for radial expansion
  await page.waitForTimeout(2200);

  console.log('Capturing 04_radial_exploded_view.png...');
  const explodePath = path.join(showcaseDir, '04_radial_exploded_view.png');
  await page.screenshot({ path: explodePath });
  fs.copyFileSync(explodePath, path.join(docsAssetsDir, '04_radial_exploded_view.png'));
  console.log(`✓ Saved: ${explodePath}`);

  // 5. 05_sap_cmms_dispatch.png (Open SAP Work Order modal)
  console.log('Opening Enterprise CMMS Work Order Dispatcher...');
  await page.keyboard.press('w');
  await page.waitForTimeout(1200);

  console.log('Capturing 05_sap_cmms_dispatch.png...');
  const sapPath = path.join(showcaseDir, '05_sap_cmms_dispatch.png');
  await page.screenshot({ path: sapPath });
  fs.copyFileSync(sapPath, path.join(docsAssetsDir, '05_sap_cmms_dispatch.png'));
  console.log(`✓ Saved: ${sapPath}`);

  await browser.close();

  console.log('\n=== Step 2: Generating Showcase Video ===');
  assembleVideo();
}

function assembleVideo() {
  const ffmpegPath = ffmpegInstaller.path;
  const audioPath = path.join(showcaseDir, 'aura_ops_executive_voiceover.mp3');
  const videoPath = path.join(showcaseDir, 'AURA_OPS_MetaVR_Showcase.mp4');

  if (!fs.existsSync(audioPath)) {
    console.error('Audio file not found at:', audioPath);
    return;
  }

  // Measure audio duration using ffmpeg
  const probe = spawnSync(ffmpegPath, ['-i', audioPath], { encoding: 'utf8' });
  const durationMatch = (probe.stderr || '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  let totalDuration = 70;
  if (durationMatch) {
    const hours = parseFloat(durationMatch[1]);
    const mins = parseFloat(durationMatch[2]);
    const secs = parseFloat(durationMatch[3]);
    totalDuration = hours * 3600 + mins * 60 + secs;
  }
  console.log(`Voiceover Duration: ${totalDuration.toFixed(1)} seconds`);

  // Each slide duration
  const slideDuration = +(totalDuration / 5).toFixed(2);
  console.log(`Slide Duration: ${slideDuration}s per screenshot`);

  // Create concat input list
  const concatListPath = path.join(showcaseDir, 'slides.txt');
  const slides = [
    '01_workcell_hero.png',
    '02_pick_and_place.png',
    '03_ai_scanner_diagnostic.png',
    '04_radial_exploded_view.png',
    '05_sap_cmms_dispatch.png',
  ];

  let concatContent = '';
  for (const s of slides) {
    const filePath = path.join(showcaseDir, s).replace(/\\/g, '/');
    concatContent += `file '${filePath}'\nduration ${slideDuration}\n`;
  }
  // Repeat last image without duration per ffmpeg concat specs
  const lastPath = path.join(showcaseDir, slides[slides.length - 1]).replace(/\\/g, '/');
  concatContent += `file '${lastPath}'\n`;

  fs.writeFileSync(concatListPath, concatContent, 'utf8');

  console.log('Rendering 1080p 60fps MP4 with executive voiceover...');
  const ffmpegArgs = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-i', audioPath,
    '-c:v', 'libx264',
    '-tune', 'stillimage',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    videoPath,
  ];

  const res = spawnSync(ffmpegPath, ffmpegArgs, { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error('FFmpeg error:', res.stderr);
  } else {
    console.log(`\n======================================================`);
    console.log(`🎉 ALL DELIVERABLES GENERATED SUCCESSFULLY!`);
    console.log(`======================================================`);
    console.log(`[1] Hero Screenshot:      ${path.join(showcaseDir, '01_workcell_hero.png')}`);
    console.log(`[2] Pick & Place:         ${path.join(showcaseDir, '02_pick_and_place.png')}`);
    console.log(`[3] AI Diagnostic Scan:   ${path.join(showcaseDir, '03_ai_scanner_diagnostic.png')}`);
    console.log(`[4] Exploded View:        ${path.join(showcaseDir, '04_radial_exploded_view.png')}`);
    console.log(`[5] SAP CMMS Dispatch:    ${path.join(showcaseDir, '05_sap_cmms_dispatch.png')}`);
    console.log(`[6] Executive Audio:      ${audioPath}`);
    console.log(`[7] Showcase Video (MP4): ${videoPath}`);
    console.log(`======================================================`);
  }
}

main().catch((err) => {
  console.error('Capture pipeline failed:', err);
  process.exit(1);
});
