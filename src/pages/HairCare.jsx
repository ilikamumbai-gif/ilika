import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner'

const HairCare = () => {
  const { categories } = useCategories();

 const hairCategory = categories.find(
  (c) =>
    c.name
      .toLowerCase()
      .replace(/\s+/g, "") === "haircare"
);


  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>
        <div className="relative">
          <Banner
            src="/Images/haircarebanner.png"
            mobileSrc="/Images/haircarebannermobile.png"
            alt="Hair Care Banner"
            imageFit="contain"
            preserveFullImage
          />
          <div className="absolute inset-0 px-4 pt-4 sm:flex sm:items-center sm:justify-center sm:px-10 sm:pt-0 lg:px-20">
            <div className="w-full max-w-[30%] text-left text-[#211816] sm:max-w-[38%] sm:translate-x-[-38%] lg:translate-x-[-46%]">
              <p
                className="text-3xl font-bold sm:text-[4.2rem] lg:text-[5rem] sm:font-semibold leading-[0.95] tracking-[-0.03em]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Your Hair,
                <br />
                Our Ritual
              </p>
              <div className="mt-5 mb-5 h-px w-24 bg-[#a88474] sm:mt-6 sm:mb-6 sm:w-32 lg:w-48" />
              <p className="hidden sm:block max-w-[24rem] text-[11px] sm:text-base lg:text-[1.35rem] font-light uppercase tracking-[0.26em] leading-[1.7] text-[#6b4639]">
                Discover Ilika&apos;s haircare collection, crafted with care
              </p>
              <h2
                className="hidden sm:block mt-4 max-w-[28rem] text-sm sm:text-lg lg:text-[1.7rem] leading-[1.55] font-normal text-[#3f2b25]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Because your hair deserves Ilika&apos;s best
              </h2>
            </div>
            <div className="absolute bottom-10 right-4 max-w-[48%] text-right text-white sm:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-[1.55]">
                Discover Ilika&apos;s haircare collection, crafted with care
              </p>
              <p
                className="mt-2 text-[0.95rem] leading-[1.35] font-semibold"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Because your hair deserves Ilika&apos;s best
              </p>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Hair Care Products" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              priorityNames={["Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care", "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair", "Ilika Frizz Control Hair Serum", "Ilika Keratin Repair Conditioner"]}
              structuredData={{
                title: "Hair Care Products | Ilika",
                description: "Browse Ilika hair care products with current pricing and offers.",
                path: "/hair/care",
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">Loading products...</p>
          )}

        </section>

        <Footer/>
      </div>
    </>
  )
}

export default HairCare
