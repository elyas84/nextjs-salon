import nodemailer from "nodemailer";
import { requiredEnv } from "@/lib/env";
import { salonEmailFromDisplayName } from "@/lib/email-templates/salon-email-brand";

const isProd = process.env.NODE_ENV === "production";

const getSmtpConfig = () => {
  try {
    return {
      host: requiredEnv("SMTP_HOST"),
      port: Number(requiredEnv("SMTP_PORT")),
      user: requiredEnv("SMTP_USER"),
      pass: requiredEnv("SMTP_PASS"),
      from: requiredEnv("SMTP_FROM"),
    };
  } catch (error) {
    if (isProd) throw error;
    return null;
  }
};

const createTransporter = (config) =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const smtp = getSmtpConfig();
  if (!smtp) {
    // Dev fallback: avoid blocking flows when SMTP is not configured locally.
    console.log("SMTP not configured. Email payload:");
    console.log({ to, subject, html, attachmentsCount: attachments.length });
    return;
  }

  const transporter = createTransporter(smtp);
  await transporter.sendMail({
    from: `"${salonEmailFromDisplayName()}" <${smtp.from}>`,
    to,
    subject,
    html,
    attachments,
  });
};
