import * as cheerio from "cheerio";

export type Company = {
  name: string;
  taxCode: string;
  address: string;
  representative: string;
  taxHref: string;
  nameHref: string;
  html?: string;
};

export function parseCompaniesFromHtml(html: string): Company[] {
  const $ = cheerio.load(html);
  const results: Company[] = [];

  // Duyệt tất cả anchor trong h3 (mốc tên)
  $("h3 a").each((_, el) => {
    const $nameA = $(el);
    const name = $nameA.text().trim();
    const nameHref = $nameA.attr("href") || "";

    // Tìm container gần nhất chứa cả name/tax/address — cheeio có closest
    // Nhưng để an toàn hơn, lấy parent chain và thử tìm address / mã số thuế trong các ancestor/adjacent
    let $container = $nameA.closest("div");

    // fallback: nếu closest('div') quá nhỏ, mở rộng lên tới 3 cấp parent
    let tries = 0;
    while ($container.length && tries < 3) {
      const hasAddress = $container.find("address").length > 0;
      const hasTax = $container.find("a").filter((_, a) => $(a).text().match(/\d{6,}/)).length > 0
                      || $container.text().includes("Mã số thuế");
      if (hasAddress || hasTax) break;
      $container = $container.parent();
      tries++;
    }

    // Nếu vẫn không tìm thấy đủ, sử dụng $nameA.parent().parent() (cố gắng thêm)
    if (!$container.length) $container = $nameA.parent().parent();

    // Tìm div chứa "Mã số thuế" trong container (dùng filter để chắc)
    const $taxDiv = $container
      .find("div")
      .filter((_, d) => {
        const t = $(d).text();
        return /mã số thuế/i.test(t) || /\bMã số thuế\b/.test(t);
      })
      .first();

    // Nếu không thấy taxDiv, thử trong container trực tiếp có link số
    const $candidateTaxLink =
      $taxDiv.find("a").first().length > 0
        ? $taxDiv.find("a").first()
        : $container.find("a").filter((_, a) => $(a).text().trim().match(/^\d{6,}$/)).first();

    let taxCode = $candidateTaxLink && $candidateTaxLink.length ? $candidateTaxLink.text().trim() : "";
    let taxHref = $candidateTaxLink && $candidateTaxLink.length ? $candidateTaxLink.attr("href") || "" : "";

    let representative = "";
    // Tìm đại diện (nếu có) trong container
    const repMatch = $container.text().match(/(Người đại diện|Đại diện pháp luật)[:\s]*([^\n\r]+)/i);
    if (repMatch) {
      representative = repMatch[2].trim();
    }

    // Fallback: nếu không có link số, thử regex lấy số trong text
    if (!taxCode) {
      const match = $container.text().match(/(?:Mã\s*số\s*thuế[:\s]*)?([0-9]{6,})/i);
      taxCode = match ? match[1] : "";
    }

    // Lấy address (nếu có)
    let address = $container.find("address").first().text().replace(/\s+/g, " ").trim() || "";

    // Nếu không có address trong container, thử tìm address ở siblings ngay bên ngoài
    if (!address) {
      const $siblAddr = $container.nextAll("address").first();
      if ($siblAddr.length) address = $siblAddr.text().replace(/\s+/g, " ").trim();
    }
    address = address.replaceAll(",", " -"); // thay dấu phẩy trong address để tránh lỗi CSV

    results.push({
      name,
      taxCode,
      address,
      representative,
      taxHref,
      nameHref,
    //   html: $.html($container) // tùy chọn: raw html của block
    });
  });

  return results;
}

/* --- ví dụ dùng --- */
const html = `...`; // toàn bộ html trang (ví dụ: await page.content() từ puppeteer)
const companies = parseCompaniesFromHtml(html);
console.log(companies);
