import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Percent } from "lucide-react";

const HomeDivisionSttrip = ({
  to = "/offers",
  title = "Extra 15% Off",
  subtitle = "On 1st Order",
  codeLabel = "Use Code",
  code = "NEW15",
  offers = [],
}) => {
  const navigate = useNavigate();
  const resolvedOffers = useMemo(() => {
    if (offers.length > 0) return offers;
    return [{ to, title, subtitle, codeLabel, code }];
  }, [offers, to, title, subtitle, codeLabel, code]);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentOffer = resolvedOffers[activeIndex] || resolvedOffers[0];

  const showPreviousOffer = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((current) =>
      current <= 0 ? resolvedOffers.length - 1 : current - 1
    );
  };

  const showNextOffer = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((current) =>
      current >= resolvedOffers.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(currentOffer?.to || to)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(currentOffer?.to || to);
        }
      }}
      className="block w-full cursor-pointer"
    >
      <section className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden border border-[#8f302f] bg-[#b34140] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(179,65,64,0.22)]">
          <span className="pointer-events-none absolute left-[-48px] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
          <span className="pointer-events-none absolute right-[-36px] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex min-h-[86px] items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
            <button
              type="button"
              onClick={showPreviousOffer}
              aria-label="Show previous offer"
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/80 bg-transparent text-white transition-colors duration-300 hover:bg-white hover:text-[#b34140] sm:inline-flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-4 sm:px-6 lg:px-12">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white shadow-[0_10px_24px_rgba(82,22,22,0.18)] sm:flex">
                <Percent className="h-8 w-8" />
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3">
                  <p className="text-[24px] font-bold leading-none tracking-tight text-white sm:text-[34px]">
                    {currentOffer?.title || title}
                  </p>
                  <p className="text-[15px] font-medium text-white/90 sm:text-[18px]">
                    {currentOffer?.subtitle || subtitle}
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 rounded-full border border-white/80 bg-white px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#231815] shadow-[0_8px_18px_rgba(82,22,22,0.16)] md:inline-flex">
                <span className="mr-2 text-[#b34140]">{currentOffer?.codeLabel || codeLabel}</span>
                <span>{currentOffer?.code || code}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={showNextOffer}
              aria-label="Show next offer"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 text-white transition-colors duration-300 hover:bg-white hover:text-[#b34140] sm:h-14 sm:w-14"
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="border-t border-white/15 px-4 py-3 text-center md:hidden">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white">
              <span className="mr-2 text-white/80">{currentOffer?.codeLabel || codeLabel}</span>
              {currentOffer?.code || code}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeDivisionSttrip;
