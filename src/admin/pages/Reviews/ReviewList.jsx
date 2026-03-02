import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logActivity } from "../../Utils/logActivity";

const ReviewList = () => {

  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL;


  /* ================= FETCH ================= */

  const fetchReviews = async () => {

    try {

      setLoading(true);

      const res = await fetch(
        `${API}/api/reviews`
      );

      const data = await res.json();

      setReviews(data);

    } catch (err) {

      console.error("Fetch review error", err);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    fetchReviews();
  }, []);



  /* ================= DELETE ================= */

  const deleteReview = async (
    productId,
    reviewIndex,
    name,
    productName
  ) => {

    if (!window.confirm("Delete review?"))
      return;

    await fetch(
      `${API}/api/reviews/${productId}/${reviewIndex}`,
      {
        method: "DELETE",
      }
    );

    await logActivity(
      `Deleted review by ${name} on ${productName}`
    );

    fetchReviews();

  };


  /* ================= TABLE ================= */

  const columns = [

    {
      label: "Product",
      key: "productName",
    },

    {
      label: "Name",
      key: "name",
    },

    {
      label: "Rating",
      key: "rating",
      render: (row) =>
        "★".repeat(row.rating || 0),
    },

    {
      label: "Comment",
      key: "comment",
      render: (row) =>
        row.comment
          ? row.comment.slice(0, 40) + "..."
          : "-",
    },

  ];


  return (
    <AdminLayout>

      <h1 className="text-xl font-semibold mb-4">
        Reviews
      </h1>


      {loading ? (

        <p>Loading reviews...</p>

      ) : (

        <AdminTable
          columns={columns}
          data={reviews}

          actions={(row) => (

            <div className="flex gap-2">

              {/* VIEW */}

              <button
                onClick={() =>
                  navigate(
                    `/admin/reviews/${row.productId}/${row.reviewIndex}`
                  )
                }
                className="p-2 bg-blue-50 text-blue-600 rounded"
              >
                <Eye size={16} />
              </button>


              {/* DELETE */}

              <button
                onClick={() =>
                  deleteReview(
                    row.productId,
                    row.reviewIndex,
                    row.name,
                    row.productName
                  )
                }
                className="p-2 bg-red-50 text-red-600 rounded"
              >
                <Trash2 size={16} />
              </button>

            </div>

          )}

          emptyText="No reviews found"
        />

      )}

    </AdminLayout>
  );
};

export default ReviewList;