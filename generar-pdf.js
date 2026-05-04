const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, 'INFORME.html');
  const fileUrl = `file://${htmlPath}`;

  console.log('Cargando:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  await page.emulateMediaType('screen');

  const pdfPath = path.join(__dirname, 'INFORME.pdf');

  console.log('Generando PDF...');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0cm',
      right: '0cm',
      bottom: '0cm',
      left: '0cm'
    }
  });

  console.log('PDF generado:', pdfPath);

  await browser.close();
})();