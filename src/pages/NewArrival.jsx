import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import Heading from "../components/Heading";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const NewArrival = () => {


  return (
    <>
   <MiniDivider />
      <div className='primary-bg-color'>
        <Header />
         <CartDrawer/>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading="Our New Arrivals" />
            <ProductList/>
        </section>
        <Footer/>
      </div>
    </>
  );
};

export default NewArrival;