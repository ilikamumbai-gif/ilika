import PromoCard from "./PromoCard";

/* ─────────────────────────────────────────────────────────────────
   Image slots — replace the SVG placeholders with your actual <img>
   tags once you have real assets, e.g.:
     const BottleImg = () => <img src="/images/bottle.png" className="w-full h-full object-cover" alt="" />
───────────────────────────────────────────────────────────────── */

/** Card 1 — amber glass bottle on green leaves (circular crop) */
const BottleImg = () => (
  <img src="/images/Bodhhy.png" alt="" className="w-full h-full object-cover" />
);

/** Card 2 — golden piggy bank with coin slot */
const PiggyBankImg = () => (
  <img src="/images/offer.png" alt="" className="w-full h-full object-contain" />
);

/** Card 3 — cluster of dark reagent bottles */
const LabBottlesImg = () => (
  <img src="/images/lab.png" alt="" className="w-full h-full object-contain" />
);

/** Card 4 — AAW™ automation workstation machine */
const MachineImg = () => (
  <img src="/images/machine.png" alt="" className="w-full h-full object-contain" />
);

/* ─────────────────────────────────────────────────────────────────
   Grid layout (mirrors the reference exactly):

   ┌────────────────────────┬──────────────┐
   │  Card 1  (col 1–2)     │  Card 2      │  row 1  →  260 px
   ├──────────────┬─────────┴──────────────┤
   │  Card 3      │  Card 4  (col 2–3)     │  row 2  →  260 px
   └──────────────┴────────────────────────┘
───────────────────────────────────────────────────────────────── */
export default function PromoCardGrid() {
  return (
    <div
      className="p-4 md:p-10"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "260px 260px",
        gap: 16,
      }}
    >

      {/* ── Card 1: large yellow — HPLC Solvents ── */}
      <div style={{ gridColumn: "1 / 3", gridRow: "1" }}>
        <PromoCard
          title="The Title"
          subtitle="the subtitle"
          buttonText="Explore"
          imageSlot={<BottleImg />}
          link="/solvents"
          variant="yellow-green"
          size="large"
          brandName="ilika."
        />
      </div>

      {/* ── Card 2: small teal-purple — Offers & Discounts ── */}
      <div style={{ gridColumn: "3 / 4", gridRow: "1" }}>
        <PromoCard
          title="The Title"
          subtitle="the subtitle"
          buttonText="Explore"
          imageSlot={<PiggyBankImg />}
          link="/offers"
          variant="teal-purple"
          size="small"
        />
      </div>

      {/* ── Card 3: small yellow — Made in India NMR Solvents ── */}
      <div style={{ gridColumn: "1 / 2", gridRow: "2" }}>
        <PromoCard
          title="The Title"
          subtitle="the subtitle"
          buttonText="Explore"
          imageSlot={<LabBottlesImg />}
          link="/products"
          variant="yellow-small"
          size="small"
        />
      </div>

      {/* ── Card 4: medium pink-blue — AAWmazing Automation ── */}
      <div style={{ gridColumn: "2 / 4", gridRow: "2" }}>
        <PromoCard
         title="The Title"
          subtitle="the subtitle"
          buttonText="Explore"
          imageSlot={<MachineImg />}
          link="/automation"
          variant="pink-blue"
          size="medium"
          brandName="ilika."
        />
      </div>

    </div>
  );
}