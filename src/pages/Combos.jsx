import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MiniDivider from "../components/MiniDivider";
import { useCart } from "../context/CartProvider";
import Heading from "../components/Heading";

const Combos = () => {
  const { addToCart } = useCart();

  const combos = [
    {
      id: "combo_glow",
      name: "Glow Essentials",
      price: 1499,
      mrp: 2199,
      items: [
        {
          id: "rose_serum",
          name: "Rose Face Serum",
          image:
            "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
        },
        {
          id: "vitamin_c",
          name: "Vitamin C Cream",
          image:
            "https://images.unsplash.com/photo-1629196914168-5c8b6a4e6a0b",
        },
      ],
    },
    {
      id: "combo_hydration",
      name: "Hydration Ritual",
      price: 1199,
      mrp: 1799,
      items: [
        {
          id: "aloe_gel",
          name: "Aloe Vera Gel",
          image:
            "https://images.unsplash.com/photo-1585386959984-a4155224a1ad",
        },
        {
          id: "facewash",
          name: "Hydrating Face Wash",
          image:
            "https://images.unsplash.com/photo-1587854692152-cbe660dbde88",
        },
      ],
    },
  ];

  return (
    <>
      <MiniDivider />
      <Header />

      <section className="max-w-7xl mx-auto px-4 pb-6">
        
        {/* Heading */}
        
          <Heading heading="Combo Offer" />
     
        
        

        {/* GRID: 2 per row */}
        <div className="grid md:grid-cols-2 gap-10">
          {combos.map((combo) => {
            const discount = Math.round(
              ((combo.mrp - combo.price) / combo.mrp) * 100
            );

            return (
              <div
                key={combo.id}
                className="border border-[#f0e6e6] rounded-3xl p-8 hover:shadow-md transition"
              >
                {/* Combo Name */}
                <h2 className="text-xl font-luxury text-center heading-2-color mb-8">
                  {combo.name}
                </h2>

                {/* Products */}
                <div className="flex items-center justify-center gap-6 mb-10">
                  {combo.items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <div className="w-40 text-center">
                        <div className="aspect-square flex items-center justify-center bg-[#fafafa] rounded-2xl p-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-contain h-full"
                          />
                        </div>
                        <p className="mt-3 text-xs content-text font-medium">
                          {item.name}
                        </p>
                      </div>

                      {index < combo.items.length - 1 && (
                        <div className="text-2xl text-gray-300">+</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Pricing */}
                <div className="text-center border-t pt-6">
                  <div className="flex justify-center items-center gap-4 mb-5">
                    <span className="text-2xl font-semibold heading-2-color">
                      ₹{combo.price}
                    </span>

                    <span className="line-through text-gray-400 text-sm">
                      ₹{combo.mrp}
                    </span>

                    <span className="text-xs px-3 py-1 rounded-full bg-[#b34140] text-white">
                      SAVE {discount}%
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      addToCart({
                        id: `combo_${combo.id}`,
                        name: combo.name,
                        price: combo.price,
                        mrp: combo.mrp,
                        isCombo: true,
                        quantity: 1,
                      })
                    }
                    className="button-bg-color text-black px-8 py-2.5 rounded-full text-sm tracking-wide hover:opacity-90 transition"
                  >
                    Add Ritual To Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Combos;