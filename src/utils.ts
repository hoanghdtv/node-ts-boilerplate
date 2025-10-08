import {Buffer} from 'buffer';
import {parse as parseContentType} from 'content-type';
import iconv from 'iconv-lite';
import {JSDOM} from 'jsdom'; // optional dev-time only; if not installed you can parse meta with regex

export function decodeBuffer(buf: Buffer, contentTypeHeader?: string): string {
  let charset = 'utf-8';
  try {
    if (contentTypeHeader) {
      const parsed = parseContentType(contentTypeHeader);
      if (parsed.parameters?.charset) charset = parsed.parameters.charset.toLowerCase();
    }
  } catch { /* ignore */ }

  // try to detect meta charset if header missing or still utf-8 (best-effort)
  let html = iconv.decode(buf, charset);
  const metaMatch = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)/i) || html.match(/<meta[^>]+content=["'][^"'>]*charset=([^"'>\s]+)/i);
  if (metaMatch && metaMatch[1]) {
    const metaCharset = metaMatch[1].toLowerCase();
    if (metaCharset && metaCharset !== charset) {
      try {
        html = iconv.decode(buf, metaCharset);
        charset = metaCharset;
      } catch { /* fall back */ }
    }
  }
  return html;
}
