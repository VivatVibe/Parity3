const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://127.0.0.1:5173/?page=app';
const DOWNLOAD_DIR = path.join(__dirname, '../tmp/pdf-downloads');

async function testPdfDownload() {
  console.log('--- Testing 1-Click PDF Download Button ---');

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Clear existing files in download dir
  fs.readdirSync(DOWNLOAD_DIR).forEach(f => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  await page.setViewport({ width: 1440, height: 900 });

  // Set download behavior via CDP
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Find and click on the first invoice in the list to open InvoicePreviewModal
  console.log('Opening Invoice Preview Modal...');
  const clickedModal = await page.evaluate(() => {
    // On desktop, click the print / preview button in the preview pane or list
    const btns = Array.from(document.querySelectorAll('button'));
    const openBtn = btns.find(b => b.textContent.includes('สั่งพิมพ์ / PDF') || b.textContent.includes('พิมพ์ / บันทึก PDF') || b.textContent.includes('พิมพ์'));
    if (openBtn) {
      openBtn.click();
      return true;
    }
    return false;
  });

  assert(clickedModal, 'Failed to find print/preview button to open modal');
  await new Promise(r => setTimeout(r, 800));

  // Verify modal is open and download button exists
  const downloadBtn = await page.$('[data-testid="download-pdf-btn"]');
  assert(downloadBtn, 'Download PDF button with [data-testid="download-pdf-btn"] must exist');

  const btnText = await page.evaluate(el => el.textContent, downloadBtn);
  console.log(`Found PDF button with label: "${btnText}"`);
  assert(btnText.includes('ดาวน์โหลด PDF'), 'Button must display "ดาวน์โหลด PDF"');

  // Click the Download PDF button
  console.log('Clicking "ดาวน์โหลด PDF" button...');
  await downloadBtn.click();

  // Wait for PDF generation and download (up to 10 seconds)
  console.log('Waiting for PDF file to be downloaded...');
  let downloadedFile = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pdf'));
    if (files.length > 0) {
      downloadedFile = path.join(DOWNLOAD_DIR, files[0]);
      // Ensure file is finished writing (size > 0 and no .crdownload)
      const crdownloads = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.crdownload'));
      if (crdownloads.length === 0) {
        break;
      }
    }
  }

  assert(downloadedFile && fs.existsSync(downloadedFile), 'PDF file must be downloaded to disk');
  const stats = fs.statSync(downloadedFile);
  console.log(`✔ Downloaded file: ${path.basename(downloadedFile)} (${(stats.size / 1024).toFixed(1)} KB)`);

  // Verify file is a valid PDF (starts with %PDF)
  const buffer = fs.readFileSync(downloadedFile);
  const header = buffer.slice(0, 5).toString('ascii');
  assert.strictEqual(header, '%PDF-', 'Downloaded file must begin with %PDF- magic bytes');
  assert(stats.size > 10000, 'PDF size should be at least 10KB');

  await browser.close();
  console.log('✔ All PDF Download Tests Passed Successfully!\n');
}

testPdfDownload().catch(err => {
  console.error('❌ PDF Download Test Failed:', err);
  process.exit(1);
});
