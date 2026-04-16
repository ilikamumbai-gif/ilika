import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createSlug } from "../utils/slugify";

const ComboTab = ({ combo, products }) => {
  const [activeTab, setActiveTab] = useState("description");

  const tabClass = (tab) =>
    `pb-3 cursor-pointer text-sm sm:text-base font-medium ${
      activeTab === tab
        ? "border-b-2 border-black text-black"
        : "text-gray-500 hover:text-black"
    }`;

  const getProductById = (id) =>
    products.find((p) => p.id === id);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">

      {/* ================= TABS ================= */}

      <div className="flex gap-6 border-b">

        <button
          onClick={() => setActiveTab("description")}
          className={tabClass("description")}
        >
          Description
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={tabClass("products")}
        >
          Products Included
        </button>

        {combo.freeProductId && (
          <button
            onClick={() => setActiveTab("free")}
            className={tabClass("free")}
          >
            Free Product
          </button>
        )}

      </div>

      <div className="py-8 text-sm sm:text-base leading-relaxed content-text space-y-6">


        {/* ================= DESCRIPTION ================= */}

        {activeTab === "description" && (

          <>




            {/* ================= PRODUCT DETAILS ================= */}

            <h3 className="text-lg sm:text-xl font-semibold heading-color mt-2">
              Product Details
            </h3>


            <div className="space-y-8">

              {combo.productIds?.map((pid) => {

                const product = getProductById(pid);
                if (!product) return null;

                const slug = createSlug(product.name);

                return (

                  <div
                    key={pid}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row gap-6"
                  >

                    {/* IMAGE */}

                    {product.images?.[0] && (

                      <img
                        src={product.images[0]}
                        className="w-full sm:w-40 h-40 object-contain border rounded-lg p-2 bg-white"
                      />

                    )}


                    {/* TEXT */}

                    <div className="flex-1">

                      <Link
                        to={`/product/${slug}`}
                        state={{ id: product.id }}
                        className="font-semibold text-lg hover:underline"
                      >
                        {product.name}
                      </Link>


                      {product.description ? (

                        <div
                          className="mt-3 prose max-w-none text-sm"
                          dangerouslySetInnerHTML={{
                            __html: product.description,
                          }}
                        />

                      ) : (

                        <p className="text-sm text-gray-500 mt-2">
                          No description available
                        </p>

                      )}

                    </div>

                  </div>

                );

              })}

            </div>

          </>

        )}


        {/* ================= PRODUCTS ================= */}

        {activeTab === "products" && (

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {combo.productIds?.map((pid) => {

              const product = getProductById(pid);
              if (!product) return null;

              const slug = createSlug(product.name);

              return (

                <Link
                  key={pid}
                  to={`/product/${slug}`}
                  state={{ id: product.id }}
                  className="border rounded-xl p-3 hover:shadow"
                >

                  {product.images?.[0] && (

                    <img
                      src={product.images[0]}
                      className="w-full h-40 object-contain"
                    />

                  )}

                  <p className="mt-2 font-medium">
                    {product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    ₹{product.price}
                  </p>

                </Link>

              );

            })}

          </div>

        )}


        {/* ================= FREE PRODUCT ================= */}

        {activeTab === "free" && combo.freeProductId && (

          (() => {

            const free = getProductById(combo.freeProductId);
            if (!free) return null;

            const slug = createSlug(free.name);

            return (

              <Link
                to={`/product/${slug}`}
                state={{ id: free.id }}
                className="flex gap-4 border p-4 rounded-xl"
              >

                <img
                  src={free.images?.[0]}
                  className="w-24 h-24 object-contain"
                />

                <div>

                  <h3 className="font-semibold">
                    {free.name}
                  </h3>

                  <p className="text-gray-500">
                    Worth ₹{free.price}
                  </p>

                </div>

              </Link>

            );

          })()

        )}

      </div>

    </section>
  );
};

export default ComboTab;