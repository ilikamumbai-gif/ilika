import { useProducts } from "../context/ProductContext";
import ProductCard from "./ProductCard";

const ProductList = ({ categoryId }) => {
  const { products } = useProducts();

  const filteredProducts = categoryId
    ? products.filter((item) =>
        item.categoryIds?.includes(categoryId)
      )
    : products;


  console.log(filteredProducts)




  return (
    <section className="w-full py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length ? (
            filteredProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))
          ) : (
            <p className="col-span-full text-sm text-gray-500">
              No products found
            </p>
          )}
        </div>

      </div>
    </section>
  );
};

export default ProductList;
