import React from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const skincareItems = [
  "Face Masks",
  "Facial Serums",
  "Toners",
  "Moisturizers",
  "Cleansers",
  "Beauty Oils",
  "Skincare Accessories",
];

const haircareItems = [
  "Hair Growth Oils",
  "Hair Serums",
  "Shampoos",
  "Conditioners",
  "Hair Masks",
  "Hair Styling Tools",
];

const beautyDeviceItems = [
  "LED Therapy Devices",
  "High Frequency Therapy Devices",
  "Blackhead Removal Devices",
  "Face Massagers",
  "Facial Cleansing Devices",
  "Mask Maker Machines",
  "Beauty Tools & Accessories",
];

const stylingItems = [
  "Airwrap Multi-Stylers",
  "Hair Dryers",
  "Hair Curlers",
  "Styling Accessories",
];

const trustItems = [
  "Transparent communication",
  "Customer satisfaction",
  "Reliable service",
  "Continuous improvement",
  "Ethical business practices",
];

const CardSection = ({ title, children, className = "" }) => (
  <section
    className={`rounded-[24px] border border-[#ead7d2] bg-white p-6 shadow-[12px_12px_0_rgba(178,64,116,0.07)] sm:p-8 ${className}`}
  >
    <div className="-ml-4 sm:-ml-4">
      <Heading heading={title} align="left" />
    </div>
    <div className="mt-4 space-y-4 text-[15px] leading-8 text-[#5b677d] sm:text-base">
      {children}
    </div>
  </section>
);

