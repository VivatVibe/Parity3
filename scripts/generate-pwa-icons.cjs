const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SVG_PATH = path.join(__dirname, '../public/icon.svg');
const ICON_192_PATH = path.join(__dirname, '../public/icon-192.png');
const ICON_512_PATH = path.join(__dirname, '../public/icon-512.png');
const APPLE_TOUCH_PATH = path.join(__dirname, '../public/apple-touch-icon.png');

async function generateIcons() {
  console.log('Generating PWA icons from icon.svg...');

  const svgContent = fs.readFileSync(SVG_PATH, 'utf8');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Generate 512x512 icon
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`);
  await page.screenshot({ path: ICON_512_PATH, omitBackground: true });
  console.log('✔ Generated icon-512.png');

  // Generate 192x192 icon
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  const scaledSvg = svgContent.replace(/width="512"/, 'width="192"').replace(/height="512"/, 'height="192"');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${scaledSvg}</body></html>`);
  await page.screenshot({ path: ICON_192_PATH, omitBackground: true });
  console.log('✔ Generated icon-192.png');

  // Generate 180x180 apple touch icon
  await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
  const appleSvg = svgContent.replace(/width="512"/, 'width="180"').replace(/height="512"/, 'height="180"');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${appleSvg}</body></html>`);
  await page.screenshot({ path: APPLE_TOUCH_PATH, omitBackground: true });
  console.log('✔ Generated apple-touch-icon.png');

  await browser.close();
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
