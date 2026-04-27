import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Printer, Download, Package, User,
  MapPin, CreditCard, ShoppingBag, Clock, Tag,
  CheckCircle, XCircle, Truck, AlertCircle, Globe
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logActivity } from "../../Utils/logActivity";
import { normalizeSource } from "../../Utils/trafficSource";

/* ─────────────────── HELPERS ─────────────────── */

const formatDateTime = (timestamp) => {
  if (!timestamp) return "—";
  const date = timestamp?._seconds
    ? new Date(timestamp._seconds * 1000)
    : new Date(timestamp);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const getImage = (item) =>
  item?.image || item?.images?.[0] || item?.imageUrl || "/placeholder.webp";

/* ─────────────────── STATUS / SOURCE CONFIG ─────────────────── */

const STATUS_CONFIG = {
  Placed:    { color: "bg-blue-100 text-blue-700 border-blue-300",      icon: <Package size={13} />,     label: "Placed" },
  Shipped:   { color: "bg-purple-100 text-purple-700 border-purple-300", icon: <Truck size={13} />,      label: "Shipped" },
  Delivered: { color: "bg-green-100 text-green-700 border-green-300",   icon: <CheckCircle size={13} />, label: "Delivered" },
  Cancelled: { color: "bg-red-100 text-red-700 border-red-300",         icon: <XCircle size={13} />,     label: "Cancelled" },
};

const SOURCE_STYLES = {
  "Facebook":   "bg-blue-600",
  "FB Ads":     "bg-blue-800",
  "Instagram":  "bg-pink-500",
  "Insta Ads":  "bg-pink-700",
  "Google":     "bg-yellow-500",
  "Google Ads": "bg-yellow-700",
  "Website":    "bg-gray-500",
};

/* ─────────────────── REUSABLE BITS ─────────────────── */

const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
      <span className="text-gray-500">{icon}</span>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-4">
    <span className="text-xs text-gray-400 shrink-0 w-32">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right break-all">{value ?? "—"}</span>
  </div>
);

