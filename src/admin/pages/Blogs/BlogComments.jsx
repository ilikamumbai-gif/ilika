import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";

const BlogComments = () => {

  const API = import.meta.env.VITE_API_URL;

  const [comments, setComments] = useState([]);

  useEffect(() => {

    fetch(`${API}/api/admin/all-comments`)
      .then(res => res.json())
      .then(data => setComments(data));

  }, []);

  const deleteComment = async (blogId, commentId) => {

    if (!window.confirm("Delete comment?")) return;

    await fetch(
      `${API}/api/admin/comments/${blogId}/${commentId}`,
      { method: "DELETE" }
    );

    setComments(prev =>
      prev.filter(c => c.id !== commentId)
    );

  };

  return (

    <AdminLayout>

      <div className="p-6 max-w-6xl mx-auto">

        <h1 className="text-2xl font-semibold mb-6">
          Blog Comments
        </h1>

        <div className="overflow-x-auto">

          <table className="w-full border">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-3 text-left">Blog</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Comment</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Action</th>
              </tr>

            </thead>

            <tbody>

              {comments.map((c) => (

                <tr key={c.id} className="border-t">

                  <td className="p-3">
                    {c.blogTitle}
                  </td>

                  <td className="p-3">
                    {c.name}
                  </td>

                  <td className="p-3">
                    {c.message}
                  </td>

                  <td className="p-3">
                    {new Date(c.createdAt._seconds * 1000).toLocaleDateString()}
                  </td>

                  <td className="p-3">

                    <button
                      onClick={() =>
                        deleteComment(c.blogId, c.id)
                      }
                      className="text-red-500"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </AdminLayout>

  );

};

export default BlogComments;