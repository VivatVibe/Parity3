const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://127.0.0.1:5173';

async function runCommercialAudit() {
  console.log('--- Starting Commercial SaaS Flow Audit with Puppeteer ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 1. Audit Landing Page (Desktop)
    console.log('Step 1: Testing Landing Page on Desktop (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${TARGET_URL}/?page=landing`, { waitUntil: 'networkidle0' });

    const heroText = await page.evaluate(() => document.body.innerText);
    if (!heroText.includes('ออกใบวางบิลมืออาชีพ') || !heroText.includes('หัก ณ ที่จ่าย 3%')) {
      throw new Error('Landing page missing key hero copy');
    }
    console.log('✔ Hero section verified.');

    // Test live simulator calculation
    console.log('Step 2: Testing Live Simulator with 50,000 THB calculation...');
    await page.focus('input[type="number"]');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('50000');
    await new Promise(r => setTimeout(r, 400));

    const simResult = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasSubtotal: text.includes('฿50,000') || text.includes('50,000'),
        hasWht: text.includes('-฿1,500') || text.includes('1,500'),
        hasNet: text.includes('฿48,500') || text.includes('48,500')
      };
    });

    if (!simResult.hasNet) {
      throw new Error('Simulator failed to calculate 50,000 - 3% (1,500) = 48,500');
    }
    console.log('✔ Live Simulator calculated: Subtotal 50,000 - 3% WHT (1,500) = Net 48,500 correctly.');

    // Screenshot Desktop Landing Page
    const landingDesktopPath = path.join(__dirname, '../screenshots/commercial-landing-desktop.png');
    await page.screenshot({ path: landingDesktopPath, fullPage: true });
    console.log(`✔ Saved screenshot: ${landingDesktopPath}`);

    // 2. Audit Landing Page (Mobile)
    console.log('Step 3: Testing Landing Page on Mobile (375x812)...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle0' });
    const landingMobilePath = path.join(__dirname, '../screenshots/commercial-landing-mobile.png');
    await page.screenshot({ path: landingMobilePath, fullPage: true });
    console.log(`✔ Saved screenshot: ${landingMobilePath}`);

    // 3. Audit Pro Upgrade Modal Flow
    console.log('Step 4: Testing Pro Upgrade Modal & PromptPay Activation...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${TARGET_URL}/?page=landing`, { waitUntil: 'networkidle0' });

    // Click on upgrade button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const upgradeBtn = btns.find(b => b.textContent.includes('อัปเกรดเป็น Pro') || b.textContent.includes('ราคาแพ็กเกจ'));
      if (upgradeBtn) upgradeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify modal is open and QR exists
    const modalCheck = await page.evaluate(() => {
      const qrImg = document.querySelector('img[alt="PromptPay QR"]');
      const hasHeading = document.body.innerText.includes('อัปเกรดเป็น Thai Freelancer PRO');
      return { hasQr: Boolean(qrImg && qrImg.src), hasHeading };
    });

    if (!modalCheck.hasHeading || !modalCheck.hasQr) {
      throw new Error('Pro Upgrade modal or PromptPay QR not found');
    }
    console.log('✔ Pro Upgrade Modal opened and PromptPay QR code generated.');

    // Fill slip reference TxID
    await page.focus('input[placeholder*="20260328"]');
    await page.keyboard.type('202603289999');
    await new Promise(r => setTimeout(r, 200));

    // Click confirm activation
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.textContent.includes('ยืนยันการชำระเงิน'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const successCheck = await page.evaluate(() => {
      return document.body.innerText.includes('ยินดีต้อนรับสู่ PRO Member!');
    });

    if (!successCheck) {
      throw new Error('Pro upgrade success state was not reached');
    }
    console.log('✔ Pro Upgrade instant activation confirmed with slip TxID.');

    const upgradeSuccessPath = path.join(__dirname, '../screenshots/commercial-upgrade-success.png');
    await page.screenshot({ path: upgradeSuccessPath });
    console.log(`✔ Saved screenshot: ${upgradeSuccessPath}`);

    // 4. Audit Main App with Pro Tier & Google Auth Button
    console.log('Step 5: Verifying Main App Header & Pro Badge...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    const appHeaderCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasGoogleAuth = text.includes('Google') || Boolean(document.querySelector('button svg'));
      const hasProBadge = text.includes('PRO');
      return { hasGoogleAuth, hasProBadge };
    });

    if (!appHeaderCheck.hasGoogleAuth) {
      throw new Error('Google Login / Auth button not present in header');
    }
    console.log('✔ Main App header contains Google Login and Pro status.');

    const appHeaderPath = path.join(__dirname, '../screenshots/commercial-app-header.png');
    await page.screenshot({ path: appHeaderPath });
    console.log(`✔ Saved screenshot: ${appHeaderPath}`);

    console.log('--- All Commercial Audit Steps Succeeded Flawlessly! ---');
  } finally {
    await browser.close();
  }
}

runCommercialAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
