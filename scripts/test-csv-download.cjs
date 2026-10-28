const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://127.0.0.1:5173/?page=app';

(async () => {
  const downloadPath = path.resolve(__dirname, '..', 'tmp', 'csv-downloads');
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Switch to PND 90 tab
  const tabClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const pndTab = buttons.find(b => b.textContent && b.textContent.includes('ภ.ง.ด. 90'));
    if (pndTab) {
      pndTab.click();
      return true;
    }
    return false;
  });
  assert(tabClicked, 'Must be able to switch to PND 90 tab');
  await new Promise(r => setTimeout(r, 600));

  // Find and click Export CSV button
  const exportClicked = await page.evaluate(() => {
    const exportBtn = document.querySelector('button[title*="ส่งออกรายงานสรุปภาษี ภ.ง.ด. 90"]');
    if (exportBtn) {
      exportBtn.click();
      return true;
    }
    return false;
  });
  assert(exportClicked, 'Export CSV button must be rendered and clickable');
  await new Promise(r => setTimeout(r, 1200));

  const files = fs.readdirSync(downloadPath).filter(f => f.endsWith('.csv'));
  assert(files.length > 0, 'Downloaded CSV file must exist');

  const csvFile = path.join(downloadPath, files[0]);
  const content = fs.readFileSync(csvFile, 'utf8');
  console.log(`✔ Downloaded CSV file: ${files[0]} (${content.length} chars)`);

  // Verify UTF-8 BOM byte sequence 0xEF 0xBB 0xBF
  const buffer = fs.readFileSync(csvFile);
  assert.strictEqual(buffer[0], 0xEF, 'Byte 0 must be 0xEF');
  assert.strictEqual(buffer[1], 0xBB, 'Byte 1 must be 0xBB');
  assert.strictEqual(buffer[2], 0xBF, 'Byte 2 must be 0xBF');
  console.log('✔ UTF-8 BOM byte order mark verified (0xEF 0xBB 0xBF)');

  // Verify key tax breakdown lines
  assert(content.includes('รายงานสรุปข้อมูลภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90)'), 'Must have title');
  assert(content.includes('สรุปการคำนวณภาษีเงินได้สุทธิ และยอดขอคืนภาษี'), 'Must have tax calculation section');
  assert(content.includes('เงินได้สุทธิที่ต้องนำไปคำนวณภาษี (Net Taxable Income)'), 'Must have net taxable income');
  assert(content.includes('รายละเอียดการคำนวณตามอัตราภาษีเงินได้ก้าวหน้า (Tax Brackets)'), 'Must have bracket calculation');
  console.log('✔ CSV data integrity and tax breakdown verified successfully!');

  // Cleanup
  fs.rmSync(downloadPath, { recursive: true, force: true });
  await browser.close();
  console.log('All CSV download and encoding checks passed!');
})().catch(err => {
  console.error('CSV Test Error:', err);
  process.exit(1);
});
