import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner'

const Face = () => {
  const { categories } = useCategories();

 const hairCategory = categories.find(
  (c) =>
    c.name
      .toLowerCase()
      .replace(/\s+/g, "") === "facecare"
);


  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>
        <div className="relative">
          <Banner
            src="/Images/skinbanner.png"
            mobileSrc="/Images/skinbannermobile.png"
            alt="Face Care Banner"
            imageFit="contain"
            preserveFullImage
          />
          <div className="absolute inset-0 px-9 pt-14 sm:flex sm:items-center sm:justify-end sm:px-10 sm:pt-0 lg:px-20">
            <div className="w-full max-w-[48%] text-left text-white sm:max-w-[44%] sm:text-[#211816] sm:translate-x-[-6%] lg:translate-x-[-10%]">
              <p
                className="text-[2.1rem] sm:text-[4.2rem] lg:text-[5rem] font-bold sm:font-semibold leading-[0.95] tracking-[-0.03em]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Your Skin,
                <br />
                Our Priority
              </p>
              <div className="mt-3 mb-3 h-px w-20 bg-white sm:mt-6 sm:mb-6 sm:w-32 sm:bg-[#a88474] lg:w-48" />
              <p className="hidden sm:block text-[11px] sm:text-base lg:text-[1.55rem] font-semibold sm:font-light uppercase tracking-[0.32em] text-white sm:text-[#6b4639]">
                Made for Your Skin
              </p>
              <h2
                className="hidden sm:block mt-4 max-w-[28rem] text-sm sm:text-lg lg:text-[1.7rem] leading-[1.55] font-semibold sm:font-normal text-white sm:text-[#3f2b25]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Ilika&apos;s facecare essentials, crafted with love
              </h2>
            </div>
            <div className="absolute bottom-4 right-4 max-w-[48%] text-left text-white sm:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">
                Made for Your Skin
              </p>
              <p
                className="mt-2 text-[0.95rem] leading-[1.35] font-semibold"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Ilika&apos;s facecare essentials, crafted with love
              </p>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Face Care Products" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              structuredData={{
                title: "Face Care Products | Ilika",
                description: "Browse Ilika face care products with current pricing and offers.",
                path: "/skin/face",
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

export default Face
