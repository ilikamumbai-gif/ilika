import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Layers3,
  Package,
  Pencil,
  PlayCircle,
  Tag,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useProducts } from "../../context/ProductContext";
import { useCategories } from "../../context/CategoryContext";
import { getProductDisplayImage, getProductDisplayPricing } from "../../../utils/productPricing";

const getSafeFileExtension = (url = "") => {
  const cleanUrl = String(url || "").split("?")[0];
  const match = cleanUrl.match(/\.([a-zA-Z0-9]{3,4})$/);
  return match?.[1]?.toLowerCase() || "jpg";
};

const flattenImages = (product) => {
  const mainImages = Array.isArray(product?.images) ? product.images : [];
  const variantImages = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) =>
        (Array.isArray(variant?.images) ? variant.images : []).map((imageUrl, imageIndex) => ({
          url: imageUrl,
          label: `${variant?.label || `Variant ${imageIndex + 1}`}`,
          group: "Variant Images",
        }))
      )
    : [];
  const ingredientImages = Array.isArray(product?.ingredients)
    ? product.ingredients.map((item, index) => ({
        url: typeof item === "string" ? item : item?.image || item?.url || "",
        label: `Ingredient ${index + 1}`,
        group: "Ingredient Images",
      }))
    : [];
  const inTheBoxImages = Array.isArray(product?.inTheBox)
    ? product.inTheBox.map((item, index) => ({
        url: typeof item === "string" ? item : item?.image || item?.url || "",
        label: item?.title || `Box Item ${index + 1}`,
        group: "What's In The Box",
      }))
    : [];
  const beforeAfterImages = Array.isArray(product?.beforeAfter)
    ? product.beforeAfter.flatMap((pair, index) => [
        {
          url: pair?.before || "",
          label: `Before ${index + 1}`,
          group: "Before / After",
        },
        {
          url: pair?.after || "",
          label: `After ${index + 1}`,
          group: "Before / After",
        },
      ])
    : [];
  const view360Images = Array.isArray(product?.view360Images)
    ? product.view360Images.map((url, index) => ({
        url,
        label: `360 View ${index + 1}`,
        group: "360 Product View",
      }))
    : [];

  return [
    ...mainImages.map((url, index) => ({
      url,
      label: `Main ${index + 1}`,
      group: "Main Images",
    })),
    ...variantImages,
    ...view360Images,
    ...ingredientImages,
    ...inTheBoxImages,
    ...beforeAfterImages,
  ].filter((entry) => String(entry?.url || "").trim());
};

