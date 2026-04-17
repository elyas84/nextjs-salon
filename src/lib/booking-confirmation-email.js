import { sendEmail } from "@/lib/mailer";
import { SALON } from "@/lib/email-templates/salon-email-brand";
import { bookingRefCode } from "@/lib/booking-ref";
import { renderBookingConfirmationPdfBuffer } from "@/lib/booking-confirmation-pdf";
import { formatSlotLabel } from "@/lib/booking-slots";

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function formatLongDate(iso) {
  const raw = String(iso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return escapeHtml(raw);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return escapeHtml(raw);
  return escapeHtml(
    d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );
}

/** Inline SVGs for HTML email (stroke icons, email-client friendly). */
const EMAIL_ICONS = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3a2 2 0 0 0-2-2l-1.5-4.5A2 2 0 0 0 14.5 4h-5A2 2 0 0 0 6.5 6.5L5 11a2 2 0 0 0-2 2v3c0 .6.4 1 1 1h2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
};

function emailDetailRow(iconKey, label, valueHtml, { first = false } = {}) {
  const icon = EMAIL_ICONS[iconKey] || "";
  const mt = first ? "0" : "8";
  return `<div style="margin-top:${mt}px;display:flex;align-items:flex-start;gap:10px;font-size:14px;color:${SALON.text};line-height:1.65;">
    <span style="flex-shrink:0;width:22px;display:flex;align-items:center;justify-content:center;padding-top:1px;">${icon}</span>
    <span><strong>${escapeHtml(label)}:</strong> ${valueHtml}</span>
  </div>`;
}

function iconForNotifyFieldKey(key) {
  const map = {
    fullName: "user",
    email: "mail",
    phone: "phone",
    registrationNumber: "fileText",
    serviceType: "clipboard",
    preferredDate: "calendar",
    preferredTime: "clock",
    notes: "fileText",
    status: "activity",
  };
  return EMAIL_ICONS[map[key]] || EMAIL_ICONS.clipboard;
}

/**
 * Sends booking confirmation email with PDF when status is confirmed.
 * Safe to call without awaiting in API routes (use .catch on caller).
 */
