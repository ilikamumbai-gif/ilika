import React, { useEffect, useMemo, useRef, useState } from "react";

const DRAG_STEP_PX = 18;

const clampFrameIndex = (index, total) => {
  if (!total) return 0;
  const normalized = index % total;
  return normalized < 0 ? normalized + total : normalized;
};

const Product360Viewer = ({ images = [], productName = "", showFrameCounter = true }) => {
  const frameUrls = useMemo(
    () => (Array.isArray(images) ? images.map((item) => String(item || "").trim()).filter(Boolean) : []),
    [images]
  );
  const totalFrames = frameUrls.length;

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const dragStateRef = useRef({
    active: false,
    lastX: 0,
    carry: 0,
  });

  useEffect(() => {
    if (!totalFrames) return undefined;

    let cancelled = false;
    const imageElements = [];

    frameUrls.forEach((url) => {
      const img = new Image();
      const markLoaded = () => {
        if (cancelled) return;
        setLoadedCount((prev) => prev + 1);
      };
      const markError = () => {
        if (cancelled) return;
        setLoadError("Unable to load 360° product images.");
      };

      img.onload = markLoaded;
      img.onerror = markError;
      img.decoding = "async";
      img.src = url;
      imageElements.push(img);
    });

    return () => {
      cancelled = true;
      imageElements.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [frameUrls, totalFrames]);

  useEffect(() => {
    const handlePointerUp = () => {
      dragStateRef.current.active = false;
      dragStateRef.current.carry = 0;
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp, { passive: true });
    window.addEventListener("touchcancel", handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerUp);
    };
  }, []);

  const rotateFromX = (clientX) => {
    if (!dragStateRef.current.active || totalFrames <= 1) return;

    const deltaX = clientX - dragStateRef.current.lastX;
    dragStateRef.current.lastX = clientX;
    dragStateRef.current.carry += deltaX;

    if (Math.abs(dragStateRef.current.carry) < DRAG_STEP_PX) return;

    const steps = Math.trunc(dragStateRef.current.carry / DRAG_STEP_PX);
    dragStateRef.current.carry -= steps * DRAG_STEP_PX;

    setCurrentFrame((prev) => clampFrameIndex(prev - steps, totalFrames));
  };

  const handleDragStart = (clientX) => {
    dragStateRef.current.active = true;
    dragStateRef.current.lastX = clientX;
    dragStateRef.current.carry = 0;
    setIsDragging(true);
  };

  const isReady = totalFrames > 0 && loadedCount === totalFrames && !loadError;
  const activeImage = frameUrls[currentFrame] || "";

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className={`relative flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(247,239,236,0.98)_55%,_rgba(236,225,221,0.95))] shadow-[0_28px_90px_rgba(48,26,20,0.16)] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => rotateFromX(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => rotateFromX(e.targetTouches[0].clientX)}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),transparent)]" />

        {activeImage ? (
          <img
            src={activeImage}
            alt={`${productName || "Product"} 360 frame ${currentFrame + 1}`}
            draggable={false}
            className={`h-full w-full select-none object-contain px-4 py-4 transition-opacity duration-150 ease-out sm:px-8 sm:py-6 ${isReady ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="h-full w-full bg-white/70" />
        )}

        {!isReady && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,rgba(255,250,249,0.92),rgba(245,236,232,0.92))]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ead6d0] border-t-[#7d4b3e]" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#3c2a25]">Loading 360° view</p>
              <p className="mt-1 text-xs text-[#7d6a63]">
                {loadedCount}/{totalFrames} frames ready
              </p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/92 px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-[#412a24]">{loadError}</p>
              <p className="mt-1 text-xs text-[#7a655f]">Please try again in a moment.</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
          <div className="rounded-full border border-white/65 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#745952] backdrop-blur-md">
            Drag to rotate
          </div>
          {showFrameCounter && totalFrames > 0 && (
            <div className="rounded-full border border-white/65 bg-[#2d211e]/82 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md">
              {currentFrame + 1} / {totalFrames}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product360Viewer;