const htmlToPlainText = (value = "") => {
  if (!value) return "";
  if (typeof window === "undefined") {
    return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const temp = window.document.createElement("div");
  temp.innerHTML = String(value);
  return (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim();
};

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
  </div>
);

const ImageCard = ({ item, index, downloading, onDownload }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="aspect-square bg-gray-50">
      <img
        loading="lazy"
        src={item.url}
        alt={item.label}
        className="h-full w-full object-cover"
      />
    </div>
    <div className="space-y-2 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{item.group}</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{item.label}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onDownload(item, index)}
          disabled={downloading}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={14} />
          {downloading ? "Downloading..." : "Download"}
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
        >
          <ExternalLink size={14} />
          Open
        </a>
      </div>
    </div>
  </div>
);

const ViewProductDetails = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { id } = useParams();
  const { loading, getProductById } = useProducts();
  const { categories = [] } = useCategories();
  const [downloadingKey, setDownloadingKey] = useState("");
  const [product, setProduct] = useState(null);
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState("");

  const getCanonicalProductId = (entry) =>
    String(
      entry?.docId ||
      entry?.id ||
      entry?.legacyDocId ||
      entry?.legacyId ||
      entry?._id ||
      id ||
      ""
    );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const existing = getProductById(id);
        if (existing) {
          const directId = getCanonicalProductId(existing);
          const normalized = { ...existing, id: directId, docId: directId };
          setResolvedProductId(directId);
          setProduct(normalized);
          if (directId !== String(id)) {
            navigate(`/admin/products/view/${directId}`, { replace: true });
          }
          return;
        }

        const res = await fetch(`${API}/api/products/${id}`);
        if (res.ok) {
          const exact = await res.json();
          const normalized = exact ? { ...exact, id: getCanonicalProductId(exact), docId: getCanonicalProductId(exact) } : null;
          setResolvedProductId(String(normalized?.id || id));
          setProduct(normalized || null);
          return;
        }

        const allRes = await fetch(`${API}/api/products`);
        if (allRes.ok) {
          const all = await allRes.json();
          const targetId = String(id || "").trim().toLowerCase();
          const fallback = (Array.isArray(all) ? all : []).find(
            (entry) =>
              [
                entry?.docId,
                entry?.id,
                entry?._id,
                entry?.legacyId,
              ].some((value) => String(value || "").trim().toLowerCase() === targetId)
          );
          const normalized = fallback
            ? { ...fallback, id: getCanonicalProductId(fallback), docId: getCanonicalProductId(fallback) }
            : null;
          setResolvedProductId(String(normalized?.id || ""));
          setProduct(normalized);
          if (normalized?.docId && normalized.docId !== String(id)) {
            navigate(`/admin/products/view/${normalized.docId}`, { replace: true });
          }
          return;
        }

        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, API, getProductById, navigate]);

  const categoryNames = useMemo(() => {
    const ids = Array.isArray(product?.categoryIds) ? product.categoryIds : [];
    return ids
      .map((categoryId) => categories.find((item) => String(item.id) === String(categoryId))?.name)
      .filter(Boolean);
  }, [product?.categoryIds, categories]);
  const productPricing = useMemo(() => getProductDisplayPricing(product), [product]);
  const productImage = useMemo(() => getProductDisplayImage(product), [product]);

  const allImages = useMemo(() => flattenImages(product), [product]);
  const plainDescription = useMemo(() => htmlToPlainText(product?.description || ""), [product?.description]);

  const handleCopy = async (field, value) => {
    const text = String(value || "").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? "" : current));
      }, 1800);
    } catch (error) {
      console.error(`Failed to copy ${field}:`, error);
    }
  };

  const handleDownloadImage = async (item, index) => {
    const fileKey = `${item.group}-${index}`;
    setDownloadingKey(fileKey);

    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension = getSafeFileExtension(item.url);
      const baseName = String(product?.name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      link.href = objectUrl;
      link.download = `${baseName || "product"}-${item.group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Image download failed:", error);
      window.open(item.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingKey("");
    }
  };

  if (isLoading || (!product && loading)) {
    return (
      <AdminLayout>
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Loading product details...
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-800">Product not found</p>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Products
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
            >
              <ArrowLeft size={16} />
              Back to Products
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
            <p className="mt-1 text-sm text-gray-400">Review product info and download uploaded images.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/admin/products/edit/${resolvedProductId || product?.docId || product?.id || product?._id}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit Product
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-5 md:flex-row">
              {productImage ? (
                <img
                  loading="lazy"
                  src={productImage}
                  alt={product.name}
                  className="h-40 w-40 rounded-2xl border border-gray-200 object-cover"
                />
              ) : (
                <div className="grid h-40 w-40 place-content-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                  <Package size={28} />
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-wrap items-start gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{product.tagline || product.shortInfo || "No short description added."}</p>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${product.isActive === false ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                      {product.isActive === false ? "Inactive" : "Active"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${product.inStock === false ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-700"}`}>
                      {product.inStock === false ? "Out of Stock" : "In Stock"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard icon={Tag} label="Price" value={`Rs ${productPricing.price || "-"}`} />
                  <InfoCard icon={Tag} label="MRP" value={`Rs ${productPricing.compareAtPrice || "-"}`} />
                  <InfoCard icon={Layers3} label="Categories" value={categoryNames.join(", ") || "-"} />
                  <InfoCard icon={PlayCircle} label="Videos" value={Array.isArray(product.videos) ? String(product.videos.length) : "0"} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Product Summary</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Short Info</p>
                <p>{product.shortInfo || "-"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Additional Info</p>
                <p>
                  {Array.isArray(product.additionalInfo)
                    ? product.additionalInfo.join(", ")
                    : product.additionalInfo || "-"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Product ID</p>
                <p>{product.docId || product.id || product._id || "-"}</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Description</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("description", plainDescription)}
                    disabled={!plainDescription}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedField === "description" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedField === "description" ? "Copied" : "Copy"}
                  </button>
                </div>
                {product.description ? (
                  <div
                    className="max-h-56 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 leading-6 text-gray-700 [&_ol]:ml-5 [&_ol]:list-decimal [&_p+p]:mt-3 [&_strong]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Uploaded Images</h3>
              <p className="mt-1 text-sm text-gray-400">Download main images, variants, ingredients, and before / after uploads.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
              <ImageIcon size={14} />
              {allImages.length} image{allImages.length === 1 ? "" : "s"}
            </div>
          </div>

          {allImages.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allImages.map((item, index) => (
                <ImageCard
                  key={`${item.group}-${item.label}-${index}`}
                  item={item}
                  index={index}
                  downloading={downloadingKey === `${item.group}-${index}`}
                  onDownload={handleDownloadImage}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-400">
              No images uploaded for this product yet.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewProductDetails;
