import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, TicketPercent } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useCoupons } from "../../context/CouponContext";
import { logActivity } from "../../Utils/logActivity";

const EMPTY_FORM = {
  name: "",
  code: "",
  discountPercent: "",
  isActive: true,
};

const CouponList = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const sortedCoupons = useMemo(() => {
    return [...(coupons || [])].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }, [coupons]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const code = String(form.code || "").trim();
    const discountPercent = Number(form.discountPercent || 0);

    if (!code) return alert("Coupon code is required");
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return alert("Discount percent must be between 1 and 100");
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code,
        discountPercent,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateCoupon(editingId, payload);
        await logActivity(`Updated coupon: ${code} (${discountPercent}%)`);
      } else {
        await addCoupon(payload);
        await logActivity(`Created coupon: ${code} (${discountPercent}%)`);
      }
      resetForm();
    } catch (error) {
      alert(error.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      name: coupon.name || "",
      code: coupon.code || "",
      discountPercent: coupon.discountPercent || "",
      isActive: coupon.isActive !== false,
    });
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await deleteCoupon(coupon.id);
      await logActivity(`Deleted coupon: ${coupon.code}`);
      if (editingId === coupon.id) resetForm();
    } catch (error) {
      alert(error.message || "Failed to delete coupon");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sortedCoupons.length} coupons created</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-4 sm:p-5 mb-5 space-y-4" style={{ borderColor: "#EBEBEB" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Coupon name (optional)"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Code (e.g. SUMMER20)"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            placeholder="Discount %"
            min={1}
            max={100}
            value={form.discountPercent}
            onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active coupon
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
          >
            <Plus size={15} />
            {editingId ? "Update Coupon" : "Create Coupon"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "#EBEBEB" }}>
        {sortedCoupons.length === 0 ? (
          <div className="px-5 py-14 text-center text-gray-400">
            <TicketPercent className="mx-auto mb-2" size={26} />
            No coupons yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                  {["Code", "Name", "Discount", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-100">
                    <td className="px-5 py-4 font-semibold">{coupon.code}</td>
                    <td className="px-5 py-4 text-gray-600">{coupon.name || "-"}</td>
                    <td className="px-5 py-4">{coupon.discountPercent}%</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${coupon.isActive === false ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {coupon.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CouponList;
