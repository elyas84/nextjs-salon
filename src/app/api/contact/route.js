import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/lib/models/ContactMessage";
import { sendEmail } from "@/lib/mailer";
import { SALON } from "@/lib/email-templates/salon-email-brand";

const normalize = (value) => String(value || "").trim();
const EMAIL_LOGO_CID = "studio-salon-logo";
const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildManagerEmailHtml = ({
  name,
  email,
  company,
  phone,
  topic,
  message,
  submittedAt,
  hasLogo,
}) => `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${SALON.outerBg};padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;border:${SALON.cardBorder};border-radius:${SALON.radiusLg};background:${SALON.cardBg};box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};background:${SALON.cardBg};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${
                        hasLogo
                          ? `<img src="cid:${EMAIL_LOGO_CID}" alt="Studio Salon" style="height:34px;width:auto;display:block;" />`
                          : `<div style="font-weight:800;letter-spacing:.04em;font-size:16px;color:${SALON.text};">Studio Salon</div>`
                      }
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:${SALON.pillBorder};border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${SALON.accent};background:${SALON.pillBg};">
                        Website inquiry
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 24px 8px;">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.accentBright};">Contact · Team inbox</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">New message from a guest</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:${SALON.textBody};">
                  This came from the Studio Salon website contact form. Reply from your mail client using the address below.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 18px;">
                <div style="margin:14px 0 0;padding:16px;border:${SALON.panelBorder};background:${SALON.panelBg};border-radius:${SALON.radiusMd};">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">Name</td>
                      <td style="padding:6px 0;font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;" align="right">Submitted</td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 10px;font-size:14px;color:${SALON.text};font-weight:800;">${escapeHtml(name)}</td>
                      <td style="padding:0 0 10px;font-size:14px;color:${SALON.text};font-weight:700;" align="right">${escapeHtml(submittedAt)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:8px 0 0;">
                        <div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">Email</div>
                        <div style="margin-top:4px;font-size:13px;color:${SALON.text};font-weight:700;">${escapeHtml(email)}</div>
                      </td>
                    </tr>
                    ${
                      phone
                        ? `<tr><td colspan="2" style="padding:10px 0 0;"><div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">Phone</div><div style="margin-top:4px;font-size:13px;color:${SALON.text};font-weight:700;">${escapeHtml(phone)}</div></td></tr>`
                        : ""
                    }
                    ${
                      topic
                        ? `<tr><td colspan="2" style="padding:10px 0 0;"><div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">Topic</div><div style="margin-top:4px;font-size:13px;color:${SALON.text};font-weight:700;">${escapeHtml(topic)}</div></td></tr>`
                        : ""
                    }
                    ${
                      company
                        ? `<tr><td colspan="2" style="padding:10px 0 0;"><div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">Extra detail</div><div style="margin-top:4px;font-size:13px;color:${SALON.text};font-weight:700;">${escapeHtml(company)}</div></td></tr>`
                        : ""
                    }
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 22px;">
                <div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;margin:0 0 8px;">Message</div>
                <div style="border:${SALON.panelBorder};background:${SALON.cardBg};border-radius:${SALON.radiusMd};padding:16px;font-size:14px;line-height:1.75;color:${SALON.text};white-space:pre-wrap;">${escapeHtml(message)}</div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.7;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong> · Reply to <span style="color:${SALON.text};font-weight:600;">${escapeHtml(email)}</span> to reach this guest.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const buildCustomerEmailHtml = ({ name, hasLogo }) => `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${SALON.outerBg};padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;border:${SALON.cardBorder};border-radius:${SALON.radiusLg};background:${SALON.cardBg};box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};background:${SALON.cardBg};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${
                        hasLogo
                          ? `<img src="cid:${EMAIL_LOGO_CID}" alt="Studio Salon" style="height:34px;width:auto;display:block;" />`
                          : `<div style="font-weight:800;letter-spacing:.04em;font-size:16px;color:${SALON.text};">Studio Salon</div>`
                      }
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:${SALON.pillBorder};border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${SALON.accent};background:${SALON.pillBg};">
                        Thank you
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 24px 8px;">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.accentBright};">We’re on it</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">We received your message</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:${SALON.textBody};">
                  Hi ${escapeHtml(name)}, thank you for reaching out to Studio Salon. A member of our team will reply to this email address as soon as we can — typically within one business day.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 18px;">
                <div style="margin:14px 0 0;padding:16px;border:${SALON.panelBorder};background:${SALON.panelBg};border-radius:${SALON.radiusMd};">
                  <div style="font-size:12px;color:${SALON.textMuted};text-transform:uppercase;letter-spacing:.12em;">What happens next</div>
                  <ol style="margin:10px 0 0;padding-left:18px;font-size:14px;line-height:1.75;color:${SALON.text};">
                    <li>We read your note — whether it’s about appointments, services, or our retail products.</li>
                    <li>We respond here, to the email address you used on the form.</li>
                    <li>If you’d prefer a call, mention a few times that work for you.</li>
                  </ol>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 22px;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:${SALON.textBody};">
                  Need something sooner? Reply to this email and we’ll prioritize it when we can.
                  If you didn’t send this request, you can ignore this message.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.7;color:${SALON.textMuted};">
                  For your security, please don’t send passwords or full card numbers by email.
                  <br /><br />
                  <strong style="color:${SALON.accent};">Studio Salon</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const getEmailLogoAttachment = async () => {
  const logoFile = normalize(process.env.EMAIL_LOGO_FILE) || "logo.png";
  const logoPath = path.join(process.cwd(), "public", logoFile);

  try {
    const content = await fs.readFile(logoPath);
    return [
      {
        filename: path.basename(logoPath),
        content,
        cid: EMAIL_LOGO_CID,
      },
    ];
  } catch {
    return [];
  }
};

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const name = normalize(body.name);
    const email = normalize(body.email).toLowerCase();
    const company = normalize(body.company);
    const phone = normalize(body.phone);
    const topic = normalize(body.topic);
    const message = normalize(body.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    const saved = await ContactMessage.create({
      name,
      email,
      company,
      phone,
      topic,
      message,
    });

    const adminReceiver = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_FROM;
    const logoAttachments = await getEmailLogoAttachment();
    const hasLogo = logoAttachments.length > 0;
    const submittedAt = new Date().toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Stockholm",
    });

    if (adminReceiver) {
      try {
        await sendEmail({
          to: adminReceiver,
          subject: `Studio Salon · New inquiry from ${name}`,
          html: buildManagerEmailHtml({
            name,
            email,
            company,
            phone,
            topic,
            message,
            submittedAt,
            hasLogo,
          }),
          attachments: logoAttachments,
        });
      } catch (emailErr) {
        console.error("Contact notify email error:", emailErr);
      }
    }

    try {
      await sendEmail({
        to: email,
        subject: "We received your message — Studio Salon",
        html: buildCustomerEmailHtml({ name, hasLogo }),
        attachments: logoAttachments,
      });
    } catch (emailErr) {
      console.error("Contact customer email error:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Message received. We will get back to you soon.",
        id: String(saved._id),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Contact form submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
