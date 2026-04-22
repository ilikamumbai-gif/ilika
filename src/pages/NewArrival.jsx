import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner';

const NewArrival = () => {
  const { categories } = useCategories();

  const hairCategory = categories.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/\s+/g, "") === "new"
  );

  const holimainbanner = "/Images/offerBanner.gif";
  const holiMobile = "/Images/offerBannerMobile.gif";

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />
        <Banner
          className="mt-0 mb-10"
          src={holimainbanner}
          mobileSrc={holiMobile}
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">



          <Heading heading="Our New Arrival" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              priorityNames={["Lip Plumper Vacuum Suction Device | Soft Silicone Material", "Hot & Cold Facial Pore Blackhead Remover For Men & Women", "Ilika Automatic Voice Version Face Mask Maker Machine", "Ilika High-Speed Leafless Hair Dryer For Men & Women"]}
            />
          ) : (
            <p className="text-sm text-gray-500">Loading products...</p>
          )}

        </section>

        <Footer />
      </div>
    </>
  )
}

export default NewArrival
