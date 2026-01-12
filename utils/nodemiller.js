import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendEmail = async ({ to, subject, html }) => {
    console.log('to,subject,html',to,subject,html);
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Eatnow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export default sendEmail;
