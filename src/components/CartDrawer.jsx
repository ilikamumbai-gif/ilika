import React, { useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import DiwaliOfferBanner from "./product/DiwaliOfferBanner";
import {
  getCartItemDisplayImage,
  getCartItemDisplayPricing,
  getCartItemVariantName,
  isPrepaidOfferEligible,
} from "../utils/productPricing";

const PREFERRED_PAYMENT_METHOD_KEY = "ilika_preferred_payment_method";

const formatInr = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getMaskMakerModel = (item) => {
  if (item?.isCombo) return null;
  const identifiers = [item?.productUrl, item?.slug, item?.name].filter(Boolean).join(" ").toLowerCase();
  const productSlugs = [item?.productUrl, item?.slug].filter(Boolean);
  if (productSlugs.some((slug) => slug === "non-voice-face-mask-maker")) return "non-voice";
  if (productSlugs.some((slug) => slug === "voice-face-mask-maker")) return "voice";
  if (/^\s*(?:ilika\s+)?collagen/i.test(item?.name || "") || /refill|tablet/.test(identifiers) || !/mask[\s-]*maker/.test(identifiers)) return null;
  return /non[\s-]*voice/.test(identifiers) ? "non-voice" : "voice";
};

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    incrementQty,
    decrementQty,
  } = useCart();

  const navigate = useNavigate();
  const subtotal = cartItems.reduce(
    (acc, item) => acc + getCartItemDisplayPricing(item).price * item.quantity,
    0
  );

  const grandTotal = subtotal;
  const prepaidEligibleTotal = cartItems.reduce(
    (acc, item) => {
      const itemPrice = getCartItemDisplayPricing(item).price;
      return acc + (isPrepaidOfferEligible(item, itemPrice)
        ? itemPrice * item.quantity
        : 0);
    },
    0
  );
  const prepaidDiscount = Math.min(100, Math.max(0, prepaidEligibleTotal));
  const maskMakerModels = [...new Set(cartItems.map(getMaskMakerModel).filter(Boolean))];
  useEffect(() => {
    if (!isCartOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isCartOpen]);
  if (!isCartOpen) return null;

  const goToCheckout = (preferredPaymentMethod = "") => {
    if (!cartItems.length) return;
    if (preferredPaymentMethod) {
      sessionStorage.setItem(PREFERRED_PAYMENT_METHOD_KEY, preferredPaymentMethod);
    }
    closeCart();
    navigate("/checkout");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCart}
      />

      <div role="dialog" aria-modal="true" aria-label="Shopping cart" className="fixed top-0 right-0 h-dvh w-full max-w-[420px] bg-white text-neutral-900 z-50 shadow-xl flex flex-col">
        <div className="flex shrink-0 items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            My Bag ({cartItems.length})
          </h3>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close shopping cart"
            className="inline-flex h-11 w-11 items-center justify-center"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center mt-10 space-y-3">
              <p className="text-gray-500">Your bag is empty</p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate("/shopall");
                }}
                className="bg-gradient-to-r from-[#cb8484] to-[#ecb7b7] text-black px-5 py-2 rounded-md hover:opacity-90 transition"
              >
                Shop All
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const itemImage = getCartItemDisplayImage(item);
              const itemPricing = getCartItemDisplayPricing(item);
              const variantName = getCartItemVariantName(item);
              const maskMakerModel = getMaskMakerModel(item);
              const includedGiftLabel = maskMakerModel
                ? maskMakerModel === "non-voice" ? "25 g Hydra Gel FREE" : "8 collagen peptide tablets FREE"
                : item.includedContents?.label;

              return (
                <div key={item.id} className="flex gap-2 sm:gap-4 border-b pb-4">
                  <img
                    loading="lazy"
                    src={itemImage}
                    alt={item.name}
                    width={64}
                    height={64}
                    decoding="async"
                    className="w-14 h-14 shrink-0 object-contain rounded border bg-white sm:w-16 sm:h-16"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium sm:text-base">{item.name}</p>

                    {variantName && (
                      <p className="text-xs text-gray-500 mt-[2px]">
                        {variantName}
                      </p>
                    )}
                    {item.selectedAddOn?.label && (
                      <p className="text-xs text-emerald-700 mt-[2px]">
                        Add-on: {item.selectedAddOn.label}
                      </p>
                    )}
                    {item.packContents?.label && (
                      <p className="mt-[2px] text-xs font-medium text-emerald-700">
                        Pack contents: {item.packContents.label}
                      </p>
                    )}
                    {includedGiftLabel && (
                      <p className="mt-[2px] text-xs font-semibold text-emerald-700">
                        Included free: {includedGiftLabel}
                      </p>
                    )}

                    {item.isCombo && item.comboItems && (
                      <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded-lg">
                        {item.comboItems.map((sub, i) => {
                          const isSurpriseMask =
                            Boolean(sub?.isFree) || /\(free\)/i.test(sub?.name || "");
                          const subUnitPrice = Number(sub?.price) || 0;

                          return (
                            <div key={i} className="flex items-center gap-2">
                              <img
                                loading="lazy"
                                src={
                                  Array.isArray(sub.image)
                                    ? sub.image[0]
                                    : sub.image || "/placeholder.webp"
                                }
                                alt={isSurpriseMask ? "Hydra Gel Face Moisturizer" : sub.name}
                                className="w-10 h-10 rounded object-cover border"
                              />

                              <div className="flex-1">
                                <p className="text-xs font-medium">
                                  {isSurpriseMask ? "Hydra Gel Face Moisturizer" : sub.name}
                                </p>
                                {sub.variantLabel && (
                                  <p className="text-[11px] text-gray-500">
                                    {sub.variantLabel}
                                  </p>
                                )}
                                {item.quantity > 1 && (
                                  <p className="text-[11px] text-gray-500">
                                    Qty: {item.quantity}
                                  </p>
                                )}
                              </div>

                              <span className="text-xs text-gray-400">
                                {isSurpriseMask ? "FREE" : `${subUnitPrice * item.quantity}`}
                              </span>
                            </div>
                          );
                        })}

                        <div className="flex justify-between text-xs font-medium border-t pt-2">
                          <span>Kit Price</span>
                          <span className="text-green-700">{itemPricing.price}</span>
                        </div>
                      </div>
                    )}

                    {!item.isCombo && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{itemPricing.price}</span>
                        {itemPricing.compareAtPrice && itemPricing.compareAtPrice > itemPricing.price ? (
                          <span className="text-xs text-gray-400 line-through">
                            {itemPricing.compareAtPrice}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => decrementQty(item.id)}
                        className="w-11 h-11 border rounded flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="text-sm font-medium">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => incrementQty(item.id)}
                        className="w-11 h-11 border rounded flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-medium sm:text-base">
                    {itemPricing.price * item.quantity}
                  </p>
                </div>
              );
            })
          )}
          {maskMakerModels.map((model) => (
            <DiwaliOfferBanner key={model} isNonVoiceMaskMaker={model === "non-voice"} />
          ))}
        </div>

        <div className="shrink-0 p-3 sm:p-4 border-t space-y-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatInr(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-green-900">Free</span>
            </div>

            <hr />

            <div className="flex justify-between text-base font-semibold">
              <span>Grand Total</span>
              <span>{formatInr(grandTotal)}</span>
            </div>
            {prepaidDiscount > 0 && (
              <p className="text-[11px] font-semibold text-[#0a8f45]">
                ₹{prepaidDiscount.toLocaleString("en-IN")} off prepaid · Pay {formatInr(Math.max(0, grandTotal - prepaidDiscount))}
              </p>
            )}
          </div>

          <button
            disabled={cartItems.length === 0}
            onClick={() => {
              goToCheckout("");
            }}
            className={`w-full py-3 rounded-lg text-white transition ${
              cartItems.length
                ? "bg-black hover:bg-gray-900 active:scale-[0.98]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
