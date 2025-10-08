import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import {decodeBuffer} from './utils';

type ParsedResult = {
  title: string;
  metas: Record<string,string>;
  links: {text:string; href:string}[];
  tables: string[][][]; // tables -> rows -> cols
  jsonLd: any[];
  htmlSnippet?: string;
};

export async function fetchHtml(url: string, timeout = 15000): Promise<string> {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout,
    headers: { 'User-Agent': 'node-ts-scraper/1.0' }
  });
  const buf = Buffer.from(res.data);
  const ct = res.headers['content-type'];
  return decodeBuffer(buf, ct);
}

export function parseWithCheerio(html: string): ParsedResult {
  const $ = cheerio.load(html);

  const title = $('head > title').text().trim();
  const metas: Record<string,string> = {};
  $('meta').each((i, el) => {
    const $el = $(el);
    const name = ($el.attr('name') || $el.attr('property') || $el.attr('itemprop') || '').trim();
    const content = ($el.attr('content') || '').trim();
    if (name && content) metas[name] = content;
  });

  const links: {text:string; href:string}[] = [];
  $('a[href]').each((i, el) => {
    const $el = $(el);
    links.push({ text: $el.text().trim(), href: $el.attr('href') || '' });
  });

  const tables: string[][][] = [];
  $('table').each((i, table) => {
    const rows: string[][] = [];
    $(table).find('tr').each((r, tr) => {
      const cols: string[] = [];
      $(tr).find('th, td').each((c, td) => cols.push($(td).text().trim()));
      rows.push(cols);
    });
    tables.push(rows);
  });

  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      jsonLd.push(JSON.parse($(el).text()));
    } catch { /* ignore parse error */ }
  });

  // small snippet (optional)
  const htmlSnippet = $('body').html()?.slice(0, 2000);

  return { title, metas, links, tables, jsonLd, htmlSnippet };
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: ts-node src/fetch-and-parse.ts <url>');
    process.exit(1);
  }

  try {
    const html = await fetchHtml(url);
    await fs.writeFile('downloaded.html', html, 'utf8');
    const parsed = parseWithCheerio(html);
    await fs.writeFile('parsed-summary.json', JSON.stringify(parsed, null, 2), 'utf8');

    console.log('Title:', parsed.title);
    console.log('Meta keys:', Object.keys(parsed.metas).slice(0,10));
    console.log('Links found:', parsed.links.length);
    console.log('Tables found:', parsed.tables.length);
    console.log('JSON-LD blocks:', parsed.jsonLd.length);
    console.log('Saved downloaded.html and parsed-summary.json');
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(2);
  }
}

// if (require.main === module) main();
