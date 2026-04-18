import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCombos } from "../admin/context/ComboContext";
import { useProducts } from "../admin/context/ProductContext";
import { useCart } from "../context/CartProvider";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";

import { createSlug } from "../utils/slugify";
import { Truck, ShieldCheck, BadgeCheck } from "lucide-react";
import { useSeo } from "../hooks/useSeo";

const ComboTab = lazy(() => import("../components/ComboTab"));

const ComboDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { combos, fetchCombos } = useCombos();
  const { products, fetchProducts } = useProducts();
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!combos.length) fetchCombos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combos.length]);

  useEffect(() => {
    if (!products.length) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const combo = combos.find((c) => c.id === id);

  const productsById = useMemo(() => {
    return new Map(products.map((p) => [String(p.id), p]));
  }, [products]);

  const getProductById = (pid) => productsById.get(String(pid));

  const images = useMemo(() => combo?.images || [], [combo?.images]);
  const primaryImage = selectedImage || images[0] || "/Images/logo2.webp";
  const comboPath = `/combo/${id}`;
  const comboDescription = combo
    ? `${combo.name} combo at Rs ${combo.price}. Includes curated skincare products with fast shipping and secure checkout.`
    : "Explore Ilika skincare combos with curated products and special savings.";

  const productSchema = combo
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: combo.name,
        image: images.length ? images : [primaryImage],
        description: comboDescription,
        brand: {
          "@type": "Brand",
          name: "Ilika",
        },
        category: "Beauty Combo",
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: Number(combo.price) || 0,
          availability: "https://schema.org/InStock",
          url: `https://ilika.in${comboPath}`,
        },
      }
    : null;

  useSeo({
    title: combo ? `${combo.name} | Ilika Combo` : "Combo Details | Ilika",
    description: comboDescription,
    path: comboPath,
    image: primaryImage,
    type: combo ? "product" : "website",
    jsonLd: productSchema,
  });

  useEffect(() => {
    if (!selectedImage && images.length) {
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  if (!combo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading combo...
      </div>
    );
  }

  const discount =
    combo.mrp && combo.mrp > combo.price
      ? Math.round(((combo.mrp - combo.price) / combo.mrp) * 100)
      : 0;

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />
        <main>

        {/* ================= MAIN ================= */}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

            {/* ================= IMAGE ================= */}

            <div className="flex flex-col gap-4">

              <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm">

                {images[0] && (
                  <img loading="lazy"
                    src={primaryImage} 
                    alt={combo.name}
                    className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"
                  />
                )}

              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">

                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className="rounded-lg overflow-hidden border"
                      aria-label={`View image ${i + 1} of ${images.length}`}
                    >
                      <img loading="lazy"
                        src={img}
                        alt={`${combo.name} thumbnail ${i + 1}`}
                        className="w-full h-20 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}

                </div>
              )}

            </div>


            {/* ================= RIGHT ================= */}

            <div className="flex flex-col gap-4 lg:sticky lg:top-24 h-fit">

              <button
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:underline w-fit"
              >
                ← Back
              </button>

              <h1 className="text-2xl sm:text-3xl font-luxury font-bold text-[#2b2a29]">
                {combo.name}
              </h1>

              {/* PRICE */}

              <div className="flex items-center gap-3">

                <span className="text-2xl font-semibold text-[#1C371C]">
                  ₹{combo.price}
                </span>

                {combo.mrp && (
                  <span className="line-through text-gray-400">
                    ₹{combo.mrp}
                  </span>
                )}

                {discount > 0 && (
                  <span className="text-xs border px-2 py-1 border-[#026a17] text-[#026a17] rounded">
                    {discount}% OFF
                  </span>
                )}

              </div>

              <p className="text-sm text-gray-500">
                (Inclusive of all taxes)
              </p>


              {/* INCLUDED PRODUCTS */}

              <div className="border rounded-2xl p-5 bg-[#fff6f5]">

                <div className="font-semibold heading-color text-lg mb-2">
                  Products Included
                </div>

                <ul className="space-y-1 text-sm">

                  {combo.productIds?.map((pid) => {

                    const product = getProductById(pid);
                    if (!product) return null;

                    const slug = createSlug(product.name);

                    return (
                      <li key={pid}>
                        <Link
                          to={`/product/${slug}`}
                          state={{ id: product.id }}
                          className="hover:underline"
                        >
                          ✓ {product.name}
                        </Link>
                      </li>
                    );
                  })}

                </ul>

              </div>


              {/* FREE PRODUCT */}

              {combo.freeProductId && (() => {

                const free = getProductById(
                  combo.freeProductId
                );

                if (!free) return null;

                const slug = createSlug(free.name);

                return (

                  <Link
                    to={`/product/${slug}`}
                    state={{ id: free.id }}
                    className="border rounded-2xl p-4 bg-green-50 block"
                  >

                    <p className="font-semibold text-green-700 mb-2">
                      🎁 Free Product
                    </p>

                    <div className="flex gap-3 items-center">

                      <img loading="lazy"
                        src={free.images?.[0]}
                        alt={free.name}
                        className="w-16 h-16 object-contain border rounded"
                        loading="lazy"
                        decoding="async"
                      />

                      <div>
                        <p className="font-medium">
                          {free.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          Worth ₹{free.price}
                        </p>
                      </div>

                    </div>

                  </Link>

                );

              })()}


              {/* BUTTON */}

              <button
                onClick={() =>
                  addToCart({
                    ...combo,
                    id: `combo_${combo.id}`,
                    isCombo: true,
                  })
                }
                className="py-3 rounded-xl bg-[#2b2a29] text-white"
              >
                Add Combo To Cart
              </button>


              {/* TRUST BADGES */}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <div className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2 bg-white text-sm">
                  <Truck className="w-5 h-5" />
                  Fast Shipping
                </div>

                <div className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2 bg-white text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  Secure Payment
                </div>

                <div className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2 bg-white text-sm col-span-2 sm:col-span-1">
                  <BadgeCheck className="w-5 h-5" />
                  Delivery Guaranteed
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* TAB */}
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" />}>
          <ComboTab combo={combo} products={products} />
        </Suspense>

        <Footer />
        </main>

      </div>
    </>
  );
  
};
export default ComboDetail;
