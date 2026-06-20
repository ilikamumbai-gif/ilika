import React, { Suspense, lazy, useMemo, useState } from "react";

const Product360Modal = lazy(() => import("./Product360Modal"));

const Lazy360ViewButton = ({ images = [], productName = "", className = "" }) => {
  const [open, setOpen] = useState(false);

  const frameUrls = useMemo(
    () => (Array.isArray(images) ? images.map((item) => String(item || "").trim()).filter(Boolean) : []),
    [images]
  );

  if (frameUrls.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full border border-[#e8d6cf] bg-white px-4 py-2.5 text-sm font-semibold text-[#3e2a24] shadow-[0_12px_32px_rgba(69,39,34,0.08)] transition hover:-translate-y-0.5 hover:border-[#d9b5aa] hover:bg-[#fff8f6] hover:shadow-[0_18px_36px_rgba(69,39,34,0.12)] ${className}`}
      >
        View 360°
      </button>

      {open ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(20,14,13,0.72)] backdrop-blur-md">
              <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,#fffdfc_0%,#f4ebe7_100%)] px-8 py-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#ead6d0] border-t-[#7d4b3e]" />
                <p className="mt-4 text-sm font-semibold text-[#372622]">Opening 360° viewer</p>
              </div>
            </div>
          }
        >
          <Product360Modal
            images={frameUrls}
            productName={productName}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </>
  );
};

export default Lazy360ViewButton;
