import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'
import { findCategoryByKeys, getCategoryId } from "../utils/productDiscovery";

const CATEGORY_KEYS = ["skincare", "skin care", "skin"];

const Skin = () => {
  const { categories } = useCategories();

  const hairCategory = findCategoryByKeys(categories, CATEGORY_KEYS);

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Skin Care Products" />

          <ProductList
            categoryId={getCategoryId(hairCategory)}
            categoryKeys={CATEGORY_KEYS}
            structuredData={{
              title: "Skin Care Products | Ilika",
              description: "Browse Ilika skin care products with current pricing and offers.",
              path: "/skin",
            }}
          />

        </section>

        <Footer />
      </div>
    </>
  )
}

export default Skin
