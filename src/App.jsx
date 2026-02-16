import NavRoutes from "./Routes/NavRoutes";
import { CartProvider } from "./context/CartProvider";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { UserOrderProvider } from "./context/UserOrderContext";
import { OrderProvider } from "./admin/context/OrderContext";
import { UserProvider } from "./admin/context/UserContext";

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <UserProvider>
        <OrderProvider>
          <CartProvider>
            <UserOrderProvider>
              <NavRoutes />
              <ScrollToTopButton />
            </UserOrderProvider>
          </CartProvider>
        </OrderProvider>
      </UserProvider>
    </div>
  );
};

export default App;
