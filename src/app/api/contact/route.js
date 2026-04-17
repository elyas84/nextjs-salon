import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/lib/models/ContactMessage";
import { sendEmail } from "@/lib/mailer";

const normalize = (value) => String(value || "").trim();
const EMAIL_LOGO_CID = "ecom-logo";
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
  message,
  submittedAt,
  hasLogo,
}) => `
  <div style="margin:0;padding:0;background:#f1f5f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:20px;background:#ffffff;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${
                        hasLogo
                          ? `<img src="cid:${EMAIL_LOGO_CID}" alt="eCom" style="height:34px;width:auto;display:block;" />`
                          : `<div style="font-weight:800;letter-spacing:.04em;font-size:16px;color:#0f172a;">eCom</div>`
                      }
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:1px solid #e2e8f0;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#334155;background:#f8fafc;">
                        New message
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 24px 8px;">
                <h1 style="margin:0;font-size:22px;line-height:1.25;color:#0f172a;">New contact form submission</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">
                  A customer reached out via the store contact form. Details are below.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 18px;">
                <div style="margin:14px 0 0;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Name</td>
                      <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Submitted</td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:800;">${escapeHtml(name)}</td>
                      <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:700;" align="right">${escapeHtml(submittedAt)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Email</td>
                      <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Company</td>
                    </tr>
                    <tr>
                      <td style="padding:0;font-size:13px;color:#0f172a;font-weight:700;">${escapeHtml(email)}</td>
                      <td style="padding:0;font-size:13px;color:#0f172a;font-weight:700;" align="right">${escapeHtml(company || "Not specified")}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 22px;">
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin:0 0 8px;">Message</div>
                <div style="border:1px solid #e2e8f0;background:#ffffff;border-radius:16px;padding:16px;font-size:14px;line-height:1.75;color:#0f172a;white-space:pre-wrap;">${escapeHtml(message)}</div>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                  Reply directly to the customer from your inbox.
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
  <div style="margin:0;padding:0;background:#f1f5f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:20px;background:#ffffff;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${
                        hasLogo
                          ? `<img src="cid:${EMAIL_LOGO_CID}" alt="eCom" style="height:34px;width:auto;display:block;" />`
                          : `<div style="font-weight:800;letter-spacing:.04em;font-size:16px;color:#0f172a;">eCom</div>`
                      }
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:1px solid #e2e8f0;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#334155;background:#f8fafc;">
                        Support
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 24px 8px;">
                <h1 style="margin:0;font-size:22px;line-height:1.25;color:#0f172a;">We received your message</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">
                  Thanks, ${escapeHtml(name)}. Our team will reply to this email as soon as possible.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 18px;">
                <div style="margin:14px 0 0;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
                  <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">What happens next</div>
                  <ol style="margin:10px 0 0;padding-left:18px;font-size:14px;line-height:1.75;color:#0f172a;">
                    <li>We review your message.</li>
                    <li>We reply to the email address you provided.</li>
                    <li>If needed, we’ll ask for any clarifying details.</li>
                  </ol>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 22px;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:#475569;">
                  If your request is urgent, reply to this email with any additional context.
                  If you did not submit the contact form, you can safely ignore this message.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                  Please don’t share sensitive information (passwords, full card numbers) by email.
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
          subject: `New Inquiry: ${name} (${email})`,
          html: buildManagerEmailHtml({
            name,
            email,
            company,
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
        subject: "We received your message — eCom Support",
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
