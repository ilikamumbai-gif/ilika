import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner'


const FaceGrooming = () => {
  const { categories } = useCategories();

 const hairCategory = categories.find(
  (c) =>
    c.name
      .toLowerCase()
      .replace(/\s+/g, "") === "facegrooming"
);


  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>
        <div className="relative">
          <Banner
            src="/Images/facegrooming.png"
            mobileSrc="/Images/facegroomingmobile.png"
            alt="Face Grooming Banner"
            imageFit="contain"
            preserveFullImage
          />
          <div className="absolute inset-0 px-4 pt-4 sm:flex sm:items-center sm:justify-end sm:px-10 sm:pt-0 lg:px-20">
            <div className="hidden sm:block w-full max-w-[42%] text-left text-[#211816] translate-x-[-6%] lg:translate-x-[-10%]">
              <p
                className="text-3xl sm:text-[4.2rem] lg:text-[5rem] font-semibold leading-[0.95] tracking-[-0.03em]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Made for
                <br />
                Your Routine
              </p>
              <div className="mt-5 mb-5 h-px w-24 bg-[#a88474] sm:mt-6 sm:mb-6 sm:w-32 lg:w-48" />
              <p className="max-w-[24rem] text-[11px] sm:text-base lg:text-[1.35rem] font-light uppercase tracking-[0.26em] leading-[1.7] text-[#6b4639]">
                Ilika&apos;s grooming essentials, crafted with precision
              </p>
              <h2
                className="mt-4 max-w-[26rem] text-sm sm:text-lg lg:text-[1.7rem] leading-[1.55] font-normal text-[#3f2b25]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Your grooming, our priority
              </h2>
            </div>
            <div className="absolute bottom-4 left-4 max-w-[48%] text-left text-white sm:hidden">
              <p
                className="text-[2rem] font-bold leading-[0.95] tracking-[-0.03em] text-black"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Made for
                <br />
                Your Routine
              </p>
              <div className="mt-3 mb-3 h-px w-20 bg-white" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-[1.55]">
                Ilika&apos;s grooming essentials, crafted with precision
              </p>
              <p
                className="mt-2 text-[0.95rem] leading-[1.35] font-semibold"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Your grooming, our priority
              </p>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Face Grooming Products" />

          {hairCategory ? (
            <ProductList categoryId={hairCategory.id} />
          ) : (
            <p className="text-sm text-gray-500">Loading products...</p>
          )}

        </section>

        <Footer/>
      </div>
    </>
  )
}

export default FaceGrooming
