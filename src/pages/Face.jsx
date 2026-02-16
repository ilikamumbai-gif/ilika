import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import Heading from "../components/Heading";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const Face = () => {
  const { category } = useParams();

  const headingMap = {
    face: "Face Care",
    body: "Body Care",
    care: "Hair Care",
    styling: "Hair Styling",
    roller: "Roller",
    remover: "Remover",
  };

  return (
    <>
      <MiniDivider />

      {/* ✅ ADDED WRAPPER */}
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        {/* ✅ ADDED SECTION STRUCTURE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <Heading heading={headingMap[category] || "Products"} />
          <ProductList category={category} />
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Face;
