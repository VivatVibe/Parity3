const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://127.0.0.1:5173/?page=app';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('Starting UX/UI Cross-Device Simulation and Audit...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  // Helper to check horizontal overflow (bad responsive design tell)
  async function checkHorizontalOverflow(name) {
    const details = await page.evaluate(() => {
      const over = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > window.innerWidth + 1;
        })
        .map(el => `${el.tagName}.${el.className.toString().slice(0, 30)} (right=${el.getBoundingClientRect().right})`);
      return { isOverflow: over.length > 0, details: over.slice(0, 3) };
    });
    console.log(`[${name}] Horizontal scroll overflow: ${details.isOverflow ? 'FAIL ' + JSON.stringify(details.details) : 'PASS (Fits viewport perfectly)'}`);
    return !details.isOverflow;
  }

  // --- 1. MOBILE AUDIT (375x667 iPhone SE / standard phone) ---
  console.log('--- Testing Viewport 1: Mobile (375 x 667) ---');
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  await checkHorizontalOverflow('Mobile');

  // Verify Mobile Bottom Nav exists
  const hasBottomNav = await page.evaluate(() => {
    const nav = document.querySelector('.md\\:hidden.fixed.bottom-0');
    return nav !== null && window.getComputedStyle(nav).display !== 'none';
  });
  console.log(`[Mobile] Bottom Navigation Bar visible: ${hasBottomNav ? 'PASS' : 'FAIL'}`);

  // Test Quick Create floating button
  console.log('[Mobile] Tapping Quick Create (+ ออกบิล) button...');
  const quickCreateBtn = await page.$('.md\\:hidden.fixed.bottom-0 button[title="สร้างบิลใหม่"]');
  if (quickCreateBtn) {
    await quickCreateBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const isModalOpen = await page.evaluate(() => document.querySelector('form') !== null);
    console.log(`[Mobile] Invoice Creation Form opened: ${isModalOpen ? 'PASS' : 'FAIL'}`);

    // Fill form
    await page.type('input[placeholder="พิมพ์ชื่อบริษัท หรือ ชื่อลูกค้า..."]', 'ลูกค้าทดสอบ บนมือถือ จำกัด');
    
    // Submit
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('บันทึกใบวางบิล'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));
  }

  // Verify full-screen invoice preview modal opened on mobile
  const hasModalPreview = await page.evaluate(() => {
    return document.querySelector('#printable-invoice') !== null;
  });
  console.log(`[Mobile] Tap invoice opens full-screen preview modal with #printable-invoice: ${hasModalPreview ? 'PASS' : 'FAIL'}`);

  // Check Signature element is rendered
  const hasSignature = await page.evaluate(() => {
    const el = document.querySelector('#printable-invoice');
    return el && el.textContent.includes('ผู้วางบิล / ผู้รับเงิน') && (el.textContent.includes('ลงนามอิเล็กทรอนิกส์') || el.querySelector('img[alt="ลายมือชื่อดิจิทัล"]'));
  });
  console.log(`[Mobile] Automated signature rendered on invoice: ${hasSignature ? 'PASS' : 'FAIL'}`);

  // Check QR Code image is generated
  const qrGenerated = await page.evaluate(() => {
    const img = document.querySelector('img[alt="PromptPay QR Code"]');
    return img !== null && img.src.startsWith('data:image/png;base64');
  });
  console.log(`[Mobile] PromptPay QR Code dynamically generated: ${qrGenerated ? 'PASS' : 'FAIL'}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-375-preview.png') });

  // Close preview modal
  const closePreviewBtn = await page.$('button.text-slate-400');
  if (closePreviewBtn) await closePreviewBtn.click();
  await new Promise(r => setTimeout(r, 300));

  // Test switching to Tax Dashboard on Mobile
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.md\\:hidden.fixed.bottom-0 button'));
    const taxBtn = buttons.find(b => b.textContent.includes('สรุป ภ.ง.ด. 90'));
    if (taxBtn) taxBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-375-tax.png') });
  console.log('[Mobile] Screenshots saved to screenshots/mobile-375-*.png\n');


  // --- 2. TABLET AUDIT (768x1024 iPad Portrait) ---
  console.log('--- Testing Viewport 2: Tablet (768 x 1024) ---');
  await page.setViewport({ width: 768, height: 1024, isMobile: false });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  await checkHorizontalOverflow('Tablet');

  const desktopHeaderVisible = await page.evaluate(() => {
    const nav = document.querySelector('nav.hidden.md\\:flex');
    return nav !== null && window.getComputedStyle(nav).display !== 'none';
  });
  console.log(`[Tablet] Adaptive Header navigation active: ${desktopHeaderVisible ? 'PASS' : 'FAIL'}`);

  // Switch to Tax Dashboard
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header nav button'));
    const taxBtn = buttons.find(b => b.textContent.includes('สรุปภาษี'));
    if (taxBtn) taxBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await checkHorizontalOverflow('Tablet-Tax');

  // Test opening 50 Tawi Reminder Modal
  const tawiModalTriggered = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent && btn.textContent.includes('ทวงใบ 50 ทวิ'));
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  if (tawiModalTriggered) {
    await new Promise(r => setTimeout(r, 400));
    await checkHorizontalOverflow('Tablet-Tawi-Modal');
    const hasModal = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('รายการใบ 50 ทวิ'));
      return h !== undefined && h !== null;
    });
    console.log(`[Tablet] 50 Tawi Reminder Modal opened with client breakdown: ${hasModal ? 'PASS' : 'FAIL'}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet-768-tawi-modal.png') });
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="ปิดหน้าต่าง"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tablet-768-tax.png') });
  console.log('[Tablet] Screenshots saved to screenshots/tablet-768-*.png\n');


  // --- 3. DESKTOP AUDIT (1440x900 MacBook / Desktop) ---
  console.log('--- Testing Viewport 3: Desktop (1440 x 900) ---');
  await page.setViewport({ width: 1440, height: 900, isMobile: false });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  await checkHorizontalOverflow('Desktop');

  // Verify Split-View Layout: Left List (col-span-5), Right Live Preview (col-span-7)
  const isSplitViewActive = await page.evaluate(() => {
    const rightCol = document.querySelector('.lg\\:col-span-7.sticky');
    return rightCol !== null && window.getComputedStyle(rightCol).display !== 'none';
  });
  console.log(`[Desktop] Split-View two-column layout active: ${isSplitViewActive ? 'PASS' : 'FAIL'}`);

  // Test clicking an item in left list updates right sticky preview in real-time
  const initialInvoiceNumber = await page.evaluate(() => {
    const el = document.querySelector('.lg\\:col-span-7 .font-mono-numbers');
    return el ? el.textContent.trim() : '';
  });

  const cards = await page.$$('.lg\\:col-span-5 > div');
  if (cards.length > 1) {
    await cards[1].click();
    await new Promise(r => setTimeout(r, 300));
    const updatedInvoiceNumber = await page.evaluate(() => {
      const el = document.querySelector('.lg\\:col-span-7 .font-mono-numbers');
      return el ? el.textContent.trim() : '';
    });
    console.log(`[Desktop] Left click live-updates right document (${initialInvoiceNumber} -> ${updatedInvoiceNumber}): ${initialInvoiceNumber !== updatedInvoiceNumber ? 'PASS' : 'FAIL'}`);
  }

  // Test Keyboard Shortcut Cmd/Ctrl + N
  console.log('[Desktop] Testing ⌘+N keyboard shortcut to open invoice creator...');
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyN');
  await page.keyboard.up('Meta');
  await new Promise(r => setTimeout(r, 400));

  const modalOpenedViaKey = await page.evaluate(() => document.querySelector('form') !== null);
  console.log(`[Desktop] ⌘+N shortcut opened invoice modal: ${modalOpenedViaKey ? 'PASS' : 'FAIL'}`);

  // Close modal with Cancel button
  const cancelBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ยกเลิก'));
    if (btn) btn.click();
    return btn !== null;
  });
  await new Promise(r => setTimeout(r, 300));

  // Take Desktop screenshots
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-1440-splitview.png') });

  // Switch to Tax Bento Grid
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header nav button'));
    const taxBtn = buttons.find(b => b.textContent.includes('สรุปภาษี'));
    if (taxBtn) taxBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-1440-bento-tax.png') });
  console.log('[Desktop] Screenshots saved to screenshots/desktop-1440-*.png\n');

  // Switch to Profile & Signature configuration
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header nav button'));
    const profileBtn = buttons.find(b => b.textContent.includes('โปรไฟล์'));
    if (profileBtn) profileBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const hasSignatureSettings = await page.evaluate(() => {
    return document.body.textContent.includes('ลายเซ็นผู้วางบิล / ผู้รับเงิน') &&
           document.body.textContent.includes('ลายเซ็นอัตโนมัติ') &&
           document.body.textContent.includes('วาดลายมือชื่อ');
  });
  console.log(`[Desktop] Profile signature management UI active: ${hasSignatureSettings ? 'PASS' : 'FAIL'}`);

  // Switch to 'วาดลายมือชื่อ' to test SignaturePad canvas
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const drawBtn = btns.find(b => b.textContent.includes('วาดลายมือชื่อ'));
    if (drawBtn) drawBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const hasCanvas = await page.evaluate(() => document.querySelector('canvas') !== null);
  console.log(`[Desktop] Interactive HTML5 Signature Canvas rendered: ${hasCanvas ? 'PASS' : 'FAIL'}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-1440-signature-pad.png') });

  await browser.close();
  console.log('All audits completed successfully!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
