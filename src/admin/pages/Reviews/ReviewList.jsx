import React, { useEffect, useState } from "react";
import { Eye, Trash2, Star, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={12}
        className={
          s <= rating
            ? "fill-amber-400 text-amber-400"
            : "text-gray-200 fill-gray-200"
        }
      />
    ))}
    <span className="ml-1 text-xs font-semibold text-gray-600">{rating}/5</span>
  </div>
);

const getUserType = (review) => {
  if (review?.userType === "genuine") return "genuine";
  if (review?.isGenuine === true) return "genuine";
  if (review?.verifiedPurchase === true) return "genuine";
  if (review?.userId || review?.userEmail) return "genuine";
  return "fake";
};

const ReviewList = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/reviews`);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const deleteReview = async (productId, reviewIndex, name, productName) => {
    if (!window.confirm("Delete this review?")) return;
    await fetch(`${API}/api/reviews/${productId}/${reviewIndex}`, {
      method: "DELETE",
    });
    await logActivity(`Deleted review by ${name} on ${productName}`);
    fetchReviews();
  };

  const filtered = reviews.filter((r) => {
    const searchMatch =
      !search ||
      r.productName?.toLowerCase().includes(search.toLowerCase()) ||
      r.name?.toLowerCase().includes(search.toLowerCase());

    const ratingMatch = !ratingFilter || String(r.rating) === ratingFilter;
    const userTypeMatch = !userTypeFilter || getUserType(r) === userTypeFilter;

    return searchMatch && ratingMatch && userTypeMatch;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "-";

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reviews.length} reviews - avg {avgRating} *
          </p>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center"
        style={{ border: "1px solid #EBEBEB" }}
      >
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by product or reviewer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />

        <div className="relative">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-300"
            style={{ border: "1px solid #E0E0E0" }}
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="10" height="6" viewBox="0 0 10 6">
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-300"
            style={{ border: "1px solid #E0E0E0" }}
          >
            <option value="">All Users</option>
            <option value="genuine">Genuine User</option>
            <option value="fake">Fake User</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="10" height="6" viewBox="0 0 10 6">
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Star size={40} className="mb-3" />
            <p className="text-sm">No reviews found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                    {["Product", "Reviewer", "Email", "User Type", "Rating", "Comment", "Image", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#888" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/70 transition-colors"
                      style={{ borderBottom: "1px solid #F5F5F5" }}
                    >
                      <td className="px-5 py-4 font-semibold text-gray-800 max-w-[160px] truncate">
                        {row.productName}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{row.name || "-"}</td>
                      <td className="px-5 py-4 text-gray-500 max-w-[180px] truncate">{row.userEmail || "-"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            getUserType(row) === "genuine"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {getUserType(row) === "genuine" ? "Genuine" : "Fake"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StarRating rating={row.rating || 0} />
                      </td>
                      <td className="px-5 py-4 text-gray-500 max-w-xs">
                        <p className="truncate">
                          {row.comment
                            ? `${row.comment.slice(0, 60)}${row.comment.length > 60 ? "..." : ""}`
                            : "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {row.image ? (
                          <img loading="lazy"
                            src={row.image}
                            alt="Review"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/reviews/${row.productId}/${row.reviewIndex}`)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() =>
                              deleteReview(row.productId, row.reviewIndex, row.name, row.productName)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
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

            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((row) => (
                <div key={row.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{row.productName}</p>
                      <p className="text-xs text-gray-400">{row.name || "-"}</p>
                      {row.userEmail && <p className="text-[11px] text-gray-500 mt-0.5">{row.userEmail}</p>}
                      <p
                        className={`text-[11px] font-semibold mt-1 ${
                          getUserType(row) === "genuine" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {getUserType(row) === "genuine" ? "Genuine User" : "Fake User"}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/reviews/${row.productId}/${row.reviewIndex}`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() =>
                          deleteReview(row.productId, row.reviewIndex, row.name, row.productName)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {row.image && (
                    <img loading="lazy"
                      src={row.image}
                      alt="Review"
                      className="w-full h-32 object-cover rounded-xl border border-gray-100"
                    />
                  )}
                  <StarRating rating={row.rating || 0} />
                  {row.comment && <p className="text-sm text-gray-500">{row.comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReviewList;
