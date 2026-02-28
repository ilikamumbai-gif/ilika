import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();

  const order = getOrderById(id);

  if (!order) {
    return (
      <AdminLayout>
        <p className="text-gray-500">Order not found</p>
      </AdminLayout>
    );
  }

  const downloadInvoice = () => {

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Ilika - Invoice", 14, 20);

    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 30);
    doc.text(`Customer: ${order.shippingAddress?.name}`, 14, 36);
    doc.text(`Email: ${order.userEmail}`, 14, 42);
    doc.text(
      `Address: ${order.shippingAddress?.line}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}`,
      14,
      48
    );

    // Table Data
    const tableData = order.items.map((item) => [
      item.name,
      item.quantity,
      `₹${item.price}`,
      `₹${item.quantity * item.price}`,
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["Product", "Qty", "Price", "Total"]],
      body: tableData,
    });

    // Grand Total
    doc.setFontSize(14);
    doc.text(
      `Grand Total: ₹${order.total}`,
      140,
      doc.lastAutoTable.finalY + 15
    );

    doc.save(`Invoice-${order.id.slice(-6)}.pdf`);
  };

  return (
    <AdminLayout>

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-xl font-semibold">
            Order #{order.id.slice(-6)}
          </h1>
        </div>

        {/* DOWNLOAD BUTTON */}
        <button
          onClick={downloadInvoice}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:opacity-90"
        >
          Download Invoice
        </button>

      </div>

      {/* Shipping Address */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Shipping Address</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">
            {order.shippingAddress?.name || "Customer"}
          </p>
          <p>{order.shippingAddress?.line}</p>
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
          <p className="mt-2">
            <span className="text-gray-500">Phone:</span>{" "}
            {order.shippingAddress?.phone}
          </p>
          <p className="text-gray-500">{order.userEmail}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <h2 className="px-4 py-3 border-b font-semibold">Order Items</h2>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b last:border-none">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">₹{item.price}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ₹{item.quantity * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <div className="bg-white border rounded-xl p-4 w-full sm:w-64">
          <p className="text-sm text-gray-500">Grand Total</p>
          <p className="text-xl font-bold">₹{order.total}</p>
        </div>
      </div>

    </AdminLayout>
  );
};

export default OrderDetail;
