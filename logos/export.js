const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR = __dirname;

// Files to export as PNG
const svgExports = [
  {
    file: 'ivoirestream-primary.svg',
    out:  'ivoirestream-primary',
    w: 620, h: 130,
    bg: '#0F0F14',
    scales: [1, 2, 3],
  },
  {
    file: 'ivoirestream-light.svg',
    out:  'ivoirestream-light',
    w: 620, h: 130,
    bg: '#F6F8F7',
    scales: [1, 2, 3],
  },
  {
    file: 'ivoirestream-icon.svg',
    out:  'ivoirestream-icon',
    w: 512, h: 512,
    bg: '#0A120E',
    scales: [1, 2],
  },
  {
    file: 'ivoirestream-wordmark.svg',
    out:  'ivoirestream-wordmark',
    w: 480, h: 90,
    bg: '#0F0F14',
    scales: [1, 2, 3],
  },
];

async function run() {
  console.log('🚀 Lancement de Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ── PNG exports ──────────────────────────────────────────────────
  for (const item of svgExports) {
    const svgPath = path.join(DIR, item.file);
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    for (const scale of item.scales) {
      const pw = item.w * scale;
      const ph = item.h * scale;

      const page = await browser.newPage();
      await page.setViewport({ width: pw, height: ph, deviceScaleFactor: 1 });

      // Wrap SVG in a minimal HTML page so Google Fonts loads correctly
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@900&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${item.bg}; display:flex; align-items:center; justify-content:center; width:${pw}px; height:${ph}px; overflow:hidden; }
  svg { width:${pw}px; height:${ph}px; }
</style>
</head>
<body>${svgContent}</body>
</html>`;

      await page.setContent(html, { waitUntil: 'networkidle0' });
      // Extra wait for fonts to render
      await new Promise(r => setTimeout(r, 800));

      const suffix = scale === 1 ? '' : `@${scale}x`;
      const outFile = path.join(DIR, 'exports', `${item.out}${suffix}.png`);
      await page.screenshot({ path: outFile, type: 'png', clip: { x:0, y:0, width:pw, height:ph } });
      console.log(`  ✅ PNG  ${path.basename(outFile)}  (${pw}×${ph})`);
      await page.close();
    }
  }

  // ── PDF export: brand kit ─────────────────────────────────────────
  console.log('\n📄 Export PDF du brand kit...');
  const brandKitPath = 'file:///' + path.join(DIR, 'brand-kit.html').replace(/\\/g, '/');
  const pdfPage = await browser.newPage();
  await pdfPage.setViewport({ width: 1200, height: 900 });
  await pdfPage.goto(brandKitPath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  await pdfPage.pdf({
    path: path.join(DIR, 'exports', 'ivoirestream-brand-kit.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  console.log('  ✅ PDF  ivoirestream-brand-kit.pdf');
  await pdfPage.close();

  // ── PNG export: brand kit full page ──────────────────────────────
  console.log('\n🖼  Screenshot complet du brand kit...');
  const bkPage = await browser.newPage();
  await bkPage.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
  await bkPage.goto(brandKitPath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await bkPage.screenshot({
    path: path.join(DIR, 'exports', 'ivoirestream-brand-kit.png'),
    fullPage: true,
  });
  console.log('  ✅ PNG  ivoirestream-brand-kit.png  (pleine page)');
  await bkPage.close();

  await browser.close();

  // ── Copy SVG files into exports/ ─────────────────────────────────
  for (const item of svgExports) {
    fs.copyFileSync(
      path.join(DIR, item.file),
      path.join(DIR, 'exports', item.file)
    );
    console.log(`  ✅ SVG  ${item.file}`);
  }

  console.log('\n🎉 Export terminé → dossier exports/');
  console.log('   Contenu :');
  const files = fs.readdirSync(path.join(DIR, 'exports')).sort();
  files.forEach(f => {
    const stats = fs.statSync(path.join(DIR, 'exports', f));
    const kb = (stats.size / 1024).toFixed(1);
    console.log(`   · ${f.padEnd(48)} ${kb} KB`);
  });
}

// Create exports directory
fs.mkdirSync(path.join(DIR, 'exports'), { recursive: true });
run().catch(err => { console.error('❌', err.message); process.exit(1); });
