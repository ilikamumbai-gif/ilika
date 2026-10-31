import React from "react";
import { Link } from "react-router-dom";

export default function BlogMaskMakerOffers({ offers }) {
  const maxPrice = Math.max(1, ...offers.map((offer) => offer.price || 0));
  return (
    <section className="rounded-2xl border border-[#eed9ad] bg-[#fffbf1] p-4 sm:p-6" aria-labelledby="blog-diwali-title">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#946414]">Diwali Dhamaka offers</p>
      <h2 id="blog-diwali-title" className="mt-2 text-xl font-bold text-[#332521]">Your mask maker comes with a free Diwali gift</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.model} className="min-w-0 rounded-xl border border-[#eadfcb] bg-white p-4">
            <Link to={offer.href} className="font-semibold text-[#332521] underline-offset-4 hover:underline">{offer.name}</Link>
            <p className="mt-2 text-2xl font-bold text-[#1d6a4a]">{offer.priceLabel}</p>
            <p className="mt-2 inline-block rounded-lg bg-[#fff0c9] px-2.5 py-2 text-xs font-bold text-[#765018]">{offer.gift}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f3eee3]" aria-hidden="true">
              <div className="h-full rounded-full bg-[#b88c3d]" style={{ width: `${offer.price ? offer.price / maxPrice * 100 : 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-[#786c60]">{offer.available === false ? "Pre-order · check availability" : offer.available ? "In stock" : "Check product availability"}</p>
            <Link to={offer.href} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#765018] underline underline-offset-4">View product &amp; offer →</Link>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#786c60]">Price comparison uses current store prices for the default variants. Final totals and payment discounts appear at checkout.</p>
    </section>
  );
}
