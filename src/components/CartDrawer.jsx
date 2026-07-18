import React, { useMemo, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import {
  getCartItemDisplayImage,
  getCartItemDisplayPricing,
  getCartItemVariantName,
} from "../utils/productPricing";

const EMI_PLAN_MONTHS = [3, 6, 9];
const PREFERRED_PAYMENT_METHOD_KEY = "ilika_preferred_payment_method";

const formatInr = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    incrementQty,
    decrementQty,
  } = useCart();

  const navigate = useNavigate();
  const [showEmiDetails, setShowEmiDetails] = useState(false);

  if (!isCartOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + getCartItemDisplayPricing(item).price * item.quantity,
    0
  );

  const grandTotal = subtotal;
  const emiPlans = useMemo(
    () =>
      EMI_PLAN_MONTHS.map((months) => ({
        months,
        monthly: Math.ceil(Math.max(0, grandTotal) / months),
      })),
    [grandTotal]
  );
  const primaryEmiPlan = emiPlans[0];

  const goToCheckout = (preferredPaymentMethod = "") => {
    if (!cartItems.length) return;
    if (preferredPaymentMethod) {
      sessionStorage.setItem(PREFERRED_PAYMENT_METHOD_KEY, preferredPaymentMethod);
    } else {
      sessionStorage.removeItem(PREFERRED_PAYMENT_METHOD_KEY);
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

      <div className="fixed top-0 right-0 h-full w-[90%] sm:w-[420px] bg-white text-neutral-900 z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            My Bag ({cartItems.length})
          </h3>
          <X className="cursor-pointer" onClick={closeCart} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

              return (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  <img
                    loading="lazy"
                    src={itemImage}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded border bg-white"
                  />

                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>

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
                        onClick={() => decrementQty(item.id)}
                        className="w-7 h-7 border rounded flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="text-sm font-medium">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => incrementQty(item.id)}
                        className="w-7 h-7 border rounded flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="font-medium">
                    {itemPricing.price * item.quantity}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t space-y-3">
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
          </div>

          {cartItems.length > 0 && primaryEmiPlan ? (
            <div className="rounded-[18px] border border-[#231815] bg-white px-3 pb-3 pt-4 shadow-[0_10px_24px_rgba(69,39,34,0.06)]">
              <span className="inline-flex min-h-[24px] items-center rounded-[9px] bg-[#231815] px-3 py-1 text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                EMI available
              </span>
              <button
                type="button"
                onClick={() => setShowEmiDetails((prev) => !prev)}
                className="mt-3 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-[14px] leading-tight text-[#2f3540]">
                    or <span className="font-bold text-[#231815]">{formatInr(primaryEmiPlan.monthly)}</span>
                    <span className="font-semibold text-[#111827]">/month</span> ({primaryEmiPlan.months} months)
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-4 text-[#5f666d]">
                    Based on your current cart total. Tap to view EMI splits.
                  </p>
                </div>
                <span className="inline-flex h-fit shrink-0 items-center justify-center rounded-full bg-[#231815] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                  {showEmiDetails ? "Hide" : "View"}
                </span>
              </button>

              {showEmiDetails ? (
                <div className="mt-3 rounded-[16px] border border-[#ead7d2] bg-[#fcf8f6] p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {emiPlans.map((plan) => (
                      <div key={plan.months} className="rounded-[12px] border border-[#ead7d2] bg-white px-2 py-2 text-center">
                        <p className="text-[14px] font-bold leading-none text-[#231815]">{formatInr(plan.monthly)}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b5d52]">
                          {plan.months} Months
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#374151]">Cart Total</span>
                    <span className="font-bold text-[#231815]">{formatInr(grandTotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToCheckout("ONLINE")}
                    className="mt-3 w-full rounded-lg bg-[#231815] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111111]"
                  >
                    Checkout with Razorpay EMI
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

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
