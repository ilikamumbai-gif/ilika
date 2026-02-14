import { BrowserRouter } from "react-router-dom";
import NavRoutes from "./Routes/NavRoutes";
import { CartProvider } from "./context/CartProvider";

const App = () => {
  return (
 
      <CartProvider>
        <NavRoutes />
      </CartProvider>
    
  );
};

export default App;
