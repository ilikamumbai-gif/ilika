import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { logActivity } from "../../Utils/logActivity";

const ViewBlogDetails = () => {

  const { id } = useParams();
  const { blogs } = useBlog();

  const API = import.meta.env.VITE_API_URL;

  const blog = blogs.find(b => b.id === id);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  /* ================= DATE FORMAT ================= */

  const formatDate = (date) => {

    if (!date) return "";

    const d = new Date(date);

    const day = d.getDate();
    const year = d.getFullYear();

    const month = d
      .toLocaleString("en-GB", { month: "short" })
      .toLowerCase();

    return `${day} ${month} ${year}`;
  };

  /* ================= FIRESTORE DATE ================= */

  const formatCommentDate = (timestamp) => {

    if (!timestamp) return "";

    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleDateString();
    }

    return new Date(timestamp).toLocaleDateString();
  };

  /* ================= FETCH COMMENTS ================= */

  useEffect(() => {

    if (!id) return;

    const loadComments = async () => {

      try {

        const res = await fetch(
          `${API}/api/admin/blogs/${id}/comments`
        );

        const data = await res.json();

        console.log("Fetched comments:", data);

        setComments(data);

      } catch (err) {

        console.error("Failed to load comments", err);

      } finally {

        setLoadingComments(false);

      }

    };

    loadComments();

  }, [id]);

  /* ================= DELETE COMMENT ================= */

  const deleteComment = async (commentId) => {

    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;

    try {

      setDeletingId(commentId);

      await fetch(
        `${API}/api/admin/blogs/${id}/comments/${commentId}`,
        { method: "DELETE" }
      );

      await logActivity(`Deleted comment by ${c.name} on blog: ${blog.title}`);

      setComments(prev =>
        prev.filter(c => c.id !== commentId)
      );

    } catch (err) {

      console.error("Delete failed", err);
      alert("Failed to delete comment");

    } finally {

      setDeletingId(null);

    }

  };

  if (!blog) {
    return (
      <AdminLayout>
        <p className="p-6">Blog not found</p>
      </AdminLayout>
    );
  }

  return (

    <AdminLayout>

      <div className="max-w-4xl mx-auto p-6">

        {/* BLOG IMAGE */}

        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-80 object-cover rounded-xl mb-6"
        />

        {/* BLOG TITLE */}

        <h1 className="text-3xl font-bold mb-2">
          {blog.title}
        </h1>

        {/* BLOG DATE */}

        <p className="text-sm text-gray-500 mb-6">
          By {blog.author} • {formatDate(blog.createdAt)}
        </p>

        {/* SHORT DESC */}

        {blog.shortDesc && (

          <p className="text-lg font-medium mb-4">
            {blog.shortDesc}
          </p>

        )}

        {/* CONTENT */}

        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{
            __html: blog.content,
          }}
        />

        {/* ================= COMMENTS ================= */}

        <div className="mt-12">

          <h2 className="text-xl font-semibold mb-4">
            Comments ({comments.length})
          </h2>

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
                  className="border p-4 rounded-lg flex justify-between items-start"
                >

                  <div>

                    <p className="font-semibold">
                      {c.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatCommentDate(c.createdAt)}
                    </p>

                    <p className="mt-1 text-sm">
                      {c.message}
                    </p>

                  </div>

                  <button
                    onClick={() => deleteComment(c.id)}
                    disabled={deletingId === c.id}
                    className="text-red-500 text-sm hover:underline disabled:opacity-50"
                  >

                    {deletingId === c.id
                      ? "Deleting..."
                      : "Delete"}

                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </AdminLayout>

  );

};

export default ViewBlogDetails;