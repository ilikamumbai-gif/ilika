import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const ReviewDetail = () => {

  const { productId, index } = useParams();
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);


  /* ================= FETCH ================= */

  const fetchReview = async () => {

    try {

      const res = await fetch(
        `${API}/api/reviews/${productId}/${index}`
      );

      const data = await res.json();

      setReview(data);

    } catch (err) {

      console.error("Review fetch error", err);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    fetchReview();
  }, []);


  /* ================= DELETE ================= */

  const deleteReview = async () => {

    if (!window.confirm("Delete this review?"))
      return;

    try {

      await fetch(
        `${API}/api/reviews/${productId}/${index}`,
        {
          method: "DELETE",
        }
      );

      await logActivity(
        `Deleted review by ${review.name || "Anonymous"} on ${review.productName}`
      );

      navigate("/admin/reviews");

    } catch (err) {

      console.error("Delete review failed", err);

    }

  };


  if (loading) {
    return (
      <AdminLayout>
        Loading...
      </AdminLayout>
    );
  }

  if (!review) {
    return (
      <AdminLayout>
        Review not found
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-xl font-semibold">
          Review Details
        </h1>

        <button
          onClick={() => navigate("/admin/reviews")}
          className="px-3 py-1 text-sm bg-gray-200 rounded"
        >
          Back
        </button>

      </div>


      <div className="bg-white shadow rounded-lg p-6 space-y-5">


        {/* PRODUCT */}

        <div>
          <p className="text-sm text-gray-500">
            Product
          </p>
          <p className="font-medium">
            {review.productName}
          </p>
        </div>


        {/* NAME */}

        <div>
          <p className="text-sm text-gray-500">
            Reviewer Name
          </p>
          <p className="font-medium">
            {review.name || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            User Type
          </p>
          <p className={`font-medium ${review.userType === "genuine" ? "text-emerald-600" : "text-rose-600"}`}>
            {review.userType === "genuine" ? "Genuine User" : "Fake User"}
          </p>
        </div>


        {/* EMAIL */}

        {review.userEmail && (

          <div>
            <p className="text-sm text-gray-500">
              User Email
            </p>
            <p>
              {review.userEmail}
            </p>
          </div>

        )}

        {review.userId && (
          <div>
            <p className="text-sm text-gray-500">
              User ID
            </p>
            <p>
              {review.userId}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">
            Verified Purchase
          </p>
          <p className={`font-medium ${review.verifiedPurchase ? "text-emerald-600" : "text-gray-500"}`}>
            {review.verifiedPurchase ? "Yes" : "No"}
          </p>
        </div>


        {/* RATING */}

        <div>
          <p className="text-sm text-gray-500">
            Rating
          </p>

          <p className="text-lg">

            {"★".repeat(review.rating || 0)}
            {"☆".repeat(5 - (review.rating || 0))}

          </p>

        </div>


        {/* COMMENT */}

        <div>
          <p className="text-sm text-gray-500">
            Comment
          </p>

          <div className="bg-gray-50 p-4 rounded">

            {review.comment || "No comment"}

          </div>

        </div>

        {review.image && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Review Image
            </p>
            <img
              src={review.image}
              alt="Review"
              className="w-full max-w-sm rounded-lg border border-gray-200 object-cover"
            />
          </div>
        )}


        {/* DATE */}

        {review.createdAt && (

          <div>
            <p className="text-sm text-gray-500">
              Date
            </p>

            <p>
              {new Date(
                review.createdAt
              ).toLocaleString()}
            </p>

          </div>

        )}


        {/* DELETE */}

        <div className="pt-4">

          <button
            onClick={deleteReview}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete Review
          </button>

        </div>

      </div>

    </AdminLayout>
  );
};

export default ReviewDetail;
