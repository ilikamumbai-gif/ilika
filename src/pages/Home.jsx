import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Banner from "../components/Banner";
import CategoryNav from "../components/CategoryNav";
import Heading from "../components/Heading";
import ProductList from "../components/ProductList";
import { categoriesData, IngredientsData } from "../Dummy/categoriesData";
import Menifesto from "../components/Menifesto";
import TestimonialList from "../components/TestimonialList"
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const Home = () => {
    return (
        <>
            <MiniDivider />


            <div className="relative">
                <Header />
                <CartDrawer />
                <Banner className="h-[95vh] -mt-20" />

                <CategoryNav categories={categoriesData} />

                <Heading heading="HAVE A LOOK !!" />
                <ProductList />

                <Banner className="h-[40vh] mt-0 mb-10" />

                <Heading heading="TOP APPLIANCES" />
                <ProductList />

                <Heading heading="SHOP BY INGREDIENTS" />
                <CategoryNav categories={IngredientsData} />

                <Menifesto />

                <Heading heading="COSTUMER'S STORIES" />
                <TestimonialList />

                <Footer />

            </div>

        </>
    );
};

export default Home;
