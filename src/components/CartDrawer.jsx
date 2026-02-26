import React from "react";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartProvider";
import { useNavigate } from "react-router-dom";

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    incrementQty,
    decrementQty,
  } = useCart();

  const navigate = useNavigate(); // ✅ ADDED

  if (!isCartOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );


  const grandTotal = subtotal ;

  

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCart}
      />

      {/* DRAWER */}
      <div className="fixed top-0 right-0 h-full w-[90%] sm:w-[420px] bg-white z-50 shadow-xl flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            My Bag ({cartItems.length})
          </h3>
          <X className="cursor-pointer" onClick={closeCart} />
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Your bag is empty
            </p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">

                <img
                  src={item.images}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />

                <div className="flex-1">

                  <p className="font-medium">{item.name}</p>

                  {/* ✅ SHOW KIT PRODUCTS */}
                  {item.isCombo && item.comboItems && (
                    <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded-lg">

                      {item.comboItems.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2">

                          <img
                            src={sub.image[0]}
                            alt={sub.name}
                            className="w-10 h-10 rounded object-cover border"
                          />

                          <div className="flex-1">
                            <p className="text-xs font-medium">{sub.name}</p>
                            <p className="text-[11px] text-gray-500 capitalize">
                              {sub.category}
                            </p>
                          </div>

                          <span className="text-xs text-gray-400">
                            ₹{sub.price}
                          </span>

                        </div>
                      ))}

                      <div className="flex justify-between text-xs font-medium border-t pt-2">
                        <span>Kit Price</span>
                        <span className="text-green-700">₹{item.price}</span>
                      </div>

                    </div>
                  )}

                  {/* Normal product price */}
                  {!item.isCombo && (
                    <p className="text-sm text-gray-500">₹{item.price}</p>
                  )}

                  {/* QUANTITY CONTROLS */}
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

                {/* PRICE */}
                <p className="font-medium">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t space-y-3">

          <div className="space-y-2 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span >
                Delivery
              </span>
             <span className="text-green-900">Free </span>
            </div>

            <hr />

            <div className="flex justify-between text-base font-semibold">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>

          </div>

          {/* ✅ UPDATED CHECKOUT BUTTON */}
          <button
            disabled={cartItems.length === 0}
            onClick={() => {
              if (!cartItems.length) return;
              closeCart();
              navigate("/checkout");
            }}
            className={`w-full py-3 rounded-lg text-white transition
              ${cartItems.length
                ? "bg-black hover:bg-gray-900 active:scale-[0.98]"
                : "bg-gray-400 cursor-not-allowed"}`}
          >
            Proceed to Checkout
          </button>

        </div>

      </div>
    </>
  );
};

export default CartDrawer;
