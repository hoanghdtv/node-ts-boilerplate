import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendMail(filename: string) {
  // Tạo transporter sử dụng Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hoanghdtv154@gmail.com",
    pass: "iqvb rqxp yvyr yjyb",
  },
});

  // Cấu hình nội dung email
  const mailOptions = {
    from: '"mst" <hoanghdtv154@gmail.com>',
    to: "hoanghdtv154@gmail.com",
    // to: "ntthanh15051988@gmail.com",
    subject: "Mã số thuế",
    text: "Hello! This is a email sent using Nodemailer and TypeScript.",
    // html: "<b>Hello!</b><br>This is a test email sent using <i>Nodemailer + TypeScript</i>.",
    // 🧩 Thêm phần attachments ở đây 
    attachments: [
      {
        filename: filename, // tên file hiển thị trong email
        path: path.join(path.dirname(__filename), "../", filename),
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}
