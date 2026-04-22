import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const getReviewImages = (review = {}) => {
  if (Array.isArray(review.images) && review.images.length) return review.images;
  if (typeof review.image === "string" && review.image.trim()) return [review.image];
  return [];
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?._seconds === "number") return new Date(value._seconds * 1000);
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatReviewDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

  const userType = review.userType === "genuine" || review.verifiedPurchase === true ? "genuine" : "fake";
  const reviewImages = getReviewImages(review);

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
          <p className={`font-medium ${userType === "genuine" ? "text-emerald-600" : "text-rose-600"}`}>
            {userType === "genuine" ? "Genuine User" : "Fake User"}
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

        {reviewImages.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Review Images ({reviewImages.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              {reviewImages.map((img, i) => (
                <img
                  loading="lazy"
                  key={`${img}-${i}`}
                  src={img}
                  alt={`Review ${i + 1}`}
                  className="w-full h-44 rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              Review Images
            </p>
            <p className="text-gray-400 text-sm">
              No image uploaded
            </p>
          </div>
        )}



        {/* DATE */}

        {review.createdAt && (

          <div>
            <p className="text-sm text-gray-500">
              Date
            </p>

            <p>
              {formatReviewDate(review.createdAt)}
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
