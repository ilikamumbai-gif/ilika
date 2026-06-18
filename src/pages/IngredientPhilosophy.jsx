import React from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const scienceItems = [
  "Hyaluronic Acid",
  "Collagen-Based Ingredients",
  "Botanical Extracts",
  "Plant Oils",
  "Moisturizing Agents",
  "Skin Conditioning Ingredients",
];

const balanceItems = [
  "Botanical Ingredients",
  "Beauty Oils",
  "Modern Formulations",
  "Advanced Skincare Technologies",
];

const experienceItems = [
  "Texture",
  "Absorption",
  "Ease of Use",
  "Daily Practicality",
  "Overall User Experience",
];

const principleItems = [
  "Transparency",
  "Quality Selection",
  "Modern Skincare Innovation",
  "Customer Education",
  "Continuous Improvement",
  "Everyday Practicality",
];

const BulletList = ({ items, icon = "dot" }) => (
  <ul className="space-y-2 text-[15px] leading-8 text-[#5b677d] sm:text-base">
    {items.map((item) => (
      <li key={item} className="flex gap-3">
        <span className={`mt-[10px] flex-shrink-0 ${icon === "check" ? "text-[#b24074] text-sm leading-none" : "h-2 w-2 rounded-full bg-[#b24074]"}`}>
          {icon === "check" ? "✔️" : ""}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const ContentCard = ({ title, children }) => (
  <div className="rounded-[22px] border border-[#efe0db] bg-white p-5 shadow-[6px_6px_0_rgba(178,64,116,0.05)] sm:p-6">
    <h2 className="font-luxury text-[24px] text-[#231815] sm:text-[28px]">{title}</h2>
    <div className="mt-3 space-y-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">
      {children}
    </div>
  </div>
);

const IngredientPhilosophy = () => {
  return (
    <>
      <MiniDivider />
      <div className="bg-white">
        <Header />
        <CartDrawer />

        <main className="bg-white">
          <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
            <div className="rounded-[28px] border border-[#ead7d2] bg-[#fffdfc] p-6 shadow-[12px_12px_0_rgba(178,64,116,0.07)] sm:p-10">
              <span className="inline-flex rounded-full border border-[#ead7d2] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074]">
                About Ilika
              </span>
              <div className="mt-4 -ml-4">
                <Heading heading="Ingredient Philosophy" align="left" />
              </div>

              <div className="mt-4 grid gap-6">
                <ContentCard title="Thoughtfully Selected Ingredients for Everyday Skincare">
                  <p>At Ilika, we believe skincare begins with understanding what goes into the products you use every day.</p>
                  <p>Our ingredient philosophy is centered around selecting ingredients that align with modern skincare preferences while supporting effective beauty routines.</p>
                </ContentCard>

                <ContentCard title="Transparency Matters">
                  <p>We believe customers deserve clear and accessible information about the products they use.</p>
                  <p>That's why we strive to provide detailed product descriptions, ingredient information, and usage guidance whenever applicable.</p>
                </ContentCard>

                <ContentCard title="Inspired by Modern Skincare Science">
                  <p>The skincare industry continues to evolve with advances in ingredient research and formulation innovation.</p>
                  <p>Our skincare collection incorporates ingredients commonly used in modern beauty routines, including:</p>
                  <BulletList items={scienceItems} />
                </ContentCard>

                <ContentCard title="Balancing Nature & Innovation">
                  <p>We appreciate both traditional beauty practices and modern skincare innovation.</p>
                  <p>Our product portfolio reflects this balance through a combination of:</p>
                  <BulletList items={balanceItems} />
                </ContentCard>

                <ContentCard title="Focus on User Experience">
                  <p>Beyond ingredients themselves, we consider:</p>
                  <BulletList items={experienceItems} />
                  <p>Our goal is to create products that fit naturally into everyday skincare routines.</p>
                </ContentCard>

                <ContentCard title="Continuous Learning & Improvement">
                  <p>The beauty industry evolves rapidly, and so do customer expectations.</p>
                  <p>We continuously evaluate emerging trends, ingredient innovations, and customer feedback to improve our offerings.</p>
                </ContentCard>

                <ContentCard title="Our Ingredient Principles">
                  <BulletList items={principleItems} icon="check" />
                </ContentCard>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/about"
                  className="inline-flex rounded-full border border-[#231815] px-5 py-3 text-sm font-semibold text-[#231815] transition hover:bg-[#231815] hover:text-white"
                >
                  Back to About Us
                </Link>
                <Link
                  to="/about/why-ilika"
                  className="inline-flex rounded-full border border-[#ead7d2] bg-[#fff7f5] px-5 py-3 text-sm font-semibold text-[#b24074] transition hover:bg-[#fff1ee]"
                >
                  Explore Why Ilika
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default IngredientPhilosophy;
