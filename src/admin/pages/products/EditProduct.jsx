import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ProductForm from "../../components/ProductFrom";
import { useProducts } from "../../context/ProductContext";

/* ================= LOG ================= */


const EditProduct = () => {
  const API = import.meta.env.VITE_API_URL;

  const { id } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const {
    products,
    updateProduct,
    fetchProducts,
    getProductById
  } = useProducts();

  const [product, setProduct] = useState(null);
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedProduct, setHasResolvedProduct] = useState(false);

  const getCanonicalProductId = (entry) =>
    String(entry?.id || entry?._id || entry?.docId || id || "");


  useEffect(() => {

    const load = async () => {
      setIsLoading(true);
      try {
        const sourceList = products.length ? products : await fetchProducts();
        const stateProduct = location.state?.product || null;
        if (stateProduct) {
          const resolvedFromList =
            sourceList.find((entry) =>
              String(entry?.legacyDocId) === String(stateProduct?.id || stateProduct?.docId || stateProduct?._id || "") ||
              String(entry?.id) === String(stateProduct?.id || stateProduct?.docId || stateProduct?._id || "") ||
              String(entry?.docId) === String(stateProduct?.id || stateProduct?.docId || stateProduct?._id || "") ||
              String(entry?.name || "").trim().toLowerCase() === String(stateProduct?.name || "").trim().toLowerCase()
            ) || stateProduct;
          const directId = getCanonicalProductId(resolvedFromList);
          setResolvedProductId(directId);
          setProduct({ ...resolvedFromList, id: directId, docId: directId });
          setHasResolvedProduct(true);
          if (directId && directId !== String(id)) {
            navigate(`/admin/products/edit/${directId}`, {
              replace: true,
              state: {
                ...location.state,
                product: { ...resolvedFromList, id: directId, docId: directId },
              },
            });
          }
          return;
        }

        const existing =
          sourceList.find((p) =>
            String(p?.docId) === String(id) ||
            String(p?.id) === String(id) ||
            String(p?._id) === String(id)
          ) ||
          getProductById(id);
        if (existing) {
          const existingId = getCanonicalProductId(existing);
          setResolvedProductId(existingId);
          setProduct({ ...existing, id: existingId, docId: existingId });
          setHasResolvedProduct(true);
          if (existingId && existingId !== String(id)) {
            navigate(`/admin/products/edit/${existingId}`, { replace: true, state: location.state });
          }
          return;
        }

        // Fallback: fetch exact product by route id to avoid stale-cache mismatches.
        const res = await fetch(`${API}/api/products/${id}`);
        if (res.ok) {
          const exact = await res.json();
          const normalized = exact ? { ...exact, id: getCanonicalProductId(exact), docId: getCanonicalProductId(exact) } : null;
          setResolvedProductId(String(normalized?.id || id));
          setProduct(normalized || null);
          setHasResolvedProduct(Boolean(normalized));
        } else {
          // Final fallback for mixed backends: scan full list and match by id/_id.
          const allRes = await fetch(`${API}/api/products`);
          if (allRes.ok) {
            const all = await allRes.json();
            const fallback = (Array.isArray(all) ? all : []).find(
              (p) =>
                String(p?.docId) === String(id) ||
                String(p?.id) === String(id) ||
                String(p?._id) === String(id)
            );
            const normalized = fallback
              ? { ...fallback, id: getCanonicalProductId(fallback), docId: getCanonicalProductId(fallback) }
              : null;
            setResolvedProductId(String(normalized?.id || ""));
            if (normalized) {
              setProduct(normalized);
              setHasResolvedProduct(true);
            } else if (!hasResolvedProduct) {
              setProduct(null);
            }
          } else {
            if (!hasResolvedProduct) setProduct(null);
          }
        }
      } finally {
        setIsLoading(false);
      }

    };

    load();

  }, [id, products, fetchProducts, getProductById, API, location.state, navigate, hasResolvedProduct]);


  const handleUpdate = async (data) => {
    const targetId = resolvedProductId || id;
    const result = await updateProduct(targetId, data);
    console.log("Product update response:", result);
    console.log("Merchant sync result:", result?.merchantSync || { status: "missing" });
    navigate("/admin/products", {
      state: { restoreListState: location.state?.listState || null },
    });
  };


  if (isLoading) {

    return (
      <AdminLayout>
        Loading...
      </AdminLayout>
    );

  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Product not found for this ID.</p>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
          >
            Back to Products
          </button>
        </div>
      </AdminLayout>
    );
  }


  return (

    <AdminLayout>

      <h1 className="text-xl font-semibold mb-4">
        Edit Product
      </h1>

      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
      />

    </AdminLayout>

  );

};

export default EditProduct;
