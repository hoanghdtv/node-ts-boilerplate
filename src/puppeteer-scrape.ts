import puppeteer from 'puppeteer';
import fs from 'fs/promises';

export async function run(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('puppeteer-scraper/1.0');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  // bạn có thể chạy page.waitForSelector(...) nếu muốn chắc chắn DOM đã sẵn sàng
  const html = await page.content();
  const title = await page.title();

//   await fs.writeFile('downloaded-rendered.html', html, 'utf8');
  console.log('Title:', title);
  await browser.close();
   return html;
}

// if (require.main === module) {
//   const url = process.argv[2];
//   if (!url) { console.error('Usage: ts-node src/puppeteer-scrape.ts <url>'); process.exit(1); }
//   run(url).catch(e => { console.error(e); process.exit(2); });
// }
