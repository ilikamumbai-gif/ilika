import React from "react";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TransferHistory = () => {

  const { orders } = useOrders();

  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.text("Orders Report", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Order", "Date", "Status", "Amount"]],
      body: orders.map(o => [
        o.id,
        o.date,
        o.status,
        `₹${o.total}`
      ]),
    });

    doc.save("orders.pdf");

  };

  return (

    <div className="bg-white border rounded-xl p-4">

      <div className="flex justify-between mb-4">

        <h2 className="font-semibold">
          Transfer History
        </h2>

        <button
          onClick={downloadPDF}
          className="px-3 py-1 bg-black text-white rounded"
        >
          Download PDF
        </button>

      </div>

      <table className="w-full text-sm">

        <thead className="bg-gray-50">

          <tr>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>

        </thead>

        <tbody>

          {orders.map(o => (

            <tr key={o.id} className="border-t">

              <td className="px-4 py-3">
                #{o.id}
              </td>

              <td className="px-4 py-3">
                {o.date}
              </td>

              <td className="px-4 py-3">

                <span className={`px-2 py-1 text-xs rounded
                  ${
                    o.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {o.status}
                </span>

              </td>

              <td className="px-4 py-3 text-right font-medium">
                ₹{o.total}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

};

export default TransferHistory;