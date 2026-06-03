import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { useProducts } from "../../context/ProductContext";

const EditProduct = () => {
  const API = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateProduct } = useProducts();

  const [product, setProduct] = useState(null);
  const [candidateIds, setCandidateIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getProductById } = useProducts();

  const collectCandidateIds = (entry = {}) =>
    Array.from(
      new Set(
        [
          entry?.docId,
          entry?.id,
          entry?.legacyId,
          entry?._id,
          id,
        ]
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    );

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);

      try {
        const existing = getProductById(id);
        if (existing) {
          const directId = String(existing?.docId || existing?.id || existing?._id || id);
          const normalized = { ...existing, docId: directId, id: directId };
          setProduct(normalized);
          setCandidateIds(collectCandidateIds(normalized));
          if (directId !== String(id)) {
            navigate(`/admin/products/edit/${directId}`, { replace: true });
          }
          return;
        }

        const exactRes = await fetch(`${API}/api/products/${id}`);
        if (exactRes.ok) {
          const exact = await exactRes.json();
          const normalized = {
            ...exact,
            docId: String(exact?.id || exact?.docId || exact?._id || id),
            id: String(exact?.id || exact?.docId || exact?._id || id),
          };
          setProduct(normalized);
          setCandidateIds(collectCandidateIds(normalized));
          return;
        }

        const listRes = await fetch(`${API}/api/products`);
        if (!listRes.ok) {
          setProduct(null);
          setCandidateIds([]);
          return;
        }

        const list = await listRes.json().catch(() => []);
        const targetId = String(id || "").trim().toLowerCase();
        const found = (Array.isArray(list) ? list : []).find((entry) =>
          [
            entry?.docId,
            entry?.id,
            entry?._id,
            entry?.legacyId,
          ].some((value) => String(value || "").trim().toLowerCase() === targetId)
        );

        if (!found) {
          setProduct(null);
          setCandidateIds([]);
          return;
        }

        const normalized = {
          ...found,
          docId: String(found?.docId || found?.id || found?._id || id),
          id: String(found?.docId || found?.id || found?._id || id),
        };
        setProduct(normalized);
        setCandidateIds(collectCandidateIds(normalized));
        if (normalized.docId !== String(id)) {
          navigate(`/admin/products/edit/${normalized.docId}`, { replace: true });
        }
      } catch (error) {
        console.error("Failed to load product for edit:", error);
        setProduct(null);
        setCandidateIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [API, id, getProductById, navigate]);

  const handleUpdate = async (data) => {
    const result = await updateProduct(candidateIds.length ? candidateIds : [id], data);
    console.log("Product update response:", result);
    console.log("Merchant sync result:", result?.merchantSync || { status: "missing" });
    navigate("/admin/products");
  };

  if (isLoading) {
    return <AdminLayout>Loading...</AdminLayout>;
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Product not found for this ID.</p>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back to Products
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="mb-4 text-xl font-semibold">Edit Product</h1>
      <ProductForm initialData={product} onSubmit={handleUpdate} />
    </AdminLayout>
  );
};

export default EditProduct;
