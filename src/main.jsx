import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./main.css";

import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import ScrollToTop from "./components/ScrollToTop";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ProductProvider>
        <ScrollToTop />
        <App />
      </ProductProvider>
    </AuthProvider>
  </BrowserRouter>
);
