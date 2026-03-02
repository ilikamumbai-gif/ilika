import React from "react";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TopCustomers = () => {

  const { orders } = useOrders();

  const customers = {};

  orders.forEach(o => {

    const key = o.userEmail || "Guest";

    if (!customers[key]) customers[key] = 0;

    customers[key] += o.total;

  });

  const sorted = Object.entries(customers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);


  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.text("Top Customers Report", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Customer", "Total Spent"]],
      body: sorted.map(([name, total]) => [
        name,
        `₹${total}`
      ]),
    });

    doc.save("top-customers.pdf");

  };


  return (

    <div className="bg-white border rounded-xl p-4">

      <div className="flex justify-between mb-4">

        <h2 className="font-semibold">
          Top Customers
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
            <th className="px-4 py-3 text-left">
              Customer
            </th>

            <th className="px-4 py-3 text-right">
              Total Spent
            </th>
          </tr>

        </thead>

        <tbody>

          {sorted.map(([name, total], i) => (

            <tr key={i} className="border-t">

              <td className="px-4 py-3">
                {name}
              </td>

              <td className="px-4 py-3 text-right font-medium">
                ₹{total}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
};

export default TopCustomers;