import React, { useEffect } from "react";
import { X } from "lucide-react";
import Product360Viewer from "./Product360Viewer";

const Product360Modal = ({ images = [], productName = "", onClose }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] bg-[rgba(20,14,13,0.76)] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${productName || "Product"} 360 degree viewer`}
    >
      <div className="flex h-full w-full items-end justify-center sm:items-center sm:p-6 lg:p-10">
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-none bg-[linear-gradient(180deg,#fffdfc_0%,#f6eeeb_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:h-auto sm:max-h-[92vh] sm:rounded-[32px] lg:max-w-[min(96vw,1100px)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#eadbd5] px-5 py-4 sm:px-7 sm:py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6f67]">
                Interactive 360° View
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#2f211d] sm:text-xl">
                {productName || "Product Preview"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5d3cc] bg-white/88 text-[#4b312b] shadow-sm transition hover:bg-white"
              aria-label="Close 360 degree view"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 px-3 pb-3 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
            <div className="h-full min-h-[60vh] sm:min-h-[70vh]">
              <Product360Viewer
                key={images.join("|")}
                images={images}
                productName={productName}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product360Modal;
