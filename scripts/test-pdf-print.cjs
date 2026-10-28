const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://127.0.0.1:5173/?page=app';
const OUTPUT_PDF = path.join(__dirname, '../screenshots/sample-invoice.pdf');

async function testPdfExport() {
  console.log('Testing PDF Print Engine via Chrome DevTools...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Click on print / preview button to open modal
  await page.evaluate(() => {
    const testidBtn = document.querySelector('[data-testid="open-preview-modal-btn"]');
    if (testidBtn) {
      testidBtn.click();
      return;
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const printBtn = btns.find(b => b.textContent.includes('พิมพ์') || b.textContent.includes('ตัวอย่างเต็มจอ'));
    if (printBtn) printBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify #printable-invoice exists
  const invoiceExists = await page.evaluate(() => document.querySelector('#printable-invoice') !== null);
  if (!invoiceExists) {
    throw new Error('#printable-invoice not found when opening print modal');
  }

  // Emulate print media
  await page.emulateMediaType('print');

  // Generate PDF
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });

  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`PDF successfully generated: ${OUTPUT_PDF} (${(stats.size / 1024).toFixed(1)} KB)`);

  await browser.close();
  console.log('PDF verification passed!');
}

testPdfExport().catch(err => {
  console.error('PDF Test Failed:', err);
  process.exit(1);
});
