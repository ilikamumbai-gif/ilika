import { getCollagenPeptideOffer } from "../../Backend/services/productOffers.js";

export default function CollagenBogoOffer({ product, quantity = 1, applied = false, savedOffer = null }) {
  const offer = savedOffer || getCollagenPeptideOffer(product, quantity);
  if (!offer) return null;

  return (
    <div className="my-3 rounded-xl border border-[#ebc9c9] bg-[#fff4f4] px-4 py-3 text-[#842323]">
      <p className="text-sm font-bold">{offer.label}{applied ? " applied" : ""}</p>
      <p className="mt-1 text-xs leading-5">
        {applied
          ? `${offer.freeQuantity} paid + ${offer.freeQuantity} FREE packs. You receive ${offer.freeQuantity * 2} packs.`
          : "Buy one collagen peptide pack and get another identical pack FREE. Automatically included in your cart."}
      </p>
      {applied && <p className="mt-1 text-xs font-semibold">Free pack total: ₹0</p>}
    </div>
  );
}
