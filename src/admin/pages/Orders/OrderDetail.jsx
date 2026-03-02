import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useOrders } from "../../context/OrderContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logActivity } from "../../Utils/logActivity";

const OrderDetail = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();

  const order = getOrderById(id);

  if (!order) {
    return (
      <AdminLayout>
        Order not found
      </AdminLayout>
    );
  }

  /* ================= PDF ================= */

  const downloadInvoice = () => {

    const doc = new jsPDF();

    doc.text("Invoice", 10, 10);

    autoTable(doc, {
      head: [["Name", "Qty", "Price"]],
      body: order.items.map(i => [
        i.name,
        i.quantity,
        i.price
      ]),
    });

    doc.save("invoice.pdf");

    logActivity(
      `Downloaded invoice ${order.id}`
    );

  };

  /* ================= PRINT ================= */

  const printOrder = () => {

    window.print();

    logActivity(
      `Printed order ${order.id}`
    );

  };

  return (

    <AdminLayout>

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div className="flex gap-3 items-center">

          <button
            onClick={() => navigate(-1)}
            className="border p-2 rounded"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-xl font-semibold">
            Order #{order.id.slice(-6)}
          </h1>

        </div>


        <div className="flex gap-2">

          <button
            onClick={printOrder}
            className="flex gap-2 items-center px-3 py-2 border rounded"
          >
            <Printer size={16} />
            Print
          </button>

          <button
            onClick={downloadInvoice}
            className="flex gap-2 items-center px-3 py-2 bg-black text-white rounded"
          >
            <Download size={16} />
            PDF
          </button>

        </div>

      </div>


      {/* ADDRESS */}

      <div className="bg-white border rounded-xl p-4 mb-6">

        <h2 className="font-semibold mb-2">
          Shipping Address
        </h2>

        <p>{order.shippingAddress?.name}</p>
        <p>{order.shippingAddress?.line}</p>
        <p>
          {order.shippingAddress?.city} ,
          {order.shippingAddress?.state}
        </p>

        <p>{order.shippingAddress?.phone}</p>
        <p>{order.userEmail}</p>

      </div>


      {/* ITEMS */}

      <div className="bg-white border rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-4 py-3 text-left">
                Image
              </th>

              <th className="px-4 py-3 text-left">
                Product
              </th>

              <th className="px-4 py-3 text-center">
                Qty
              </th>

              <th className="px-4 py-3 text-right">
                Price
              </th>

              <th className="px-4 py-3 text-right">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {order.items.map((item, i) => (

              <React.Fragment key={i}>

                <tr className="border-t">

                  {/* IMAGE */}

                  <td className="px-4 py-3">

                    <img
                      src={item.image}
                      className="w-12 h-12 object-cover rounded"
                    />

                  </td>


                  {/* NAME */}

                  <td className="px-4 py-3">

                    {item.name}

                    {/* COMBO ITEMS */}

                    {item.isCombo &&
                      item.comboItems?.length > 0 && (

                        <div className="text-xs text-gray-500 mt-1">

                          Combo:

                          {item.comboItems.map((c, j) => (
                            <div key={j}>
                              • {c.name}
                            </div>
                          ))}

                        </div>

                      )}

                  </td>


                  <td className="px-4 py-3 text-center">
                    {item.quantity}
                  </td>


                  <td className="px-4 py-3 text-right">
                    ₹{item.price}
                  </td>


                  <td className="px-4 py-3 text-right font-medium">
                    ₹{item.price * item.quantity}
                  </td>

                </tr>

              </React.Fragment>

            ))}

          </tbody>

        </table>

      </div>


      {/* TOTAL */}

      <div className="flex justify-end mt-4">

        <div className="bg-white border rounded-xl p-4 w-64">

          <p className="text-sm text-gray-500">
            Grand Total
          </p>

          <p className="text-xl font-bold">
            ₹{order.total}
          </p>

        </div>

      </div>

    </AdminLayout>

  );

};

export default OrderDetail;