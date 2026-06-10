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
          bannerKey="new-arrival-top"
        />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">



          <Heading level="h1" heading="Our New Arrival" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              priorityNames={[
                "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
                "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
                "Ilika Lip Plumper Vacuum Device | For Fuller Looking Lips | Lip Enhancement, Lip Massage & Beauty Tool",
                "Ilika Blackhead Remover - Hot & Cold | For Deep Pore Cleansing, Blackhead Removal & Skin Tightening",
                "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
              ]}
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
