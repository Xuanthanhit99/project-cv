import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

let transporter: nodemailer.Transporter;

export async function getTransporter() {
  if (transporter) return transporter; // tái sử dụng, không tạo lại mỗi lần

  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // port 587 dùng false
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  } as SMTPTransport.Options);

  console.log("📧 Ethereal account:", testAccount.user);

  return transporter;
}