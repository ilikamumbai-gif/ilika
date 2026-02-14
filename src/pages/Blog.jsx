import React from 'react'
import BlogCard from '../components/BlogCard'
import BlogData from "../Dummy/BlogData"
import Header from '../components/Header'
import MiniDivider from '../components/MiniDivider'
import Footer from '../components/Footer'
import Heading from '../components/Heading'
import CartDrawer from '../components/CartDrawer'

const Blog = () => {
  return (
    <>
      <MiniDivider />
      <Header />
       <CartDrawer/>
      <Heading heading="Our Blogs" />

      <div className=" space-y-6 text-sm sm:text-base leading-relaxed content-text">

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {BlogData.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>

      </div>
      <Footer />

    </>
  )
}

export default Blog