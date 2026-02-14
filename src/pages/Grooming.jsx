import React from 'react'
import ProductList from '../components/ProductList'
import MiniDivider from '../components/MiniDivider'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'

const Grooming = () => {
  return (
    <>

      <MiniDivider />
      <div>
        <Header />
         <CartDrawer/>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Grooming Appliances" />
            <ProductList/>
        </section>
        <Footer/>
      </div>


    </>
  )
}

export default Grooming