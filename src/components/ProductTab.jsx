import React, { useState } from "react";

const ProductTab = ({ product }) => {
  const [activeTab, setActiveTab] = useState("description");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});

  const tabClass = (tab) =>
    `pb-3 cursor-pointer text-sm sm:text-base font-medium ${activeTab === tab
      ? "border-b-2 border-black text-black"
      : "text-gray-500 hover:text-black"
    }`;

  /* ===============================
     HANDLE REVIEW SUBMIT
  ================================ */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewRating || !reviewText) return;

    setLoading(true);

    try {
      const updatedReviews = [
        ...(product.reviews || []),
        {
          name: reviewName,
          rating: Number(reviewRating),
          comment: reviewText,
        },
      ];

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reviews: updatedReviews }),
        }
      );

      window.location.reload(); // simple refresh after review

    } catch (error) {
      console.error("Review submit failed:", error);
    }

    setLoading(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">

      {/* TABS */}
      <div className="flex gap-6 border-b">
        <button onClick={() => setActiveTab("description")} className={tabClass("description")}>
          Description
        </button>

        <button onClick={() => setActiveTab("info")} className={tabClass("info")}>
          Additional information
        </button>

        <button onClick={() => setActiveTab("reviews")} className={tabClass("reviews")}>
          Reviews ({product.reviews?.length || 0})
        </button>
      </div>

      <div className="py-8 text-sm sm:text-base leading-relaxed content-text space-y-6">

        {/* ================= DESCRIPTION ================= */}
        {activeTab === "description" && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold heading-color">
              Product Description
            </h3>

            {product.description ? (
              <div>
                <div
                  className={`prose max-w-none text-sm sm:text-base leading-relaxed transition-all duration-300 ${expandedDesc ? "" : "line-clamp-4"
                    }`}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />

                {/* READ MORE BUTTON */}
                <button
                  onClick={() => setExpandedDesc(!expandedDesc)}
                  className="heading-color font-medium mt-2 text-sm hover:underline"
                >
                  {expandedDesc ? "Read Less ▲" : "Read More ▼"}
                </button>
              </div>
            ) : (
              <p>No description available.</p>
            )}
          </>
        )}


        {/* ================= ADDITIONAL INFO ================= */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


            <div className="border p-4 rounded-lg sm:col-span-2">


              <h4 className="text-base sm:text-lg font-semibold">
                Aditional INformation
              </h4>
              {/* Highlights from Admin */}
              {product.highlights?.length > 0 && (
                <>

                  <ul className="list-disc pl-5 space-y-2">
                    {product.highlights.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>


          </div>
        )}

        {/* ================= REVIEWS ================= */}
        {activeTab === "reviews" && (
          <div className="space-y-8">

            {/* Existing Reviews */}
            {product.reviews?.length > 0 ? (
              product.reviews.map((review, index) => (
                <div key={index} className="border p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{review.name}</p>
                    <span className="text-sm">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}

            {/* Add Review */}
            <div className="secondary-bg-color shadow-sm p-5 sm:p-6 bg-[#fff9f7]">
              <h4 className="text-base sm:text-lg font-semibold heading-color mb-4">
                Add a Review
              </h4>

              <form onSubmit={handleReviewSubmit} className="space-y-4">

                <input
                  type="text"
                  placeholder="Your Name"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />

                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select rating</option>
                  <option value="5">★★★★★ - Excellent</option>
                  <option value="4">★★★★☆ - Very Good</option>
                  <option value="3">★★★☆☆ - Good</option>
                  <option value="2">★★☆☆☆ - Fair</option>
                  <option value="1">★☆☆☆☆ - Poor</option>
                </select>

                <textarea
                  rows="4"
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#E7A6A1] text-black text-sm font-medium px-6 py-2 rounded-md hover:bg-[#dd8f8a]"
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>

              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ProductTab;