const BulletList = ({ items }) => (
  <ul className="space-y-2 text-[15px] leading-8 text-[#5b677d] sm:text-base">
    {items.map((item) => (
      <li key={item} className="flex gap-3">
        <span className="mt-[10px] h-2 w-2 flex-shrink-0 rounded-full bg-[#b24074]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const About = () => {
  return (
    <>
      <MiniDivider />

      <div className="bg-white">
        <Header />
        <CartDrawer />

        <main className="overflow-hidden bg-white">
          <section className="relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 top-10 h-48 w-48 rotate-12 rounded-[32px] border border-[#f2dfda] bg-[#fff7f5]" />
              <div className="absolute right-8 top-20 h-56 w-56 -rotate-12 rounded-[40px] border border-[#f4e6e2] bg-[#fffafb]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
              <div className="mx-auto max-w-4xl text-center">
                <span className="inline-flex rounded-full border border-[#e8d6d1] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074] shadow-[6px_6px_0_rgba(178,64,116,0.08)]">
                  About Us – Ilika
                </span>
                <div className="mt-4">
                  <Heading
                    heading="Discover the Future of Beauty, Wellness & Self-Care"
                    sub="About Us – Ilika"
                    subVariant="label"
                  />
                </div>
                <p className="mx-auto mt-4 max-w-3xl text-[16px] leading-8 text-[#5b677d] sm:text-lg">
                  At Ilika, we believe beauty and wellness should be accessible, innovative, and empowering. Our mission is to bring advanced skincare, haircare, beauty devices, and wellness solutions to modern consumers seeking effective products that fit seamlessly into their everyday lives.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[20px] border border-[#ecd8d3] bg-[#fffdfc] p-5 text-center shadow-[8px_8px_0_rgba(178,64,116,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074]">Innovation</p>
                  <p className="mt-2 text-sm leading-7 text-[#5b677d]">Science, technology, and self-care brought together for everyday beauty routines.</p>
                </div>
                <div className="rounded-[20px] border border-[#ecd8d3] bg-[#fffdfc] p-5 text-center shadow-[8px_8px_0_rgba(178,64,116,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074]">Accessibility</p>
                  <p className="mt-2 text-sm leading-7 text-[#5b677d]">Beauty and wellness solutions designed to fit modern lifestyles across India.</p>
                </div>
                <div className="rounded-[20px] border border-[#ecd8d3] bg-[#fffdfc] p-5 text-center shadow-[8px_8px_0_rgba(178,64,116,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b24074]">Trust</p>
                  <p className="mt-2 text-sm leading-7 text-[#5b677d]">A growing customer base built on quality, reliability, and customer-first thinking.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
            <div className="grid gap-6">
              <CardSection title="About Us – Ilika">
                <p>Discover the Future of Beauty, Wellness & Self-Care</p>
                <p>At Ilika, we believe beauty and wellness should be accessible, innovative, and empowering. Our mission is to bring advanced skincare, haircare, beauty devices, and wellness solutions to modern consumers seeking effective products that fit seamlessly into their everyday lives.</p>
                <p>Founded with a vision to combine science, technology, and self-care, Ilika has evolved into a trusted destination for beauty enthusiasts, wellness seekers, and individuals looking to enhance their personal care routines through high-quality products and innovative beauty technology.</p>
                <p>Today, Ilika offers a carefully curated range of skincare products, haircare solutions, beauty devices, wellness accessories, and personal care essentials designed to support confidence, self-expression, and healthy lifestyles.</p>
              </CardSection>

              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <CardSection title="Our Story">
                  <p>The beauty industry is constantly evolving, and consumers are increasingly seeking products that deliver convenience, quality, and innovation. Recognizing this need, Ilika was created to bridge the gap between professional beauty solutions and everyday self-care.</p>
                  <p>From skincare formulations inspired by modern beauty trends to advanced beauty devices designed for home use, every Ilika product is selected with one goal in mind — helping customers achieve better beauty and wellness experiences without complexity.</p>
                  <p>As consumer expectations continue to evolve, we remain committed to offering products that combine functionality, convenience, and value.</p>
                </CardSection>

                <div className="grid gap-6">
                  <CardSection title="Our Vision" className="h-full">
                    <p>To become one of India's most trusted beauty and wellness brands by delivering innovative products that empower individuals to look and feel their best every day.</p>
                  </CardSection>
                  <CardSection title="Our Mission" className="h-full">
                    <p>Our mission is simple:</p>
                    <BulletList
                      items={[
                        "Deliver innovative beauty and wellness solutions",
                        "Make self-care accessible and convenient",
                        "Provide quality products at affordable prices",
                        "Continuously improve through customer feedback and innovation",
                        "Build long-term trust with our customers",
                      ]}
                    />
                  </CardSection>
                </div>
              </div>

              <CardSection title="What We Offer">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-[#efe0db] bg-[#fff9f8] p-5 shadow-[6px_6px_0_rgba(178,64,116,0.05)] sm:p-6">
                    <h3 className="font-luxury text-[24px] text-[#231815]">Skincare Products</h3>
                    <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">Our skincare range is designed to support daily skincare routines and includes:</p>
                    <div className="mt-4">
                      <BulletList items={skincareItems} />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#efe0db] bg-[#fff9f8] p-5 shadow-[6px_6px_0_rgba(178,64,116,0.05)] sm:p-6">
                    <h3 className="font-luxury text-[24px] text-[#231815]">Haircare Solutions</h3>
                    <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">We offer products designed to support healthy-looking hair and everyday haircare routines, including:</p>
                    <div className="mt-4">
                      <BulletList items={haircareItems} />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#efe0db] bg-[#fff9f8] p-5 shadow-[6px_6px_0_rgba(178,64,116,0.05)] sm:p-6">
                    <h3 className="font-luxury text-[24px] text-[#231815]">Beauty Devices</h3>
                    <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">Beauty technology is one of the fastest-growing segments in personal care.</p>
                    <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">Our range includes:</p>
                    <div className="mt-4">
                      <BulletList items={beautyDeviceItems} />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#efe0db] bg-[#fff9f8] p-5 shadow-[6px_6px_0_rgba(178,64,116,0.05)] sm:p-6">
                    <h3 className="font-luxury text-[24px] text-[#231815]">Hair Styling Technology</h3>
                    <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">Our styling collection includes innovative tools designed for convenience and performance:</p>
                    <div className="mt-4">
                      <BulletList items={stylingItems} />
                    </div>
                  </div>
                </div>
              </CardSection>

              <div className="grid gap-6 lg:grid-cols-2">
                <CardSection title="Customer-Centric Approach">
                  <p>Everything we do begins with our customers.</p>
                  <p>We actively listen to customer feedback and continuously improve our product offerings, user experience, and support services.</p>
                  <p>Our goal is not simply to sell products but to help customers build effective beauty and wellness routines that fit their lifestyles.</p>
                </CardSection>

                <CardSection title="Innovation Meets Everyday Convenience">
                  <p>At Ilika, we recognize that modern consumers want solutions that are both effective and convenient.</p>
                  <p>That's why we focus on products that:</p>
                  <BulletList
                    items={[
                      "Simplify beauty routines",
                      "Support self-care goals",
                      "Offer user-friendly experiences",
                      "Integrate into daily lifestyles",
                    ]}
                  />
                  <p>By embracing innovation, we help make professional-inspired beauty and wellness experiences more accessible at home.</p>
                </CardSection>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <CardSection title="Serving Customers Across India">
                  <p>Ilika proudly serves customers across India through our online platform, making beauty and wellness products accessible nationwide.</p>
                  <p>Our growing customer base reflects our commitment to quality, reliability, and customer satisfaction.</p>
                </CardSection>

                <CardSection title="Our Commitment to Trust">
                  <p>Trust is the foundation of every successful brand.</p>
                  <p>We are committed to:</p>
                  <BulletList items={trustItems} />
                  <p>We believe long-term relationships are built through consistency, honesty, and customer-first thinking.</p>
                </CardSection>
              </div>

              <CardSection title="Looking Ahead">
                <p>As beauty technology and wellness innovation continue to evolve, Ilika remains committed to bringing exciting new products and solutions to our customers.</p>
                <p>Our journey is driven by a passion for innovation, self-care, and helping people feel confident in their everyday lives.</p>
                <p>We look forward to continuing to serve our customers and becoming a trusted companion in their beauty and wellness journey.</p>
              </CardSection>

              <section className="rounded-[24px] border border-[#ead7d2] bg-[#fffaf8] p-6 shadow-[10px_10px_0_rgba(178,64,116,0.06)] sm:p-8">
                <div className="-ml-4">
                  <Heading heading="Explore More" align="left" />
                </div>
                <p className="mt-3 text-[15px] leading-8 text-[#5b677d] sm:text-base">
                  Continue exploring what shapes Ilika through these pages:
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Link
                    to="/about/why-ilika"
                    className="group rounded-[20px] border border-[#ead7d2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(178,64,116,0.08)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b24074]">About Route</p>
                    <h3 className="mt-3 font-luxury text-[24px] text-[#231815]">Why Ilika</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5b677d]">Understand the thinking and purpose behind the Ilika brand.</p>
                  </Link>
                  <Link
                    to="/about/quality-promise"
                    className="group rounded-[20px] border border-[#ead7d2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(178,64,116,0.08)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b24074]">About Route</p>
                    <h3 className="mt-3 font-luxury text-[24px] text-[#231815]">Quality Promise</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5b677d]">See how we think about reliability, trust, and customer experience.</p>
                  </Link>
                  <Link
                    to="/about/ingredient-philosophy"
                    className="group rounded-[20px] border border-[#ead7d2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(178,64,116,0.08)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b24074]">About Route</p>
                    <h3 className="mt-3 font-luxury text-[24px] text-[#231815]">Ingredient Philosophy</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5b677d]">Explore the thinking behind our beauty and wellness approach.</p>
                  </Link>
                </div>
              </section>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
