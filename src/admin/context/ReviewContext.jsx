import React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {

  const [reviews, setReviews] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  const fetchReviews = async () => {

    const res = await fetch(`${API}/api/reviews`);
    const data = await res.json();

    setReviews(data);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <ReviewContext.Provider
      value={{ reviews, fetchReviews }}
    >
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () =>
  useContext(ReviewContext);
