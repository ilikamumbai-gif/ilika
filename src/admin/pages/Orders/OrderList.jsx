import React from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useOrders } from "../../context/OrderContext";

const OrderList = () => {
  const { orders } = useOrders();
  const navigate = useNavigate();

  const columns = [
    { label: "Order ID", key: "id" },
    { label: "Customer", key: "userName" },
    {
      label: "Total",
      key: "total",
      align: "right",
      render: (row) => `₹${row.total}`,
    },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "Delivered"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { label: "Date", key: "date" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Orders</h1>

      <AdminTable
        columns={columns}
        data={orders}
        actions={(row) => (
          <button
            onClick={() => navigate(`/admin/orders/${row.id}`)}
            className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="View Order"
          >
            <Eye size={16} />
          </button>
        )}
        emptyText="No orders found"
      />
    </AdminLayout>
  );
};

export default OrderList;
