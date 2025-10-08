import { fetchHtml, parseWithCheerio } from "./fetch";
import {run} from "./puppeteer-scrape";
import {parseCompaniesFromHtml} from "./mstparser";
import fs from 'fs/promises';
import nodemailer from 'nodemailer';
// Gửi email với file đính kèm
import { sendMail } from "./mailer";
import cron from "node-cron";

async function main() {
      let html_data = await run('https://masothue.com/');
    let companies = parseCompaniesFromHtml(html_data); 

    // Tạo header CSV
    let csv = "Công ty,Mã số thuế,Địa chỉ,Người đại diện\n";

    // Ghi từng dòng
    companies.forEach(c => {
      // Escape dấu phẩy / xuống dòng trong text
      const row = `${c.name.replace(/"/g, '""')},${c.taxCode},${c.address.replace(/"/g, '""')},${c.representative.replace(/"/g, '""')}`;
      csv += row + "\n";
    });

    // Ghi ra file
    await fs.writeFile("companies.csv", "\uFEFF" + csv, "utf8");
    console.log("Đã ghi xong file companies.csv");


    await sendMail("companies.csv");
}


/*
 Cron expression: "0 0 8 * * *"  => second minute hour day month weekday
 node-cron dùng 6-field cron (seconds optional). 
 Dùng timezone 'Asia/Ho_Chi_Minh' để đảm bảo là 8:00 theo VN.
*/

cron.schedule(
  "0 52 10 * * *",
  () => {
    console.log(new Date().toLocaleString(), "Running scheduled job...");
    main().catch(err => console.error("Error in scheduled job:", err));
  },
  {
    timezone: "Asia/Ho_Chi_Minh",
  }
);



// console.log('Parsed companies:', parsed.slice(0, 5)); // in ra 5 công ty đầu tiên 
//iqvb rqxp yvyr yjyb