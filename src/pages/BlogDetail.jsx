import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const BlogDetail = () => {

  const { state: blog } = useLocation();
  const API = import.meta.env.VITE_API_URL;

  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);

  /* ================= FETCH COMMENTS ================= */

  useEffect(() => {

    if (!blog?.id) return;

    const loadComments = async () => {

      try {

        const res = await fetch(
          `${API}/api/blogs/${blog.id}/comments`
        );

        const data = await res.json();

        setComments(data);

      } catch (err) {

        console.error("Failed to load comments", err);

      } finally {

        setLoadingComments(false);

      }

    };

    loadComments();

  }, [blog?.id]);

  /* ================= POST COMMENT ================= */

  const submitComment = async (e) => {

    e.preventDefault();

    if (!name.trim() || !message.trim()) return;

    try {

      setPosting(true);

      const res = await fetch(
        `${API}/api/blogs/${blog.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            message,
          }),
        }
      );

      const newComment = await res.json();

      // update UI instantly
      setComments(prev => [newComment, ...prev]);

      setName("");
      setMessage("");

    } catch (err) {

      console.error("Comment failed", err);

    } finally {

      setPosting(false);

    }

  };

  if (!blog) {
    return (
      <p className="text-center py-20">
        Blog not found
      </p>
    );
  }

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">

        <Header />
        <CartDrawer />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* HEADER */}

          <div className="text-center space-y-3">

            <Heading heading={blog.title} />

            <p className="content-text text-sm sm:text-base">
              {blog.excerpt}
            </p>

            <p className="text-xs text-gray-500">

              {blog.createdAt &&
                new Date(blog.createdAt).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}

              {" • "}
              {blog.author}

            </p>

          </div>


          {/* IMAGE */}

          <div className="mt-8 rounded-2xl overflow-hidden">

            <img loading="lazy"
              src={blog.image}
              alt={blog.title}
              className="w-full h-56 sm:h-72 md:h-96 object-cover"
            />

          </div>


          {/* CONTENT */}

          <div className="mt-8 prose max-w-none">

            <div
              dangerouslySetInnerHTML={{
                __html: blog.content,
              }}
            />

          </div>


          {/* TAGS */}

          {blog.tags?.length > 0 && (

            <div className="mt-8 flex flex-wrap gap-2">

              {blog.tags.map(tag => (

                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-gray-200"
                >
                  #{tag}
                </span>

              ))}

            </div>

          )}


          {/* COMMENTS */}

          <div className="mt-12">

            <h3 className="text-xl font-semibold mb-4">
              Comments ({comments.length})
            </h3>


            {/* COMMENT FORM */}

            <form
              onSubmit={submitComment}
              className="space-y-3 mb-6"
            >

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full border p-2 rounded"
                required
              />

              <textarea
                placeholder="Write a comment..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                className="w-full border p-2 rounded"
                required
              />

              <button
                disabled={posting}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
              >

                {posting
                  ? "Posting..."
                  : "Post Comment"}

              </button>

            </form>


            {/* COMMENT LIST */}

            {loadingComments ? (

              <p className="text-gray-500 text-sm">
                Loading comments...
              </p>

            ) : comments.length === 0 ? (

              <p className="text-gray-500 text-sm">
                No comments yet
              </p>

            ) : (

              <div className="space-y-4">

                {comments.map((c) => (

                  <div
                    key={c.id}
                    className="border rounded-lg p-3"
                  >

                    <p className="font-semibold">
                      {c.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {new Date(
                        c.createdAt
                      ).toLocaleDateString()}
                    </p>

                    <p className="mt-1 text-sm">
                      {c.message}
                    </p>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>

      <Footer />
    </>
  );

};

export default BlogDetail;