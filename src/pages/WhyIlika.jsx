import React from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const categoryItems = [
  "Skincare",
  "Haircare",
  "Beauty Devices",
  "Hair Styling Tools",
  "Wellness Accessories",
];

const focusItems = [
  "Easy online shopping",
  "Responsive support",
  "Continuous product improvement",
  "Transparent communication",
];

const qualityItems = [
  "Product reliability",
  "User experience",
  "Everyday practicality",
  "Long-term value",
];

const chooseItems = [
  "Innovative Beauty Solutions",
  "Skincare & Haircare Expertise",
  "Advanced Beauty Devices",
  "Customer-First Approach",
  "Nationwide Delivery",
  "Continuous Innovation",
  "Trusted Online Shopping Experience",
];

const BulletList = ({ items, icon = "dot" }) => (
  <ul className="space-y-2 text-[15px] leading-8 text-[#5b677d] sm:text-base">
    {items.map((item) => (
      <li key={item} className="flex gap-3">
        <span className={`mt-[10px] flex-shrink-0 ${icon === "check" ? "text-[#b24074] text-sm leading-none" : "h-2 w-2 rounded-full bg-[#b24074]"}`}>
          {icon === "check" ? "✔" : ""}
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

const WhyIlika = () => {
  return (
    <>
      <MiniDivider />
      <div className="bg-white">
        <Header />
        <CartDrawer />

        <main className="bg-white">
          <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
            <div className="rounded-[28px] border border-[#ead7d2] bg-[#fffdfc] p-6 shadow-[12px_12px_0_rgba(178,64,116,0.07)] sm:p-10">
              <div className="max-w-4xl">
                <span className="inline-flex rounded-full border border-[#ead7d2] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074]">
                  About Ilika
                </span>
                <div className="mt-4 -ml-4">
                  <Heading heading="Why Ilika" align="left" />
                </div>
                <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">
                  Beauty, Wellness & Innovation You Can Trust
                </p>
                <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">
                  Choosing the right beauty and wellness brand is important. With countless options available, consumers want products that deliver quality, convenience, and value.
                </p>
                <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">
                  At Ilika, we focus on providing innovative beauty and wellness solutions designed for modern lifestyles.
                </p>
              </div>

              <div className="mt-8 grid gap-6">
                <ContentCard title="1. Wide Range of Products">
                  <p>We offer solutions across multiple categories:</p>
                  <BulletList items={categoryItems} />
                  <p>This allows customers to discover products for multiple self-care needs in one place.</p>
                </ContentCard>

                <ContentCard title="2. Innovation-Driven Approach">
                  <p>We continuously explore new trends, technologies, and consumer needs.</p>
                  <p>Our portfolio includes modern beauty devices and innovative self-care solutions designed for home use.</p>
                </ContentCard>

                <ContentCard title="3. Customer-Focused Experience">
                  <p>Customer satisfaction remains at the heart of everything we do.</p>
                  <p>We prioritize:</p>
                  <BulletList items={focusItems} />
                </ContentCard>

                <ContentCard title="4. Quality Products">
                  <p>Every product is carefully selected to meet our quality expectations.</p>
                  <p>We focus on:</p>
                  <BulletList items={qualityItems} />
                </ContentCard>

                <ContentCard title="5. Accessible Beauty Technology">
                  <p>Professional-inspired beauty solutions should not be complicated or inaccessible.</p>
                  <p>We aim to make modern beauty technology available to more consumers through user-friendly products and practical designs.</p>
                </ContentCard>

                <ContentCard title="6. Nationwide Availability">
                  <p>Through Ilika.in, customers across India can access our products and enjoy convenient online shopping.</p>
                </ContentCard>

                <ContentCard title="7. Growing Community of Customers">
                  <p>Thousands of customers trust Ilika for their beauty and wellness needs.</p>
                  <p>Their feedback helps us continuously improve and innovate.</p>
                </ContentCard>

                <ContentCard title="Why Customers Choose Ilika">
                  <BulletList items={chooseItems} icon="check" />
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
                  to="/about/quality-promise"
                  className="inline-flex rounded-full border border-[#ead7d2] bg-[#fff7f5] px-5 py-3 text-sm font-semibold text-[#b24074] transition hover:bg-[#fff1ee]"
                >
                  Next: Quality Promise
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

export default WhyIlika;
