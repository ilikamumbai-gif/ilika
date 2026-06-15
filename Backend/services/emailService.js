import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 465);
const EMAIL_SECURE =
  String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER || "";
const EMAIL_APP_PASSWORD =
  process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Ilika Customer Support";
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_FROM || EMAIL_USER;

let transporter = null;

const buildFromAddress = () => {
  const fromEmail = String(EMAIL_FROM || EMAIL_USER || "").trim();
  const fromName = String(EMAIL_FROM_NAME || "").trim();
  if (!fromEmail) return "";
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
};

const htmlToText = (html = "") =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const hasEmailConfig = () => Boolean(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_APP_PASSWORD);

const getTransporter = () => {
  if (transporter) return transporter;
  if (!hasEmailConfig()) return null;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  return transporter;
};

export const sendEmail = async (to, subject, html) => {
  const recipient = String(to || "").trim();
  const emailSubject = String(subject || "").trim();
  const emailHtml = String(html || "").trim();

  if (!recipient || !emailSubject || !emailHtml) {
    const reason = "missing_required_email_fields";
    console.warn(`[email] Skipped send: ${reason}`, {
      hasTo: Boolean(recipient),
      hasSubject: Boolean(emailSubject),
      hasHtml: Boolean(emailHtml),
    });
    return { ok: false, status: "skipped", reason };
  }

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    const reason = "email_not_configured";
    console.warn(`[email] Skipped send: ${reason}`);
    return { ok: false, status: "skipped", reason };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: buildFromAddress(),
      to: recipient,
      subject: emailSubject,
      html: emailHtml,
      text: htmlToText(emailHtml),
    });

    console.log("[email] Sent successfully", {
      to: recipient,
      subject: emailSubject,
      messageId: info?.messageId || "",
    });

    return {
      ok: true,
      status: "sent",
      messageId: info?.messageId || "",
    };
  } catch (error) {
    console.error("[email] Send failed", {
      to: recipient,
      subject: emailSubject,
      error: error?.message || error,
    });
    return {
      ok: false,
      status: "failed",
      reason: error?.message || "email_send_failed",
    };
  }
};

export const isEmailConfigured = () => hasEmailConfig();