export async function sendBookingConfirmationEmail(booking) {
  const email = String(booking?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.warn("sendBookingConfirmationEmail: missing customer email");
    return;
  }

  const ref = bookingRefCode(booking);
  const name = escapeHtml(booking?.fullName || "there");
  const timeStr = booking?.preferredTime
    ? escapeHtml(formatSlotLabel(booking.preferredTime))
    : "—";

  const pdfBuffer = await renderBookingConfirmationPdfBuffer(booking);
  const filename = `booking-${ref}.pdf`;

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.accentBright};">Studio Salon · Appointment</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Hi ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  Your visit is <strong>confirmed</strong>. Your booking reference is
                  <strong style="color:${SALON.text};">#${escapeHtml(ref)}</strong>.
                </p>
                <div style="padding:14px 16px;background:${SALON.panelBg};border:${SALON.panelBorder};border-radius:${SALON.radiusSm};font-size:14px;color:${SALON.text};line-height:1.6;">
                  ${emailDetailRow("calendar", "Date", formatLongDate(booking?.preferredDate), { first: true })}
                  ${emailDetailRow("clock", "Time", timeStr)}
                  ${emailDetailRow("clipboard", "Service", escapeHtml(booking?.serviceType || "—"))}
                  ${emailDetailRow("fileText", "Booking reference", escapeHtml(booking?.registrationNumber || "—"))}
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  A PDF summary is attached. Bring it or show your reference when you check in at the salon.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong> · Questions? Reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await sendEmail({
    to: email,
    subject: `Studio Salon · Booking confirmed (#${ref})`,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Customer email when admin marks booking completed (includes status PDF).
 */
export async function sendBookingCompletedEmail(booking) {
  const email = String(booking?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.warn("sendBookingCompletedEmail: missing customer email");
    return;
  }

  const ref = bookingRefCode(booking);
  const name = escapeHtml(booking?.fullName || "there");
  const timeStr = booking?.preferredTime
    ? escapeHtml(formatSlotLabel(booking.preferredTime))
    : "—";

  const pdfBuffer = await renderBookingConfirmationPdfBuffer(booking);
  const filename = `booking-${ref}.pdf`;

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0284c7;">Visit completed</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Hi ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  Your appointment is marked <strong>completed</strong>. Reference
                  <strong style="color:${SALON.text};">#${escapeHtml(ref)}</strong>.
                </p>
                <div style="padding:14px 16px;background:${SALON.panelBg};border:${SALON.panelBorder};border-radius:${SALON.radiusSm};font-size:14px;color:${SALON.text};line-height:1.6;">
                  ${emailDetailRow("activity", "Status", "Completed", { first: true })}
                  ${emailDetailRow("calendar", "Date", formatLongDate(booking?.preferredDate))}
                  ${emailDetailRow("clock", "Time", timeStr)}
                  ${emailDetailRow("clipboard", "Service", escapeHtml(booking?.serviceType || "—"))}
                  ${emailDetailRow("fileText", "Booking reference", escapeHtml(booking?.registrationNumber || "—"))}
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  A PDF summary is attached for your records. Thank you for visiting Studio Salon.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await sendEmail({
    to: email,
    subject: `Studio Salon · Visit completed (#${ref})`,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Customer email when admin cancels booking (includes status PDF).
 */
export async function sendBookingCancelledEmail(booking) {
  const email = String(booking?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.warn("sendBookingCancelledEmail: missing customer email");
    return;
  }

  const ref = bookingRefCode(booking);
  const name = escapeHtml(booking?.fullName || "there");
  const timeStr = booking?.preferredTime
    ? escapeHtml(formatSlotLabel(booking.preferredTime))
    : "—";

  const pdfBuffer = await renderBookingConfirmationPdfBuffer(booking);
  const filename = `booking-${ref}.pdf`;

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#e11d48;">Appointment cancelled</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Hi ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  Your appointment has been <strong>cancelled</strong>. Reference
                  <strong style="color:${SALON.text};">#${escapeHtml(ref)}</strong>.
                </p>
                <div style="padding:14px 16px;background:${SALON.panelBg};border:${SALON.panelBorder};border-radius:${SALON.radiusSm};font-size:14px;color:${SALON.text};line-height:1.6;">
                  ${emailDetailRow("activity", "Status", "Cancelled", { first: true })}
                  ${emailDetailRow("calendar", "Was scheduled", formatLongDate(booking?.preferredDate))}
                  ${emailDetailRow("clock", "Time", timeStr)}
                  ${emailDetailRow("clipboard", "Service", escapeHtml(booking?.serviceType || "—"))}
                  ${emailDetailRow("fileText", "Booking reference", escapeHtml(booking?.registrationNumber || "—"))}
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  A PDF is attached. To book a new time, use our website or call Studio Salon.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await sendEmail({
    to: email,
    subject: `Studio Salon · Appointment cancelled (#${ref})`,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

const CUSTOMER_BOOKING_NOTIFY_FIELDS = {
  fullName: "Name",
  email: "Email",
  phone: "Phone",
  registrationNumber: "Booking reference",
  serviceType: "Service",
  preferredDate: "Preferred date",
  preferredTime: "Preferred time",
  notes: "Your notes",
  status: "Status",
};

function statusPrettyLabel(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  const map = {
    pending: "Pending",
    confirmed: "Confirmed",
    waitlisted: "Waitlisted",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  if (map[s]) return map[s];
  const raw = String(statusRaw ?? "").trim();
  return raw ? escapeHtml(raw) : "—";
}

function formatFieldForEmailHtml(key, record) {
  if (!record) return "—";
  if (key === "preferredDate") {
    return formatLongDate(record.preferredDate);
  }
  if (key === "preferredTime") {
    return record.preferredTime
      ? escapeHtml(formatSlotLabel(record.preferredTime))
      : "—";
  }
  if (key === "status") {
    return statusPrettyLabel(record.status);
  }
  return escapeHtml(String(record[key] ?? "").trim() || "—");
}

/**
 * Customer email when booking details change (not the first-time confirm /
 * completed-only / cancelled-only flows, which use dedicated templates).
 */
export async function sendBookingUpdatedEmail({ previous, booking, changedKeys }) {
  const email = String(booking?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.warn("sendBookingUpdatedEmail: missing customer email");
    return;
  }
  if (!Array.isArray(changedKeys) || changedKeys.length === 0) return;

  const ref = bookingRefCode(booking);
  const name = escapeHtml(booking?.fullName || "there");
  const pdfBuffer = await renderBookingConfirmationPdfBuffer(booking);
  const filename = `booking-${ref}.pdf`;

  const rows = changedKeys
    .map((key) => {
      const label = escapeHtml(
        CUSTOMER_BOOKING_NOTIFY_FIELDS[key] || key.replace(/([A-Z])/g, " $1"),
      );
      const fromVal = formatFieldForEmailHtml(key, previous);
      const toVal = formatFieldForEmailHtml(key, booking);
      const ic = iconForNotifyFieldKey(key);
      return `<tr>
        <td style="padding:10px 12px;border:${SALON.panelBorder};font-size:13px;color:${SALON.text};font-weight:700;vertical-align:middle;">
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <span style="line-height:0;flex-shrink:0;">${ic}</span>
            <span>${label}</span>
          </span>
        </td>
        <td style="padding:10px 12px;border:${SALON.panelBorder};font-size:13px;color:#94a3b8;text-decoration:line-through;">${fromVal}</td>
        <td style="padding:10px 12px;border:${SALON.panelBorder};font-size:13px;color:${SALON.text};font-weight:600;">${toVal}</td>
      </tr>`;
    })
    .join("");

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.accentBright};">Studio Salon · Appointment updated</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Hi ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  Your booking <strong>#${escapeHtml(ref)}</strong> was updated. Summary of changes:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;">
                  <tr style="background:${SALON.panelBg};">
                    <th align="left" style="padding:10px 12px;border:${SALON.panelBorder};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${SALON.textMuted};">Field</th>
                    <th align="left" style="padding:10px 12px;border:${SALON.panelBorder};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${SALON.textMuted};">Before</th>
                    <th align="left" style="padding:10px 12px;border:${SALON.panelBorder};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${SALON.textMuted};">After</th>
                  </tr>
                  ${rows}
                </table>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  An updated PDF is attached. If something looks wrong, reply to this email or call the salon.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await sendEmail({
    to: email,
    subject: `Studio Salon · Booking updated (#${ref})`,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  const prevEmail = String(previous?.email || "")
    .trim()
    .toLowerCase();
  if (
    changedKeys.includes("email") &&
    prevEmail &&
    prevEmail !== email
  ) {
    const noticeHtml = `
    <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
              <tr><td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td></tr>
              <tr><td style="padding:22px 24px;">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.textMuted};">Studio Salon · Booking email updated</p>
                <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  The contact email for booking <strong>#${escapeHtml(ref)}</strong> was changed from this address to
                  <strong>${escapeHtml(email)}</strong>. Future updates will go to the new address.
                </p>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  If you did not request this, contact Studio Salon right away.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;
    void sendEmail({
      to: prevEmail,
      subject: `Studio Salon · Booking #${ref} — email updated`,
      html: noticeHtml,
    }).catch((err) =>
      console.error("Booking previous-email notice failed:", err),
    );
  }
}

/**
 * Customer email when an admin permanently deletes the booking record.
 */
export async function sendBookingDeletedEmail(booking) {
  const email = String(booking?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    console.warn("sendBookingDeletedEmail: missing customer email");
    return;
  }

  const ref = bookingRefCode(booking);
  const name = escapeHtml(booking?.fullName || "there");
  const timeStr = booking?.preferredTime
    ? escapeHtml(formatSlotLabel(booking.preferredTime))
    : "—";

  const pdfBuffer = await renderBookingConfirmationPdfBuffer(booking);
  const filename = `booking-${ref}.pdf`;

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.textMuted};">Booking removed</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Hi ${name}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${SALON.textBody};">
                  Your booking <strong>#${escapeHtml(ref)}</strong> has been removed from our schedule and is no longer on file.
                </p>
                <div style="padding:14px 16px;background:${SALON.panelBg};border:${SALON.panelBorder};border-radius:${SALON.radiusSm};font-size:14px;color:${SALON.text};line-height:1.6;">
                  ${emailDetailRow("calendar", "Was scheduled", formatLongDate(booking?.preferredDate), { first: true })}
                  ${emailDetailRow("clock", "Time", timeStr)}
                  ${emailDetailRow("clipboard", "Service", escapeHtml(booking?.serviceType || "—"))}
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
                  A PDF snapshot is attached. To book again, use our website or call Studio Salon.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  <strong style="color:${SALON.accent};">Studio Salon</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await sendEmail({
    to: email,
    subject: `Studio Salon · Booking removed (#${ref})`,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

let adminBookingNotifyEnvWarned = false;

function adminBookingNotifyRecipients() {
  const raw =
    process.env.BOOKING_ADMIN_EMAIL ||
    process.env.ADMIN_BOOKING_EMAIL ||
    "";
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function bookingAdminPanelUrl() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    ""
  ).replace(/\/$/, "");
  return base ? `${base}/admin` : "";
}

/**
 * Notifies salon admin(s) when a booking is confirmed.
 * Set BOOKING_ADMIN_EMAIL (comma-separated for multiple inboxes).
 */
export async function sendBookingAdminNotificationEmail(booking) {
  const recipients = adminBookingNotifyRecipients();
  if (!recipients.length) {
    if (!adminBookingNotifyEnvWarned) {
      adminBookingNotifyEnvWarned = true;
      console.warn(
        "Confirmed bookings: set BOOKING_ADMIN_EMAIL (comma-separated) to notify admins by email.",
      );
    }
    return;
  }

  const ref = bookingRefCode(booking);
  const timeStr = booking?.preferredTime
    ? escapeHtml(formatSlotLabel(booking.preferredTime))
    : "—";
  const adminUrl = bookingAdminPanelUrl();
  const linkBlock = adminUrl
    ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${SALON.textMuted};">
        <a href="${escapeHtml(adminUrl)}" style="color:${SALON.accentBright};font-weight:600;">Open salon admin</a>
      </p>`
    : "";

  const html = `
  <div style="margin:0;padding:0;background:${SALON.outerBg};font-family:${SALON.fontStack};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:${SALON.innerPad};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:${SALON.cardBorder};border-radius:16px;background:${SALON.cardBg};overflow:hidden;box-shadow:${SALON.cardShadow};">
            <tr>
              <td style="height:4px;background:${SALON.barGradient};line-height:0;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px;border-bottom:${SALON.headBorderBottom};">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${SALON.accent};">Studio Salon · Admin</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:${SALON.text};">Confirmed booking · #${escapeHtml(ref)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <div style="padding:14px 16px;background:${SALON.panelBg};border:${SALON.panelBorder};border-radius:${SALON.radiusSm};font-size:14px;color:${SALON.text};line-height:1.65;">
                  ${emailDetailRow("user", "Guest", escapeHtml(booking?.fullName || "—"), { first: true })}
                  ${emailDetailRow("mail", "Email", escapeHtml(booking?.email || "—"))}
                  ${emailDetailRow("phone", "Phone", escapeHtml(booking?.phone || "—"))}
                  <div style="margin-top:10px;padding-top:12px;border-top:${SALON.panelBorder};">
                    ${emailDetailRow("calendar", "Date", formatLongDate(booking?.preferredDate), { first: true })}
                    ${emailDetailRow("clock", "Time", timeStr)}
                    ${emailDetailRow("clipboard", "Service", escapeHtml(booking?.serviceType || "—"))}
                    ${emailDetailRow("fileText", "Booking reference", escapeHtml(booking?.registrationNumber || "—"))}
                  </div>
                  ${
                    booking?.notes
                      ? `<div style="margin-top:10px;padding-top:12px;border-top:${SALON.panelBorder};">${emailDetailRow("fileText", "Guest notes", escapeHtml(booking.notes).replace(/\r?\n/g, "<br/>"), { first: true })}</div>`
                      : ""
                  }
                </div>
                ${linkBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:${SALON.footBorderTop};background:${SALON.footBg};">
                <p style="margin:0;font-size:12px;line-height:1.65;color:${SALON.textMuted};">
                  Salon booking notification · not a retail order confirmation
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  const subjectName = String(booking?.fullName || "Customer").trim().slice(0, 80);
  await sendEmail({
    to: recipients.join(", "),
    subject: `[Studio Salon] Confirmed · #${ref} · ${subjectName}`,
    html,
  });
}

/** Fire customer confirmation + admin alert (each with its own error handling). */
export function scheduleBookingConfirmedEmails(booking) {
  void sendBookingConfirmationEmail(booking).catch((err) =>
    console.error("Booking confirmation email failed:", err),
  );
  void sendBookingAdminNotificationEmail(booking).catch((err) =>
    console.error("Booking admin notification email failed:", err),
  );
}
