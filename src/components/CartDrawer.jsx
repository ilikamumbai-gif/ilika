import React from "react";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartProvider";

const CartDrawer = () => {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    incrementQty,
    decrementQty,
  } = useCart();

  if (!isCartOpen) return null;

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
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />

                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price}</p>

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
        <div className="p-4 border-t">
          <button className="w-full bg-black text-white py-3 rounded-lg">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
