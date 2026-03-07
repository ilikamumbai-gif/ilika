import React, { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useOrders } from "../../context/OrderContext";
import { logActivity } from "../../Utils/logActivity";

/* ================= LOG ================= */


/* ================= STYLE ================= */

const getStatusStyle = (status) => {
  switch (status) {
    case "Placed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "Shipped":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Delivered":
      return "bg-green-100 text-green-700 border-green-300";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const OrderList = () => {

  const navigate = useNavigate();

  const {
    orders,
    loading,
    updateOrderStatus,
    deleteAllOrders,
    deleteOrder,
  } = useOrders();

  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  /* ================= STATUS ================= */

  const handleStatusChange = async (id, status) => {

    await updateOrderStatus(id, status);

    await logActivity(
      `Updated order #${id.slice(-6)} status → ${status}`
    );

  };

  const normalizeSource = (src) => {

    if (!src) return "WEBSITE";

    const s = src.toLowerCase();

    if (
      s.includes("meta") ||
      s.includes("facebook") ||
      s.includes("instagram")
    )
      return "META ADS";

    if (
      s.includes("google") ||
      s.includes("gclid")
    )
      return "GOOGLE ADS";

    return "WEBSITE";
  };

  /* ================= FILTER ================= */

  const filteredOrders = orders.filter((o) => {

    const statusMatch =
      !statusFilter || o.status === statusFilter;

    const sourceMatch =
      !sourceFilter ||
      normalizeSource(o.source) === sourceFilter;

    const dateMatch =
      !dateFilter || o.date === dateFilter;

    const searchMatch =
      !search ||
      o.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress?.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

    return (
      statusMatch &&
      sourceMatch &&
      dateMatch &&
      searchMatch
    );

  });

  /* ================= TABLE ================= */

  const columns = [

    {
      label: "Order ID",
      key: "id",
      render: (row) => (
        <span>
          #{row.id.slice(-6)}
        </span>
      ),
    },

    {
      label: "Customer",
      key: "userEmail",
      render: (row) => (
        <div>
          <p>
            {row.shippingAddress?.name}
          </p>
          <p>
            {row.userEmail}
          </p>
        </div>
      ),
    },

    {
      label: "Total",
      key: "total",
      render: (row) =>
        `₹${row.total}`,
    },

    {
      label: "Source",
      key: "source",
      render: (row) => {

        const src = row.source || "WEBSITE";

        const style =
          src === "META ADS"
            ? "bg-blue-100 text-blue-700 border-blue-300"
            : src === "GOOGLE ADS"
              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
              : "bg-gray-100 text-gray-700 border-gray-300";

        return (
          <span className={`px-2 py-1 text-xs border rounded ${style}`}>
            {src}
          </span>
        );
      },
    },

    {
      label: "Status",
      key: "status",
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) =>
            handleStatusChange(
              row.id,
              e.target.value
            )
          }
          className={`border px-2 py-1 ${getStatusStyle(row.status)}`}
        >
          <option>Placed</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
      ),
    },

  ];

  return (

    <AdminLayout>

      <h1 className="text-xl mb-4">
        Orders
      </h1>

      <button
        onClick={() => {

          if (
            window.confirm(
              "Delete all orders?"
            )
          ) {

            deleteAllOrders();

            logActivity(
              "Deleted all orders"
            );

          }

        }}
        className="mb-4 bg-red-600 text-white px-4 py-2"
      >
        Delete All Orders
      </button>


      <AdminTable
        columns={columns}
        data={filteredOrders}
        actions={(row) => (

          <div className="flex gap-2 justify-end">

            {/* VIEW */}

            <button
              onClick={() =>
                navigate(`/admin/orders/${row.id}`)
              }
              className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
              title="View"
            >
              <Eye size={16} />
            </button>


            {/* DELETE */}

            <button
              onClick={async () => {

                if (window.confirm("Delete order?")) {

                  await deleteOrder(row.id);

                  await logActivity(
                    `Deleted order #${row.id.slice(-6)}`
                  );

                }

              }}
              className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>

          </div>

        )}
      />

    </AdminLayout>

  );

};

export default OrderList;