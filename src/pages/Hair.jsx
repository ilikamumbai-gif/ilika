import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import { findCategoryByKeys, getCategoryId } from "../utils/productDiscovery";

const CATEGORY_KEYS = ["hair", "haircare", "hair care", "hairstyling", "hair styling"];

const Hair = () => {
  const { categories } = useCategories();

  const hairCategory = findCategoryByKeys(categories, CATEGORY_KEYS);

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Hair Products" />

          <ProductList
            categoryId={getCategoryId(hairCategory)}
            categoryKeys={CATEGORY_KEYS}
            priorityNames={["Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care", "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair", "Ilika Frizz Control Hair Serum", "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control", "Ilika Airwrap Multi-Styler Kit | 5-in-1 Hair Styling Tool for Curling, Straightening, Volumizing & Drying"]}
            structuredData={{
              title: "Hair Products | Ilika",
              description: "Browse Ilika hair products with current pricing and offers.",
              path: "/hair",
            }}
          />

        </section>

        <Footer />
      </div>
    </>
  )
}

export default Hair
