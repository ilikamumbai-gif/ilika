import React from "react";
import { Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import MaskDuoOffer from "../components/MaskDuoOffer";
import { useSeo } from "../hooks/useSeo";

const pageImage = "/Images/Tonner.webp";

const HydrationGlowCombo = () => {
  useSeo({
    title: "Hydration + Glow Combo | Ilika",
    description:
      "Choose 2 premium Ilika face masks and get Hydra Gel free with the Hydration + Glow Combo.",
    path: "/hydration-glow-combo",
    image: pageImage,
    keywords: [
      "hydration glow combo",
      "mask duo combo",
      "hydra gel free",
      "Ilika face mask combo",
    ],
  });

  return (
    <>
      <MiniDivider />
      <div >
        <Header />
        <CartDrawer />

     

        <MaskDuoOffer />

        <Footer />
      </div>
    </>
  );
};

export default HydrationGlowCombo;
