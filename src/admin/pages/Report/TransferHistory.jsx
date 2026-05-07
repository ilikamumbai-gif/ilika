import React, { useMemo, useState } from "react";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { normalizeSource } from "../../Utils/trafficSource";

const TransferHistory = () => {
  const { orders } = useOrders();
  const [sourceFilter, setSourceFilter] = useState("");

  const sourceOptions = useMemo(() => {
    const set = new Set(
      orders.map((o) => normalizeSource(o.source)).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!sourceFilter) return orders;
    return orders.filter((o) => normalizeSource(o.source) === sourceFilter);
  }, [orders, sourceFilter]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = sourceFilter
      ? `Orders Report (${sourceFilter})`
      : "Orders Report (All Sources)";
    const totalAmount = filteredOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );

    doc.text(title, 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Order", "Date", "Source", "Status", "Amount"]],
      body: filteredOrders.map((o) => [
        o.id,
        o.date,
        normalizeSource(o.source),
        o.status,
        `Rs ${o.total}`,
      ]),
    });

    const tableEndY = doc.lastAutoTable?.finalY || 20;
    doc.setFontSize(12);
    doc.text(`Total Amount: Rs ${totalAmount.toFixed(2)}`, 14, tableEndY + 10);

    doc.save("orders.pdf");
  };

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Transfer History</h2>

        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 border rounded text-sm bg-white"
          >
            <option value="">All Sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <button
            onClick={downloadPDF}
            className="px-3 py-1 bg-black text-white rounded"
          >
            Download PDF
          </button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="px-4 py-3">#{o.id}</td>
              <td className="px-4 py-3">{o.date}</td>
              <td className="px-4 py-3">{normalizeSource(o.source)}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    o.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {o.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium">Rs {o.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransferHistory;
