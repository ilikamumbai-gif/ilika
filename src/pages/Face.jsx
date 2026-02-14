import { useParams } from "react-router-dom";
import ProductList from "../components/ProductList";
import Heading from "../components/Heading";

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
      <Heading heading={headingMap[category] || "Products"} />
      <ProductList category={category} />
    </>
  );
};

export default Face;
