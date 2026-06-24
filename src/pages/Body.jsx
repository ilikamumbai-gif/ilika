import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner'

const Body = () => {
  const { categories } = useCategories();

 const hairCategory = categories.find(
  (c) =>
    c.name
      .toLowerCase()
      .replace(/\s+/g, "") === "bodycare"
);


  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>
        <div className="relative">
          <Banner
            src="/Images/bodycarebanner.png"
            mobileSrc="/Images/bodycarebannermobile.png"
            alt="Body Care Banner"
            imageFit="contain"
            preserveFullImage
          />
          <div className="absolute inset-0 flex items-start justify-end px-4 pt-6 sm:items-center sm:px-10 sm:pt-0 lg:px-20">
            <div className="w-full max-w-[44%] text-right text-[#211816] sm:max-w-[42%] sm:text-left sm:translate-x-[-6%] lg:translate-x-[-10%]">
              <p
                className="text-3xl sm:text-[4.2rem] lg:text-[5rem] font-bold sm:font-semibold leading-[0.95] tracking-[-0.03em]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Softness
                <br />
                That&apos;s All Yours
              </p>
              <div className="ml-auto mt-5 mb-5 h-px w-24 bg-[#a88474] sm:ml-0 sm:mt-6 sm:mb-6 sm:w-32 lg:w-48" />
              <p className="ml-auto max-w-[26rem] text-[11px] sm:text-base lg:text-[1.35rem] font-semibold sm:font-light uppercase tracking-[0.26em] leading-[1.7] text-[#6b4639] sm:ml-0">
                Ilika&apos;s bodycare, made to bring out your skin&apos;s natural best
              </p>
              <h2
                className="mt-4 ml-auto max-w-[26rem] text-sm sm:text-lg lg:text-[1.7rem] leading-[1.55] font-semibold sm:font-normal text-[#3f2b25] sm:ml-0"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Your skin. Ilika&apos;s care.
              </h2>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Body Care Products" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              structuredData={{
                title: "Body Care Products | Ilika",
                description: "Browse Ilika body care products with current pricing and offers.",
                path: "/skin/body",
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

export default Body
