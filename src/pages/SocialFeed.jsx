import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Facebook, Instagram, Play, X, Youtube } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const API = import.meta.env.VITE_API_URL;

const normalizeExternalLink = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const SocialFeed = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API}/api/social-feed`);
        const data = await res.json();
        if (!ignore) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setItems([]);
      }
    };
    fetchFeed();
    return () => {
      ignore = true;
    };
  }, []);

  const activeItems = useMemo(
    () =>
      items
        .filter((item) => item?.isActive !== false)
        .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0)),
    [items]
  );

  return (
    <>
      <MiniDivider />
      <div className="primary-bg-color min-h-screen">
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading={"Social Feed"}></Heading>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6 mb-8 sm:mb-10 flex-wrap">
            <a
              href="https://www.instagram.com/ilikamumbai/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#e2d2d2] bg-white text-[#2B1A1A] text-sm hover:bg-[#f8efef] transition"
            >
              <Instagram size={16} />
              Instagram
            </a>
            <a
              href="https://www.facebook.com/share/p/17Wgq3ytcj/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#e2d2d2] bg-white text-[#2B1A1A] text-sm hover:bg-[#f8efef] transition"
            >
              <Facebook size={16} />
              Facebook
            </a>
            <a
              href="https://www.youtube.com/channel/UC-oOVpDlsRaNrEi1a4dMOTg"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#e2d2d2] bg-white text-[#2B1A1A] text-sm hover:bg-[#f8efef] transition"
            >
              <Youtube size={16} />
              YouTube
            </a>
          </div>

          {activeItems.length === 0 ? (
            <p className="text-center text-[#634a4a]">No social posts available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-1.5">
              {activeItems.map((item, index) => {
                const id = item.id || item._id || index;
                const isVideo = item.mediaType === "video";
                const previewSrc = isVideo ? item.thumbnailUrl || item.mediaUrl : item.mediaUrl;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="group relative overflow-hidden rounded-none bg-white aspect-[4/5] text-left cursor-pointer"
                  >
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt={item.title || "social post"}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-[#f4ecec]" />
                    )}
                    {isVideo ? (
                      <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/55 text-white inline-flex items-center justify-center">
                        <Play size={16} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />

      {selected ? (
        <div className="fixed inset-0 z-[1300] bg-black/70 p-3 sm:p-6" onClick={() => setSelected(null)}>
          <div
            className="mx-auto h-full max-w-6xl bg-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black h-[42vh] lg:h-full">
              {selected.mediaType === "video" ? (
                <video src={selected.mediaUrl} controls autoPlay className="w-full h-full object-contain bg-black" />
              ) : (
                <img src={selected.mediaUrl} alt={selected.title || "social post"} className="w-full h-full object-contain bg-black" />
              )}
            </div>
            <div className="relative p-5 sm:p-7 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close social post"
              >
                <X size={18} />
              </button>
              <h2 className="text-2xl font-semibold text-[#2B1A1A] pr-10">{selected.title || "Social Post"}</h2>
              <p className="mt-4 text-[#3e2d2d] leading-relaxed whitespace-pre-wrap">{selected.content || "No content available."}</p>
              {selected.postLink ? (
                <a
                  href={normalizeExternalLink(selected.postLink)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[#8B1A1A] font-medium hover:underline"
                >
                  View Original Post <ExternalLink size={16} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SocialFeed;
