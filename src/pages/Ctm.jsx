import React from 'react'
import ProductList from '../components/ProductList'   // ✅ added
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import CtmCard from '../components/CtmCard'
import kit from "../assets/Products/Product2.png"
import { Link } from 'react-router-dom'

const Ctm = () => {
  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Explore Out Beauty Kit" />

          <Link to="/ctmkit" className="block my-6">
            <div className="rounded-3xl bg-gradient-to-r from-[#ffe7e5] to-[#fff5ef] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-lg transition">

              {/* TEXT */}
              <div className="text-center sm:text-left space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#1C371C]">
                  Build Your Own CTM Routine
                </h2>

                <p className="text-gray-600 text-sm sm:text-base max-w-md">
                  Choose a cleanser, toner and moisturizer based on your skin type and create a personalized skincare kit at a special price.
                </p>

                <span className="inline-block mt-2 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium">
                  Create My Kit →
                </span>
              </div>

              {/* IMAGE */}
              <div className="w-40 sm:w-52">
                <img
                  src={kit}
                  alt="CTM Kit"
                  className="w-full object-contain"
                />
              </div>

            </div>
          </Link>

          <CtmCard />
        </section>

        <Footer />
      </div>
    </>
  )
}

export default Ctm
