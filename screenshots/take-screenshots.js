const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-tan-ten-48.vercel.app';
const OUT_DIR = __dirname;

// Test credentials — register first, then login
const EMAIL = 'demo@repolaunch.dev';
const PASSWORD = 'demo1234';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT_DIR, '01-login.png'), fullPage: false });
  console.log('✓ 01-login.png');

  // 2. Register page
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT_DIR, '02-register.png'), fullPage: false });
  console.log('✓ 02-register.png');

  // 3. Register demo account (ignore errors if already exists), then login
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Now login
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 }).catch(() => {});
  // Wait for spinner to disappear (data loaded)
  await page.waitForSelector('svg.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '03-dashboard.png'), fullPage: false });
  console.log('✓ 03-dashboard.png');

  // 4. New project page
  await page.goto(`${BASE_URL}/new`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT_DIR, '04-new-project.png'), fullPage: false });
  console.log('✓ 04-new-project.png');

  // 5. Project detail — navigate directly
  await page.goto(`${BASE_URL}/project/686e40f0-e4c3-473c-bdc6-63c01fee71c6`);
  await page.waitForSelector('svg.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, '05-project-detail.png'), fullPage: false });
  console.log('✓ 05-project-detail.png');

  await browser.close();
  console.log('\nAll screenshots saved to', OUT_DIR);
}

run().catch(err => { console.error(err); process.exit(1); });
// Run separately for deployment logs screenshot
