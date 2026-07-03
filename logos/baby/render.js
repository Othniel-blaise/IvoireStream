const puppeteer = require('../node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIR = __dirname;
const MOBILE_ASSETS = path.join(DIR, '..', '..', 'mobile', 'assets');
const EXPORTS = path.join(DIR, 'exports');

// [svg source, output path, width, height, background color (or null = transparent)]
const jobs = [
  ['baby-icon.svg',            path.join(MOBILE_ASSETS, 'icon.png'),                     1024, 1024, null],
  ['baby-icon.svg',            path.join(MOBILE_ASSETS, 'splash-icon.png'),              1024, 1024, null],
  ['baby-icon.svg',            path.join(MOBILE_ASSETS, 'favicon.png'),                    48,   48, null],
  ['baby-icon-foreground.svg', path.join(MOBILE_ASSETS, 'android-icon-foreground.png'),   512,  512, null],
  ['baby-icon-background.svg', path.join(MOBILE_ASSETS, 'android-icon-background.png'),   512,  512, null],
  ['baby-icon-monochrome.svg', path.join(MOBILE_ASSETS, 'android-icon-monochrome.png'),    432,  432, null],
  // Reference exports (press kit / web use)
  ['baby-icon.svg',             path.join(EXPORTS, 'baby-icon.png'),              512, 512, null],
  ['baby-wordmark-pink.svg',     path.join(EXPORTS, 'baby-wordmark-pink.png'),     900, 360, null],
  ['baby-wordmark-violet.svg',   path.join(EXPORTS, 'baby-wordmark-violet.png'),   900, 360, null],
  ['baby-wordmark-reversed.svg', path.join(EXPORTS, 'baby-wordmark-reversed.png'), 1000, 420, null],
];

async function run() {
  fs.mkdirSync(EXPORTS, { recursive: true });
  console.log('Launching Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const [file, out, w, h, bg] of jobs) {
    const svgContent = fs.readFileSync(path.join(DIR, file), 'utf8');
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${bg || 'transparent'}; display:flex; align-items:center; justify-content:center; width:${w}px; height:${h}px; overflow:hidden; }
  svg { width:${w}px; height:${h}px; display:block; }
</style></head>
<body>${svgContent}</body></html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: out, type: 'png', omitBackground: !bg, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(`  OK  ${path.relative(path.join(DIR, '..', '..'), out)}  (${w}x${h})`);
    await page.close();
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => { console.error('FAILED', err); process.exit(1); });
