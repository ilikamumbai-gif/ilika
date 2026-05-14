import React from 'react'
import { useCategories } from "../admin/context/CategoryContext";

import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'

const HairCare = () => {
  const { categories } = useCategories();

 const hairCategory = categories.find(
  (c) =>
    c.name
      .toLowerCase()
      .replace(/\s+/g, "") === "haircare"
);


  return (
    <>
      <MiniDivider />

      <div className='primary-bg-color'>
        <Header />
        <CartDrawer/>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Hair Care Products" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
               priorityNames={["Black Seed Hair Oil | Prevents Premature Graying | Boosts Hair Growth", "Herbal Hair Oil | Prevents Dandruff | Strengthens Hair Roots", "Frizz Control Hair Serum | Control Frizz & Detangle Hair | 50 ML ", "Keratin Rich Conditioner | For Normal to Damaged Hair | 200 ML"]}
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

export default HairCare