/* ─────────────────── MAIN COMPONENT ─────────────────── */

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus } = useOrders();
  const order = getOrderById(id);
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
          <AlertCircle size={40} />
          <p className="text-lg font-medium">Order not found</p>
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 underline">← Go back</button>
        </div>
      </AdminLayout>
    );
  }

  const total      = order.totalAmount || order.total || 0;
  const statusCfg  = STATUS_CONFIG[order.status] || STATUS_CONFIG.Placed;
  const srcDisplay = normalizeSource(order.source);
  const srcColor   = SOURCE_STYLES[srcDisplay] || SOURCE_STYLES.Website;
  const isPaid     = order.paymentStatus === "Paid";
  const itemCount  = order.items?.length || 0;
  const addr       = order.shippingAddress || {};

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    await updateOrderStatus(order.id, newStatus);
    await logActivity(`Updated order #${order.id.slice(-6)} status → ${newStatus}`);
    setStatusUpdating(false);
  };

  /* ─── PDF ─── */
  const downloadInvoice = async () => {
    const doc          = new jsPDF();
    const margin       = 14;
    const pageWidth    = doc.internal.pageSize.getWidth();
    const pageHeight   = doc.internal.pageSize.getHeight();
    const footerHeight = 16;

    const date = new Date(order.createdAt?._seconds * 1000 || order.createdAt);
    const invoiceNumber =
      "INV-" +
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      "-" +
      order.id.slice(-4).toUpperCase();

    const formatPrice = (v) =>
      `Rs. ${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    /* ── draw footer on current page ── */
    const drawFooter = () => {
      doc.setFillColor(241, 241, 250);
      doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");
      doc.setFillColor(99, 102, 241);
      doc.rect(0, pageHeight - footerHeight, pageWidth, 1.5, "F");
      doc.setFontSize(7.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(80, 80, 120);
      doc.text(
        "Thank you for shopping with ILIKA  |  www.ilika.in  |  ilika.official4vs@gmail.com",
        pageWidth / 2,
        pageHeight - 7,
        { align: "center" }
      );
    };

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/Images/logo2.webp";

    logo.onload = () => {

      /* ── PAGE 1 HEADER ── */
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 34, pageWidth, 2, "F");
      doc.setFillColor(248, 248, 250);
      doc.rect(0, 36, pageWidth, 1, "F");

      /* logo */
      const logoCanvas = document.createElement("canvas");
      logoCanvas.width  = logo.naturalWidth  || logo.width;
      logoCanvas.height = logo.naturalHeight || logo.height;
      const logoCtx = logoCanvas.getContext("2d");
      if (logoCtx) {
        logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
        logoCtx.drawImage(logo, 0, 0);
        doc.addImage(logoCanvas.toDataURL("image/png"), "PNG", margin, 6, 34, 12.5);
      }

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(22);
      doc.setFont(undefined, "bold");
      doc.text("TAX INVOICE", pageWidth - margin, 16, { align: "right" });

      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("PTCGRAM PRIVATE LIMITED  |  www.ilika.in", pageWidth - margin, 24, { align: "right" });

      /* ── INVOICE META (left column) ── */
      let y = 47;
      doc.setFontSize(8);
      const metaLeft = [
        ["Invoice No",     invoiceNumber],
        ["Invoice Date",   date.toLocaleDateString("en-IN")],
        ["Order ID",       order.id],
        ["Payment Method", order.paymentMethod === "ONLINE" ? "Online (Razorpay)" : "Cash on Delivery"],
        ["Payment Status", order.paymentStatus],
      ];
      metaLeft.forEach(([label, val]) => {
        doc.setFont(undefined, "normal");
        doc.setTextColor(130, 130, 130);
        doc.text(label + ":", margin, y);
        doc.setFont(undefined, "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(String(val), margin + 34, y);
        y += 6;
      });

      /* ── ADDRESS BOXES (right half) ── */
      const boxTop = 44;
      const boxMid = pageWidth / 2 + 4;
      const boxW   = pageWidth - boxMid - margin;

      /* ── SOLD BY box — height calculated from content ── */
      const soldByLines = [
        "Office No. 201-202, Hirubai Residency",
        "Virar (West) - 401303, Maharashtra, India",
        "+91 91208 79879",
        "GSTIN: 27AALCP9913F1Z2",
        "ilika.official4vs@gmail.com",
      ];
      // label row (5.2) + company name (4.8) + lines + top padding (8) + bottom padding (5)
      const soldByHeight = 8 + 5.2 + 4.8 + soldByLines.length * 4.2 + 5;

      doc.setDrawColor(220, 220, 230);
      doc.setFillColor(250, 250, 253);
      doc.roundedRect(boxMid, boxTop, boxW, soldByHeight, 3, 3, "FD");

      let bY = boxTop + 8;
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.setTextColor(99, 102, 241);
      doc.text("SOLD BY", boxMid + 5, bY); bY += 5.2;

      doc.setFont(undefined, "bold");
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text("PTCGRAM PRIVATE LIMITED", boxMid + 5, bY); bY += 4.8;

      doc.setFont(undefined, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      soldByLines.forEach((line) => { doc.text(line, boxMid + 5, bY); bY += 4.2; });

      /* ── SHIP TO box — fully dynamic height + word-wrap ── */
      const shipTop = boxTop + soldByHeight + 4;  // ← defined HERE, after soldByHeight

      // set font before splitTextToSize so measurements are accurate
      doc.setFontSize(7.5);
      const rawShipLines = [
        addr.addressLine || addr.line || "",
        `${addr.city || ""}, ${addr.state || ""} ${addr.pincode || ""}`.trim(),
        addr.phone ? `Phone: ${addr.phone}` : "",
      ].filter(Boolean);

      // pre-wrap all lines so we can calculate the exact box height
      const wrappedShipLines = rawShipLines.flatMap(
        (line) => doc.splitTextToSize(line, boxW - 10)
      );

      // label row (5.2) + name row (4.8) + wrapped lines + top padding (8) + bottom padding (5)
      const shipHeight = 8 + 5.2 + 4.8 + wrappedShipLines.length * 4.2 + 5;

      doc.setDrawColor(220, 220, 230);
      doc.setFillColor(250, 250, 253);
      doc.roundedRect(boxMid, shipTop, boxW, shipHeight, 3, 3, "FD");

      let sY = shipTop + 8;
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.setTextColor(99, 102, 241);
      doc.text("SHIP TO", boxMid + 5, sY); sY += 5.2;

      doc.setFont(undefined, "bold");
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text(addr.name || "", boxMid + 5, sY); sY += 4.8;

      doc.setFont(undefined, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      wrappedShipLines.forEach((line) => { doc.text(line, boxMid + 5, sY); sY += 4.2; });

      /* ── ORDER ITEMS SECTION LABEL ── */
      const tableStartY = Math.max(shipTop + shipHeight + 10, 130);

      doc.setFillColor(241, 241, 248);
      doc.rect(margin, tableStartY - 7, pageWidth - margin * 2, 7, "F");
      doc.setFontSize(7.5);
      doc.setFont(undefined, "bold");
      doc.setTextColor(99, 102, 241);
      doc.text("ORDER ITEMS", margin + 3, tableStartY - 1.5);

      /* ── PRODUCT TABLE (auto multi-page) ── */
      autoTable(doc, {
        startY: tableStartY,
        margin: { left: margin, right: margin },
        pageBreak: "auto",
        rowPageBreak: "auto",
        showHead: "everyPage",
        head: [["#", "Product", "HSN", "Qty", "Unit Price", "Discount", "Taxable Value", "IGST", "Total"]],
        body: order.items.map((item, i) => {
          const qty       = item.quantity || 1;
          const price     = item.price    || 0;
          const itemTotal = qty * price;
          return [
            i + 1,
            item.name,
            item.hsn || "85163200",
            qty,
            formatPrice(price),
            item.discountApplied ? `${item.discountApplied}%` : "—",
            formatPrice(itemTotal),
            "0%",
            formatPrice(itemTotal),
          ];
        }),
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
          textColor: [40, 40, 40],
          lineColor: [220, 220, 230],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [241, 241, 248],
          textColor: [60, 60, 100],
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          lineColor: [200, 200, 220],
          lineWidth: 0.4,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 50 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "center", cellWidth: 10 },
          4: { halign: "right",  cellWidth: 22 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "right",  cellWidth: 24 },
          7: { halign: "center", cellWidth: 12 },
          8: { halign: "right",  cellWidth: 22 },
        },
        alternateRowStyles: { fillColor: [248, 248, 252] },
        didDrawPage: () => { drawFooter(); },
      });

      /* ── TOTALS BLOCK ── */
      const lastFinalY     = doc.lastAutoTable.finalY;
      const remainingSpace = pageHeight - footerHeight - lastFinalY;
      if (remainingSpace < 72) {
        doc.addPage();
        drawFooter();
      }

      const finalY  = doc.lastAutoTable.finalY + 8;
      const totalsX = pageWidth - margin - 80;

      doc.setDrawColor(220, 220, 230);
      doc.setFillColor(250, 250, 253);
      doc.roundedRect(totalsX, finalY, 80, 34, 3, 3, "FD");

      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(110, 110, 110);
      doc.text("Subtotal", totalsX + 5, finalY + 10);
      doc.text("Shipping", totalsX + 5, finalY + 19);

      doc.setFont(undefined, "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(formatPrice(total), totalsX + 75, finalY + 10, { align: "right" });
      doc.setTextColor(22, 163, 74);
      doc.text("FREE", totalsX + 75, finalY + 19, { align: "right" });

      doc.setDrawColor(210, 210, 225);
      doc.line(totalsX + 4, finalY + 23, totalsX + 76, finalY + 23);

      doc.setFillColor(238, 238, 255);
      doc.roundedRect(totalsX + 1, finalY + 25, 78, 8, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(60, 60, 180);
      doc.text("GRAND TOTAL", totalsX + 5, finalY + 31);
      doc.text(formatPrice(total), totalsX + 75, finalY + 31, { align: "right" });

      /* ── REVERSE CHARGE NOTE + SIGNATURE ── */
      const footerTopY       = pageHeight - footerHeight;
      let noteY              = finalY + 46;
      const signatureBottomY = noteY + 29;
      if (signatureBottomY > footerTopY - 4) {
        noteY -= signatureBottomY - (footerTopY - 4);
      }

      doc.setFontSize(7.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("* Tax payable under reverse charge: No", margin, noteY);

      const sigX = pageWidth - margin - 62;
      doc.setDrawColor(180, 180, 200);
      doc.line(sigX, noteY + 18, pageWidth - margin, noteY + 18);
      doc.setFontSize(7.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(120, 120, 120);
      doc.text("Authorized Signatory", sigX, noteY + 23);
      doc.setFont(undefined, "bold");
      doc.setTextColor(40, 40, 40);
      doc.text("PTCGRAM PRIVATE LIMITED", sigX, noteY + 29);

      doc.save(`invoice_${invoiceNumber}.pdf`);
    };

    await logActivity(`Downloaded invoice for order #${order.id.slice(-6)}`);
  };

  const printOrder = async () => {
    window.print();
    await logActivity(`Printed order #${order.id.slice(-6)}`);
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <AdminLayout>

      {/* ══ TOP BAR ══ */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-10)}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-white rounded-full ${srcColor}`}>
                <Globe size={11} /> {srcDisplay}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full ${isPaid ? "bg-green-100 text-green-700 border-green-300" : "bg-orange-100 text-orange-700 border-orange-300"}`}>
                {isPaid ? <CheckCircle size={11} /> : <AlertCircle size={11} />} {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={11} /> Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={order.status}
            disabled={statusUpdating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          >
            <option>Placed</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <button
            onClick={printOrder}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={downloadInvoice}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Download size={15} /> PDF Invoice
          </button>
        </div>
      </div>

      {/* ══ STAT PILLS ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Order Total", value: `₹${total.toLocaleString("en-IN")}`,                                  bg: "bg-green-50",                            border: "border-green-200",                            text: "text-green-800" },
          { label: "Total Items", value: `${itemCount} item${itemCount !== 1 ? "s" : ""}`,                      bg: "bg-blue-50",                             border: "border-blue-200",                             text: "text-blue-800" },
          { label: "Payment",     value: order.paymentStatus,                                                    bg: isPaid ? "bg-emerald-50" : "bg-orange-50", border: isPaid ? "border-emerald-200" : "border-orange-200", text: isPaid ? "text-emerald-800" : "text-orange-800" },
          { label: "Method",      value: order.paymentMethod === "ONLINE" ? "Online Pay" : "Cash on Delivery",  bg: "bg-gray-50",                             border: "border-gray-200",                             text: "text-gray-800" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl px-4 py-3`}>
            <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
            <p className={`text-sm font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ══ INFO GRID ══ */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">

        <SectionCard icon={<User size={15} />} title="Customer Info">
          <InfoRow label="Full Name" value={addr.name || order.shippingAddress?.name} />
          <InfoRow label="Email"     value={order.userEmail} />
          <InfoRow label="Phone"     value={addr.phone} />
          <InfoRow label="User ID"   value={order.userId ? `…${order.userId.slice(-12)}` : "—"} />
        </SectionCard>

        <SectionCard icon={<MapPin size={15} />} title="Shipping Address">
          <InfoRow label="Name"    value={addr.name} />
          <InfoRow label="Address" value={addr.addressLine || addr.line} />
          <InfoRow label="City"    value={addr.city} />
          <InfoRow label="State"   value={addr.state} />
          <InfoRow label="Pincode" value={addr.pincode} />
          <InfoRow label="Phone"   value={addr.phone} />
        </SectionCard>

        <SectionCard icon={<CreditCard size={15} />} title="Payment & Source">
          <InfoRow label="Status" value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
              {order.paymentStatus}
            </span>
          } />
          <InfoRow label="Method" value={order.paymentMethod === "ONLINE" ? "Online (Razorpay)" : "Cash on Delivery"} />
          {order.razorpay_payment_id && (
            <InfoRow label="Payment ID" value={order.razorpay_payment_id} />
          )}
          <InfoRow label="Source" value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${srcColor}`}>
              {srcDisplay}
            </span>
          } />
          <InfoRow label="Ordered At" value={formatDateTime(order.createdAt)} />
          {order.paidAt && <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />}
        </SectionCard>
      </div>

      {/* ══ ORDER ITEMS ══ */}
      <SectionCard icon={<ShoppingBag size={15} />} title={`Order Items — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left   text-xs text-gray-400 font-semibold uppercase tracking-wide w-8">#</th>
                <th className="pb-3 text-left   text-xs text-gray-400 font-semibold uppercase tracking-wide">Product</th>
                <th className="pb-3 text-center text-xs text-gray-400 font-semibold uppercase tracking-wide">Qty</th>
                <th className="pb-3 text-right  text-xs text-gray-400 font-semibold uppercase tracking-wide">Unit Price</th>
                <th className="pb-3 text-right  text-xs text-gray-400 font-semibold uppercase tracking-wide">Discount</th>
                <th className="pb-3 text-right  text-xs text-gray-400 font-semibold uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item, i) => {
                const comboList = item.comboItems || item.items || [];
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <img loading="lazy"
                          src={getImage(item)}
                          alt={item.name}
                          onError={(e) => { e.target.src = "/placeholder.webp"; }}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 leading-snug">{item.name}</p>
                          {item.variantLabel && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              <Tag size={10} /> {item.variantLabel}
                            </span>
                          )}
                          {item.isCombo && comboList.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-400 font-medium">Includes:</p>
                              {comboList.map((c, j) => (
                                <div key={j} className="flex items-center gap-1.5">
                                  <img loading="lazy"
                                    src={c.image || c.images?.[0] || "/placeholder.webp"}
                                    className="w-5 h-5 rounded object-cover border border-gray-200"
                                  />
                                  <span className="text-xs text-gray-500">{c.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-block min-w-[28px] bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        ×{item.quantity}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <p className="font-medium text-gray-800">₹{item.price?.toLocaleString("en-IN")}</p>
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <p className="text-xs text-gray-400 line-through">₹{item.originalPrice}</p>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {item.discountApplied ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          -{item.discountApplied}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 pt-4 border-t border-gray-200 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>Grand Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-400">Payment Status</span>
              <span className={`font-bold ${isPaid ? "text-green-600" : "text-orange-500"}`}>
                {order.paymentStatus} {isPaid && "✓"}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="h-10" />
    </AdminLayout>
  );
};

export default OrderDetail;