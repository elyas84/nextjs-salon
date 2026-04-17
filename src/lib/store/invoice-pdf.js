// Use pdfkit's standalone bundle to avoid filesystem font lookups in bundled runtimes.
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import fs from "node:fs/promises";
import path from "node:path";
import { formatCurrency } from "@/lib/store/cart";

const safeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const formatDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getSellerProfile = () => ({
  name: process.env.INVOICE_SELLER_NAME || "eComElectronicStore",
  address: process.env.INVOICE_SELLER_ADDRESS || "",
  vatId: process.env.INVOICE_SELLER_VAT_ID || "",
  email: process.env.INVOICE_SELLER_EMAIL || process.env.SMTP_FROM || "",
  registration: process.env.INVOICE_SELLER_REGISTRATION || "",
});

const bufferFromPdf = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

const getInvoiceLogoBuffer = async () => {
  const filename =
    String(process.env.INVOICE_LOGO_FILE || "").trim() ||
    String(process.env.EMAIL_LOGO_FILE || "").trim() ||
    "logo.png";
  const logoPath = path.join(process.cwd(), "public", filename);

  try {
    return await fs.readFile(logoPath);
  } catch {
    return null;
  }
};

export async function renderVatInvoicePdfBuffer(order) {
  const seller = getSellerProfile();
  const invoiceNumber = safeText(order?.orderNumber || "INVOICE");
  const invoiceDate = formatDate(order?.createdAt || new Date());
  const currency = String(process.env.INVOICE_CURRENCY || "USD").toUpperCase();
  const paymentProvider = safeText(order?.paymentProvider || "");
  const paymentMethod = safeText(order?.paymentMethod || "");
  const paymentStatus = safeText(order?.paymentStatus || "");
  const paymentReference = safeText(order?.paymentReference || "");
  const dueDaysRaw = Number(process.env.INVOICE_DUE_DAYS || "14");
  const dueDays = Number.isFinite(dueDaysRaw) ? Math.max(0, Math.floor(dueDaysRaw)) : 14;
  const isPaid = paymentStatus.toLowerCase() === "paid";
  const paymentDate = isPaid
    ? formatDate(order?.updatedAt || order?.createdAt || new Date())
    : "";
  const dueDate = !isPaid && dueDays > 0
    ? formatDate(new Date((order?.createdAt ? new Date(order.createdAt).getTime() : Date.now()) + dueDays * 24 * 60 * 60 * 1000))
    : "";

  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Invoice ${invoiceNumber}`,
      Author: seller.name,
    },
  });

  // Header
  const logo = await getInvoiceLogoBuffer();
  if (logo) {
    const maxW = 120;
    const maxH = 42;
    const x =
      doc.page.width - doc.page.margins.right - maxW;
    const y = doc.page.margins.top - 6;

    try {
      doc.image(logo, x, y, { fit: [maxW, maxH], align: "right" });
    } catch {
      // Ignore logo rendering errors (unsupported format, corrupt file, etc.)
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#0f172a")
    .text("VAT Invoice", { align: "left" });

  doc.moveDown(0.4);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#475569")
    .text(`Invoice: ${invoiceNumber}`)
    .text(`Date: ${invoiceDate}`)
    .text(`Currency: ${currency}`)
    .text(
      [
        paymentProvider ? `Provider: ${paymentProvider}` : "",
        paymentMethod ? `Method: ${paymentMethod}` : "",
        paymentStatus ? `Status: ${paymentStatus}` : "",
      ]
        .filter(Boolean)
        .join(" • "),
    )
    .text(paymentReference ? `Reference: ${paymentReference}` : "")
    .text(paymentDate ? `Paid: ${paymentDate}` : "")
    .text(dueDate ? `Due: ${dueDate}` : "");

  doc.moveDown(1.2);

  // Seller / Customer blocks
  const leftX = doc.page.margins.left;
  const topY = doc.y;
  const colGap = 24;
  const colW =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right - colGap) /
    2;

  const drawBlock = (title, lines, x, y) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#0f172a")
      .text(title, x, y, { width: colW });
    doc.moveDown(0.35);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#334155")
      .text(lines.filter(Boolean).join("\n"), x, doc.y, { width: colW });
  };

  drawBlock(
    "Seller",
    [
      safeText(seller.name),
      safeText(seller.address),
      seller.vatId ? `VAT ID: ${safeText(seller.vatId)}` : "",
      seller.registration ? `Reg: ${safeText(seller.registration)}` : "",
      seller.email ? safeText(seller.email) : "",
    ],
    leftX,
    topY,
  );

  const customer = order?.shippingAddress || {};
  drawBlock(
    "Billing / shipping",
    [
      safeText(customer.fullName || order?.customerName),
      safeText(customer.address),
      [safeText(customer.postalCode), safeText(customer.city)]
        .filter(Boolean)
        .join(" "),
      safeText(customer.email || order?.customerEmail),
      safeText(customer.phone || order?.customerPhone),
    ],
    leftX + colW + colGap,
    topY,
  );

  doc.moveDown(4.2);

  // Items table
  const tableX = leftX;
  const tableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const baseRowH = 18;
  const cellPadY = 5;
  const cellPadX = 6;
  const colNameW = Math.floor(tableW * 0.46);
  const colSkuW = Math.floor(tableW * 0.16);
  const colQtyW = Math.floor(tableW * 0.1);
  const colUnitW = Math.floor(tableW * 0.18);
  const colLineW = tableW - colNameW - colSkuW - colQtyW - colUnitW;

  const drawTableRule = (y) => {
    doc
      .lineWidth(1)
      .strokeColor("#e2e8f0")
      .moveTo(tableX, y)
      .lineTo(tableX + tableW, y)
      .stroke();
  };

  const getRowHeight = (values, header = false) => {
    const itemText = safeText(values[0]);
    const skuText = safeText(values[1]);

    // Header is a single-line row.
    if (header) return baseRowH;

    // Measure with intended fonts/sizes.
    doc.font("Helvetica").fontSize(10);
    const nameH = doc.heightOfString(itemText, {
      width: colNameW - cellPadX * 2,
      lineGap: 1,
    });

    doc.font("Helvetica").fontSize(8);
    const skuH = doc.heightOfString(skuText, {
      width: colSkuW - cellPadX * 2,
      lineGap: 1,
    });

    const contentH = Math.max(nameH, skuH, 10);
    return Math.max(baseRowH, Math.ceil(contentH + cellPadY * 2));
  };

  const drawRow = (y, values, header = false) => {
    const rowH = getRowHeight(values, header);

    // bottom border
    drawTableRule(y + rowH);

    doc
      .font(header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor(header ? "#0f172a" : "#334155");

    const textY = y + cellPadY;
    const nameX = tableX;
    const skuX = tableX + colNameW;
    const qtyX = tableX + colNameW + colSkuW;
    const unitX = tableX + colNameW + colSkuW + colQtyW;
    const lineX = tableX + colNameW + colSkuW + colQtyW + colUnitW;

    // Item (wrap)
    doc
      .font(header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .text(safeText(values[0]), nameX + cellPadX, textY, {
        width: colNameW - cellPadX * 2,
        lineGap: 1,
      });

    // SKU (wrap, smaller)
    doc
      .font(header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(header ? 10 : 8)
      .fillColor(header ? "#0f172a" : "#475569")
      .text(safeText(values[1]), skuX + cellPadX, textY + (header ? 0 : 1), {
        width: colSkuW - cellPadX * 2,
        lineGap: 1,
      });

    // Qty / Unit / Line total (single line, right aligned, vertically aligned to top)
    doc
      .font(header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor(header ? "#0f172a" : "#334155");

    doc.text(safeText(values[2]), qtyX, textY, {
      width: colQtyW,
      align: "right",
    });
    doc.text(safeText(values[3]), unitX, textY, {
      width: colUnitW,
      align: "right",
    });
    doc.text(safeText(values[4]), lineX, textY, {
      width: colLineW,
      align: "right",
    });

    return y + rowH;
  };

  let y = doc.y;
  drawTableRule(y);

  y = drawRow(y, ["Item", "SKU", "Qty", "Unit", "Line total"], true);

  const items = Array.isArray(order?.items) ? order.items : [];
  for (const item of items) {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.price || 0);
    const line = qty * unit;
    const rowValues = [
      safeText(item.name),
      safeText(item.slug || ""),
      String(qty),
      formatCurrency(unit),
      formatCurrency(line),
    ];

    const nextY = y + getRowHeight(rowValues, false);
    if (nextY > doc.page.height - doc.page.margins.bottom - 160) {
      doc.addPage();
      y = doc.page.margins.top;
      drawTableRule(y);
      y = drawRow(y, ["Item", "SKU", "Qty", "Unit", "Line total"], true);
    }
    y = drawRow(y, rowValues, false);
  }

  doc.y = y + 18;

  // Totals
  const subtotal = Number(order?.totals?.subtotal || 0);
  const shipping = Number(order?.totals?.shipping || 0);
  const tax = Number(order?.totals?.tax || 0);
  const total = Number(order?.totals?.total || 0);
  const vatRate =
    subtotal > 0 && tax > 0 ? Math.round((tax / subtotal) * 1000) / 10 : null;

  const totalsX = tableX + Math.floor(tableW * 0.55);
  const totalsW = tableW - (totalsX - tableX);
  const drawTotalLine = (label, value, strong = false) => {
    doc
      .font(strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(strong ? 11 : 10)
      .fillColor("#0f172a")
      .text(label, totalsX, doc.y, { width: totalsW * 0.6 });
    doc
      .font(strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(strong ? 11 : 10)
      .fillColor("#0f172a")
      .text(value, totalsX, doc.y, { width: totalsW, align: "right" });
    doc.moveDown(0.35);
  };

  drawTotalLine("Subtotal (net)", formatCurrency(subtotal));
  drawTotalLine("Shipping", formatCurrency(shipping));
  drawTotalLine(
    vatRate != null ? `VAT (${vatRate}%)` : "VAT",
    formatCurrency(tax),
  );
  doc.moveDown(0.15);
  doc
    .lineWidth(1)
    .strokeColor("#e2e8f0")
    .moveTo(totalsX, doc.y)
    .lineTo(totalsX + totalsW, doc.y)
    .stroke();
  doc.moveDown(0.35);
  drawTotalLine("Total (gross)", formatCurrency(total), true);

  doc.moveDown(1);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text(
      [
        "This invoice is generated automatically from your order details.",
        seller.vatId ? `Seller VAT ID: ${safeText(seller.vatId)}` : "",
        paymentReference ? `Payment reference: ${paymentReference}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      leftX,
      doc.y,
      { width: tableW },
    );

  return await bufferFromPdf(doc);
}

