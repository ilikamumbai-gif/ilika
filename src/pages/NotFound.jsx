import React from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import { useSeo } from "../hooks/useSeo";

const NotFound = () => {
  const location = useLocation();

  useSeo({
    title: "Page Not Found | Ilika",
    description: "The page you are looking for could not be found.",
    path: location.pathname || "/",
    robots: "noindex, nofollow",
    type: "website",
  });

  return (
    <>
      <MiniDivider />
      <section className="w-full primary-bg-color">
        <Header />
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b24074]">
            404
          </p>
          <h1
            className="mt-4 text-[38px] font-semibold leading-tight text-[#1f1a17] sm:text-[52px]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Page not found
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6e5b55] sm:text-base">
            This link may be outdated, removed, or entered incorrectly.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1f1a17] px-7 text-sm font-semibold text-white transition hover:bg-black"
            >
              Back to home
            </Link>
            <Link
              to="/products"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#1f1a17] px-7 text-sm font-semibold text-[#1f1a17] transition hover:bg-[#1f1a17] hover:text-white"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default NotFound;
