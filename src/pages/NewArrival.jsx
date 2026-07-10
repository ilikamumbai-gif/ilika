import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import Banner from '../components/Banner';
import { findCategoryByKeys, getCategoryId } from "../utils/productDiscovery";

const CATEGORY_KEYS = ["new", "newarrival", "new arrival", "new arrivals"];

const NewArrival = () => {
  const { categories } = useCategories();

  const hairCategory = findCategoryByKeys(categories, CATEGORY_KEYS);

  const holimainbanner = "/Images/offerBanner.gif";
  const holiMobile = "/Images/offerBannerMobile.gif";

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />
        <Banner
          className="mt-0"
          src={holimainbanner}
          mobileSrc={holiMobile}
          bannerKey="new-arrival-top"
          height={420}
        />
       
            <Heading heading="Our New Arrival" />
    

          <ProductList
            categoryId={getCategoryId(hairCategory)}
            categoryKeys={CATEGORY_KEYS}
            priorityNames={[
              "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
              "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
              "Ilika Lip Plumper Vacuum Device | For Fuller Looking Lips | Lip Enhancement, Lip Massage & Beauty Tool",
              "Ilika Blackhead Remover - Hot & Cold | For Deep Pore Cleansing, Blackhead Removal & Skin Tightening",
              "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
            ]}
          />

      

        <Footer />
      </div>
    </>
  )
}

export default NewArrival
