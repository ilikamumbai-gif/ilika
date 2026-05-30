import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'

const Hair = () => {
  const { categories } = useCategories();

  // find hair category from database
  const hairCategory = categories.find(
    (c) => c.name.toLowerCase() === "hair"
  );

  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading level="h1" heading="Hair Products" />

          {hairCategory ? (
            <ProductList categoryId={hairCategory.id}
              priorityNames={["Black Seed Hair Oil | Prevents Premature Graying | Boosts Hair Growth", "Herbal Hair Oil | Prevents Dandruff | Strengthens Hair Roots", "Frizz Control Hair Serum | Control Frizz & Detangle Hair | 50 ML ", "Ilika High-Speed Leafless Hair Dryer For Men & Women", "Ilika Airwrap All in 1 Multi-Styler Tools with Leather Box"]}
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

export default Hair
