import { templateMailOtp, typeMailOtp } from "./templateMailOtp";
import { getTransporter } from "./mailer";
import nodemailer from "nodemailer";


export async function sendMail(options: typeMailOtp): Promise<void> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail(templateMailOtp(options));

  console.log("✅ Email sent:", info.messageId);
    console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info)); // ← thêm dòng này

      return info;

}