import React, { useEffect } from "react";
import { useCombos } from "../admin/context/ComboContext";
import { useProducts } from "../admin/context/ProductContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import { useCart } from "../context/CartProvider";
import { Link } from "react-router-dom";

const Combos = () => {
  const { combos, fetchCombos } = useCombos();
  const { products, fetchProducts } = useProducts();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, []);

  const activeCombos = combos.filter(
    (c) => c.isActive !== false
  );

  const getProductById = (id) =>
    products.find((p) => p.id === id);

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-10">

          <Heading heading="Exclusive Combos" />

          {activeCombos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">
              No combos available.
            </p>
          ) : (

            /* ✅ RESPONSIVE GRID */
            <div className="grid 
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3 
              xl:grid-cols-4 
              gap-5 sm:gap-6 mt-6"
            >

              {activeCombos.map((combo) => {

                let img = null;

                if (combo.images?.length > 0) {
                  if (typeof combo.images[0] === "string") {
                    img = combo.images[0];
                  } else if (combo.images[0]?.url) {
                    img = combo.images[0].url;
                  }
                }

                if (!img && combo.image) img = combo.image;
                if (!img && combo.imageUrl) img = combo.imageUrl;

                const discount =
                  combo.mrp && combo.mrp > combo.price
                    ? Math.round(
                        ((combo.mrp - combo.price) /
                          combo.mrp) *
                          100
                      )
                    : null;

                return (
                  <Link
                    to={`/combo/${combo.id}`}
                    key={combo.id}
                    className="w-full"
                  >

                    <div className="
                      primary-bg-color 
                      rounded-2xl 
                      overflow-hidden 
                      shadow-sm 
                      hover:shadow-lg 
                      transition-all 
                      duration-300 
                      flex 
                      flex-col
                      h-full
                    ">

                      {/* IMAGE */}
                      <div className="
                        relative 
                        aspect-square 
                        overflow-hidden 
                        flex 
                        items-center 
                        justify-center
                      ">

                        {img ? (
                          <img
                            src={img}
                            alt={combo.name}
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                            className="
                              absolute inset-0
                              w-full h-full
                              object-contain
                              scale-[1.05] sm:scale-[1.08]
                              p-2 sm:p-3
                            "
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">
                            No Image
                          </div>
                        )}

                        {discount && (
                          <div className="
                            absolute 
                            top-2 right-2
                            bg-[#b34140]
                            text-white
                            text-[10px] sm:text-xs
                            font-semibold
                            px-2 py-1
                            rounded-md
                          ">
                            {discount}% OFF
                          </div>
                        )}

                      </div>

                      {/* CONTENT */}
                      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-grow">

                        {/* NAME */}
                        <h3 className="
                          text-[13px] sm:text-[14px]
                          font-semibold
                          text-[#172917]
                          tracking-wide
                        ">
                          {combo.name}
                        </h3>

                        {/* PRODUCTS */}
                        {combo.productIds?.length > 0 && (
                          <div>

                            <p className="
                              text-[11px] sm:text-[12px]
                              heading-color
                            ">
                              Includes:
                            </p>

                            <div className="
                              flex flex-wrap
                              gap-1
                              mt-1
                            ">

                              {combo.productIds.map((pid) => {
                                const product =
                                  getProductById(pid);

                                return product ? (
                                  <span
                                    key={pid}
                                    className="
                                      text-[10px] sm:text-[11px]
                                      text-[#1c371c98]
                                    "
                                  >
                                    {product.name}
                                  </span>
                                ) : null;
                              })}

                            </div>
                          </div>
                        )}

                        {/* FREE */}
                        {combo.freeProductId && (
                          <div className="
                            text-[11px] sm:text-[12px]
                            text-[#b34140]
                          ">
                            🎁 Free:{" "}
                            {
                              getProductById(
                                combo.freeProductId
                              )?.name
                            }
                          </div>
                        )}

                        {/* PRICE */}
                        <div className="
                          flex items-baseline
                          gap-2
                          mt-1
                        ">

                          <span className="
                            font-semibold
                            text-[#1C371C]
                            text-[15px] sm:text-[16px]
                          ">
                            ₹{combo.price}
                          </span>

                          {combo.mrp &&
                            combo.mrp > combo.price && (
                              <span className="
                                text-[#1c371c98]
                                text-[12px]
                                line-through
                              ">
                                ₹{combo.mrp}
                              </span>
                            )}

                        </div>

                      </div>

                      {/* BUTTON */}
                      <div className="px-3 sm:px-4 pb-4">

                        <button
                          onClick={(e) => {
                            e.preventDefault();

                            addToCart({
                              ...combo,
                              id: `combo_${combo.id}`,
                              isCombo: true,
                            });
                          }}
                          className="
                            w-full
                            text-[12px] sm:text-[13px]
                            tracking-widest
                            py-2 sm:py-2.5
                            rounded-lg
                            bg-[#2b2a29]
                            text-white
                          "
                        >
                          Add Combo To Cart
                        </button>

                      </div>

                    </div>

                  </Link>
                );
              })}

            </div>
          )}

        </section>

        <Footer />

      </div>
    </>
  );
};

export default Combos;