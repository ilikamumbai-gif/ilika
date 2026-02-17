import NavRoutes from "./Routes/NavRoutes";
import { CartProvider } from "./context/CartProvider";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { UserOrderProvider } from "./context/UserOrderContext";
import { OrderProvider } from "./admin/context/OrderContext";
import { UserProvider } from "./admin/context/UserContext";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <UserProvider>
        <OrderProvider>
          <CartProvider>
            <CategoryProvider>

            <ProductProvider>

            <UserOrderProvider>
              <NavRoutes />
              <ScrollToTopButton />
            </UserOrderProvider>
            </ProductProvider>
            </CategoryProvider>
          </CartProvider>
        </OrderProvider>
      </UserProvider>
    </div>
  );
};

export default App;
