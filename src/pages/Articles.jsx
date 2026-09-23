import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { STATIC_BLOGS } from "../data/privateBlogs.js";
import { getArticleLinkTitle, getPublicBlogs } from "../utils/publicBlogs.js";
import { getApiUrl } from "../utils/api";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const Articles = () => {
  const [apiBlogs, setApiBlogs] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(getApiUrl("/api/blogs"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load articles");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setApiBlogs(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* Repository articles remain available if the API is unavailable. */ })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingArticles(false);
      });
    return () => controller.abort();
  }, []);
  const articles = useMemo(() => getPublicBlogs([...STATIC_BLOGS, ...apiBlogs]), [apiBlogs]);

  return <>
    <MiniDivider />
    <Header />
    <CartDrawer />
    <main className="mx-auto max-w-7xl px-4 py-10 text-[#1C371C] sm:px-6 sm:py-16">
      <Link to="/blog" className="text-sm text-[#801f1f] underline underline-offset-4">Back to Ilika Journal</Link>
      <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Ilika Articles</h1>
      <p className="mb-10 mt-4 max-w-2xl text-base leading-7 text-[#4a5f4a]">Explore our complete collection of beauty, skincare and haircare articles. Choose a guide below to start reading.</p>
        <section aria-labelledby="articles-heading" aria-busy={loadingArticles} className="mb-12">
          <h2 id="articles-heading" className="mb-5 text-2xl font-semibold">All articles</h2>
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(({ route, blog }) => (
              <li key={route}>
                <Link to={route} className="block rounded-lg border border-[#ececec] p-4 text-sm leading-6 text-[#801f1f] underline underline-offset-4 hover:bg-[#faf8f5]">
                  {getArticleLinkTitle(blog.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

    </main>
    <Footer />
  </>;
};

export default Articles;
