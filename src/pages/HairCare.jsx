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
          <Heading level="h1" heading="Hair Care Products" />

          {hairCategory ? (
            <ProductList
              categoryId={hairCategory.id}
              priorityNames={["Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care", "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair", "Ilika Frizz Control Hair Serum", "Ilika Keratin Repair Conditioner"]}
              structuredData={{
                title: "Hair Care Products | Ilika",
                description: "Browse Ilika hair care products with current pricing and offers.",
                path: "/hair/care",
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

export default HairCare
