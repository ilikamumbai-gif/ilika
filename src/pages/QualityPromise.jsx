import React from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const productSelectionItems = [
  "Quality",
  "Functionality",
  "User Experience",
  "Design",
  "Customer Value",
];

const satisfactionItems = [
  "Provide accurate product information",
  "Deliver responsive support",
  "Continuously improve based on feedback",
  "Maintain transparency in communication",
];

const shoppingItems = [
  "Secure transactions",
  "Clear product information",
  "Transparent policies",
  "Responsive customer service",
];

const commitmentItems = [
  "Carefully Selected Products",
  "Customer-Centric Approach",
  "Continuous Product Improvement",
  "Reliable Service",
  "Transparent Communication",
  "Commitment to Excellence",
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

const QualityPromise = () => {
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
                <Heading heading="Quality Promise" align="left" />
              </div>

              <div className="mt-4 grid gap-6">
                <ContentCard title="Our Commitment to Quality">
                  <p>At Ilika, quality is more than a standard — it is a commitment.</p>
                  <p>Every product we offer is selected with the goal of providing a positive user experience, reliable performance, and customer satisfaction.</p>
                </ContentCard>

                <ContentCard title="Product Selection Standards">
                  <p>Before products are added to our collection, they undergo careful evaluation based on:</p>
                  <BulletList items={productSelectionItems} />
                </ContentCard>

                <ContentCard title="Continuous Improvement">
                  <p>We actively monitor customer feedback and market trends to improve our product offerings and service experience.</p>
                  <p>Continuous improvement allows us to evolve alongside customer expectations.</p>
                </ContentCard>

                <ContentCard title="Customer Satisfaction First">
                  <p>Our customers are our most important quality benchmark.</p>
                  <p>We strive to:</p>
                  <BulletList items={satisfactionItems} />
                </ContentCard>

                <ContentCard title="Reliable Shopping Experience">
                  <p>We are committed to creating a safe and reliable online shopping environment through:</p>
                  <BulletList items={shoppingItems} />
                </ContentCard>

                <ContentCard title="Our Quality Commitment">
                  <BulletList items={commitmentItems} icon="check" />
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
                  to="/about/ingredient-philosophy"
                  className="inline-flex rounded-full border border-[#ead7d2] bg-[#fff7f5] px-5 py-3 text-sm font-semibold text-[#b24074] transition hover:bg-[#fff1ee]"
                >
                  Next: Ingredient Philosophy
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

export default QualityPromise;
