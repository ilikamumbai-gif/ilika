// The three reviews pasted with the schema were placeholders, not customer
// feedback. Never supplement the published product reviews with those examples.
export const getProductReviews = (product = {}) =>
  Array.isArray(product?.reviews) ? product.reviews : [];

// Use published product reviews without inventing authors, ratings, or dates.
export const buildProductReviewSchema = (reviews = []) => reviews.flatMap((review) => {
  const name = String(review?.name || review?.userName || "").trim();
  const reviewBody = String(review?.comment || review?.review || "").trim();
  const ratingValue = Number(review?.rating);
  if (!name || !reviewBody || !Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) return [];
  const raw = review?.date || review?.createdAt;
  const seconds = raw?._seconds ?? raw?.seconds;
  const date = raw ? new Date(seconds != null ? seconds * 1000 : raw) : null;
  return [{
    "@type": "Review",
    author: { "@type": "Person", name },
    datePublished: date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined,
    reviewRating: { "@type": "Rating", ratingValue, bestRating: 5, worstRating: 1 },
    reviewBody,
  }];
});
