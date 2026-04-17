// Use pdfkit's standalone bundle (same pattern as invoice-pdf).
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { bookingRefCode } from "@/lib/booking-ref";
import { formatSlotLabel } from "@/lib/booking-slots";

const safe = (value) => String(value || "").replace(/\s+/g, " ").trim();

const bufferFromPdf = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

export const bookingPdfRef = bookingRefCode;

function pdfCopyForStatus(statusRaw) {
  const s = safe(statusRaw).toLowerCase();
  if (s === "completed") {
    return {
      headline: "Appointment completed",
      docTitleSuffix: "Completed",
      footnote:
        "This visit is recorded as completed. Thank you for choosing us — we hope to see you again soon.",
    };
  }
  if (s === "cancelled") {
    return {
      headline: "Appointment cancelled",
      docTitleSuffix: "Cancelled",
      footnote:
        "This appointment has been cancelled. If you did not request this or have questions, please contact the salon as soon as possible.",
    };
  }
  return {
    headline: "Appointment confirmation",
    docTitleSuffix: "Confirmation",
    footnote:
      "Please arrive on time for your slot. If you need to reschedule, contact us as soon as possible.",
  };
}

function formatBookingDate(iso) {
  const raw = safe(iso);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function renderBookingConfirmationPdfBuffer(booking) {
  const shopName = safe(
    process.env.BOOKING_SHOP_NAME || process.env.INVOICE_SELLER_NAME || "Studio Salon",
  );
  const envFullAddress = safe(
    process.env.BOOKING_SHOP_ADDRESS || process.env.INVOICE_SELLER_ADDRESS || "",
  );
  const shopStreet =
    safe(process.env.BOOKING_SHOP_STREET) || "The King Street 10B";
  const cityLine = safe(process.env.BOOKING_SHOP_CITY_LINE);
  const shopEmail = safe(
    process.env.BOOKING_SHOP_EMAIL || process.env.INVOICE_SELLER_EMAIL || process.env.SMTP_FROM || "",
  );

  const ref = bookingPdfRef(booking);
  const status = safe(booking?.status || "pending").toUpperCase();
  const copy = pdfCopyForStatus(booking?.status);
  const created = booking?.createdAt
    ? new Date(booking.createdAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Booking ${ref} — ${copy.docTitleSuffix}`,
      Author: shopName,
    },
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#0f172a")
    .text(copy.headline, { align: "left" });

  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(10).fillColor("#475569");
  doc.text(shopName);
  if (envFullAddress) {
    for (const line of envFullAddress.split(/\r?\n/)) {
      const L = safe(line);
      if (L) doc.text(L);
    }
  } else {
    doc.text(shopStreet);
    if (cityLine) doc.text(cityLine);
  }
  if (shopEmail) doc.text(`Email: ${shopEmail}`);

  doc.moveDown(1);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0f172a")
    .text(`Reference: ${ref}`);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#475569")
    .text(`Status: ${status}`)
    .text(created ? `Requested: ${created}` : "");

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Customer");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  doc.text(`Name: ${safe(booking?.fullName)}`);
  doc.text(`Email: ${safe(booking?.email)}`);
  if (safe(booking?.phone)) doc.text(`Phone: ${safe(booking?.phone)}`);

  doc.moveDown(0.85);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Visit & service");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  doc.text(`Booking reference: ${safe(booking?.registrationNumber)}`);
  doc.text(`Service type: ${safe(booking?.serviceType)}`);

  doc.moveDown(0.85);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Schedule");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  doc.text(`Date: ${formatBookingDate(booking?.preferredDate)}`);
  const timeLabel = booking?.preferredTime
    ? formatSlotLabel(booking.preferredTime)
    : "—";
  doc.text(`Time: ${timeLabel}`);

  const notes = safe(booking?.notes);
  if (notes) {
    doc.moveDown(0.85);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Your notes");
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(notes, {
      width: doc.page.width - 96,
    });
  }

  doc.moveDown(1.25);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94a3b8")
    .text(copy.footnote, { width: doc.page.width - 96 });

  return bufferFromPdf(doc);
}
