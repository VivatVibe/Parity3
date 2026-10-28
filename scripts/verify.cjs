#!/usr/bin/env node

/**
 * Unified verification harness for Thai Freelancer Billing & Tax
 * Supports launch, doctor, drive <feature>, and cleanup
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function runDoctor() {
  console.log('--- Checking Verification Environment (Doctor) ---');
  let allHealthy = true;

  // 1. Check Chrome binary
  const chromeExists = fs.existsSync(CHROME_PATH);
  console.log(`[Doctor] Chrome binary at ${CHROME_PATH}: ${chromeExists ? 'OK' : 'MISSING'}`);
  if (!chromeExists) allHealthy = false;

  // 2. Check local dev server on port 5173
  const serverUp = await checkServerReady();
  console.log(`[Doctor] Local dev server at ${BASE_URL}: ${serverUp ? 'UP & RESPONSIVE' : 'STOPPED'}`);
  if (!serverUp) {
    console.log('  -> Suggestion: run "node scripts/verify.cjs launch" or "npx vite --port 5173"');
    allHealthy = false;
  }

  // 3. Check production build
  const distExists = fs.existsSync(path.join(__dirname, '../dist/index.html'));
  console.log(`[Doctor] Production dist/ output: ${distExists ? 'COMPILED' : 'NOT BUILT'}`);

  // 4. Check screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  console.log(`[Doctor] Artifacts screenshots dir: READY (${SCREENSHOTS_DIR})`);

  console.log(`--- Doctor status: ${allHealthy ? 'HEALTHY' : 'ATTENTION NEEDED'} ---`);
  return allHealthy;
}

async function runLaunch() {
  const ready = await checkServerReady();
  if (ready) {
    console.log(`Server is already running at ${BASE_URL}`);
    return;
  }

  console.log(`Starting Vite server on ${BASE_URL}...`);
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--host', HOST], {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    if (await checkServerReady()) {
      console.log(`Vite server started successfully at ${BASE_URL}`);
      return;
    }
  }
  console.error('Failed to detect server readiness within 6 seconds');
  process.exit(1);
}

async function runDrive(feature) {
  const serverUp = await checkServerReady();
  if (!serverUp) {
    await runLaunch();
  }

  console.log(`--- Driving Verification for: ${feature || 'all'} ---`);

  if (!feature || feature === 'all' || feature === 'commercial' || feature === 'landing') {
    console.log('\n[Feature] Running Commercial & Landing Page Suite...');
    execSync('node scripts/audit-commercial.cjs', { stdio: 'inherit' });
  }

  if (!feature || feature === 'all' || feature === 'ux' || feature === 'a4' || feature === 'invoice') {
    console.log('\n[Feature] Running Cross-Device UI & A4 Print Suite...');
    execSync('node scripts/audit-ux.cjs', { stdio: 'inherit' });
    execSync('node scripts/test-pdf-print.cjs', { stdio: 'inherit' });
  }

  if (!feature || feature === 'all' || feature === 'domain' || feature === 'tax') {
    console.log('\n[Feature] Running Domain & PND90 Tax Calculation Suite...');
    execSync('node scripts/test-domain.cjs', { stdio: 'inherit' });
  }

  if (!feature || feature === 'all' || feature === 'cloud' || feature === 'd1') {
    console.log('\n[Feature] Running Cloudflare D1 Native Sync Suite...');
    execSync('node scripts/test-cloud-native.cjs', { stdio: 'inherit' });
  }

  console.log('\n✔ Verification run completed. Artifacts preserved in screenshots/.');
}

function runCleanup() {
  console.log('--- Cleaning up verification scratch state ---');
  // Retain proof artifacts in screenshots/, remove temporary locks if any
  console.log('✔ Cleanup complete. Proof artifacts preserved in screenshots/.');
}

const action = process.argv[2] || 'doctor';
const target = process.argv[3];

(async () => {
  switch (action) {
    case 'doctor':
      const ok = await runDoctor();
      process.exit(ok ? 0 : 1);
      break;
    case 'launch':
      await runLaunch();
      break;
    case 'drive':
      await runDrive(target);
      break;
    case 'cleanup':
      runCleanup();
      break;
    default:
      console.log('Usage: node scripts/verify.cjs [doctor | launch | drive <feature> | cleanup]');
      process.exit(1);
  }
})();
