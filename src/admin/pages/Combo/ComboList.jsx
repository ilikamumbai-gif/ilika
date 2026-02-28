import React, { useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useCombos } from "../../context/ComboContext";

const ComboList = () => {
    const navigate = useNavigate();
    const { combos, deleteCombo, fetchCombos } = useCombos();

    useEffect(() => {
        fetchCombos();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this combo?")) return;
        await deleteCombo(id);
    };

    const columns = [
        {
            label: "Combo Name",
            key: "name",
            render: (row) => (
                <span className="font-medium text-gray-800">
                    {row.name}
                </span>
            ),
        },
        {
            label: "Price",
            key: "price",
            align: "right",
            render: (row) => `₹${row.price}`,
        },
        {
            label: "MRP",
            key: "mrp",
            align: "right",
            render: (row) => row.mrp ? `₹${row.mrp}` : "-",
        },
        {
            label: "Status",
            key: "isActive",
            render: (row) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${row.isActive === false
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                >
                    {row.isActive === false ? "Inactive" : "Active"}
                </span>
            ),
        },
    ];

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Combos</h1>

                <button
                    onClick={() => navigate("/admin/combos/add")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm"
                >
                    <Plus size={16} />
                    Add Combo
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={combos}
                actions={(row) => (
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => navigate(`edit/${row.id}`)}
                            className="p-2 rounded-md bg-blue-50 text-blue-600"
                        >
                            <Pencil size={16} />
                        </button>

                        <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 rounded-md bg-red-50 text-red-600"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                emptyText="No combos found"
            />
        </AdminLayout>
    );
};

export default ComboList;