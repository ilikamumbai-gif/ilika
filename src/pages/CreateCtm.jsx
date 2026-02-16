import React, { useState } from "react";
import products from "../Dummy/productsData";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartProvider";
import CtmProductCard from "../components/CtmProductCard";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const CreateCtm = () => {

    const { addToCart } = useCart();

    // filter products by category
    const cleansers = products.filter(p => p.category === "cleanser");
    const toners = products.filter(p => p.category === "toner");
    const moisturizers = products.filter(p => p.category === "moisturizer");

    const [selected, setSelected] = useState({
        cleanser: null,
        toner: null,
        moisturizer: null
    });

    const KIT_PRICE = 699;

    const selectProduct = (type, product) => {
        setSelected(prev => ({ ...prev, [type]: product }));
    };

    const addKitToCart = () => {
        if (!selected.cleanser || !selected.toner || !selected.moisturizer) return;

        const comboProduct = {
            id: `ctm-${selected.cleanser.id}-${selected.toner.id}-${selected.moisturizer.id}`,
            name: "CTM Skincare Kit",
            image: selected.cleanser.image,
            price: KIT_PRICE,
            quantity: 1,
            isCombo: true,
            comboType: "ctm",
            comboItems: [
                selected.cleanser,
                selected.toner,
                selected.moisturizer
            ]
        };

        addToCart(comboProduct);
    };

    const Section = ({ title, items, type }) => (
        <div className="mb-12">

            <h2 className="text-2xl font-semibold text-[#1C371C] mb-6">
                {title}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(product => (
                    <CtmProductCard
                        key={product.id}
                        product={product}
                        selected={selected[type]?.id === product.id}
                        onSelect={(p) => selectProduct(type, p)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <>
            <MiniDivider />

            <div className="primary-bg-color">
                <Header />
                <CartDrawer />

                <div className="max-w-7xl mx-auto px-4 pb-6">

                    <Heading heading="Build Your Own CTM Kit" />

                    <Section
                        title="Step 1 — Choose a Cleanser"
                        items={cleansers}
                        type="cleanser"
                    />

                    <Section
                        title="Step 2 — Choose a Toner"
                        items={toners}
                        type="toner"
                    />

                    <Section
                        title="Step 3 — Choose a Moisturizer"
                        items={moisturizers}
                        type="moisturizer"
                    />

                    {/* KIT PREVIEW */}
                    <div className="sticky bottom-6 secondary-bg-color shadow-sm rounded-2xl p-4 mt-10">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            {/* SELECTED PRODUCTS VISUAL */}
                            <div className="flex items-center gap-3 overflow-x-auto">

                                {/* Cleanser */}
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                                        {selected.cleanser ? (
                                            <img src={selected.cleanser.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                                Cleanser
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] mt-1 line-clamp-2">
                                        {selected.cleanser?.name || "Select"}
                                    </p>
                                </div>

                                <span className="text-lg font-semibold text-gray-400">+</span>

                                {/* Toner */}
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                                        {selected.toner ? (
                                            <img src={selected.toner.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                                Toner
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] mt-1 line-clamp-2">
                                        {selected.toner?.name || "Select"}
                                    </p>
                                </div>

                                <span className="text-lg font-semibold text-gray-400">+</span>

                                {/* Moisturizer */}
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                                        {selected.moisturizer ? (
                                            <img src={selected.moisturizer.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                                Moisturizer
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] mt-1 line-clamp-2">
                                        {selected.moisturizer?.name || "Select"}
                                    </p>
                                </div>

                            </div>

                            {/* PRICE + BUTTON */}
                            <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">

                                <div className="text-right">
                                    <p className="text-2xl font-bold text-[#1C371C]">
                                        ₹{KIT_PRICE}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Custom Routine Kit
                                    </p>
                                </div>

                                <button
                                    onClick={addKitToCart}
                                    disabled={
                                        !selected.cleanser ||
                                        !selected.toner ||
                                        !selected.moisturizer
                                    }
                                    className={`px-6 py-3 rounded-lg text-white font-medium whitespace-nowrap
                                        ${selected.cleanser &&
                                            selected.toner &&
                                            selected.moisturizer
                                            ? "bg-black hover:bg-gray-900"
                                            : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    Add Kit To Bag
                                </button>

                            </div>
                        </div>
                    </div>

                </div>

                <Footer />
            </div>
        </>
    );
};

export default CreateCtm;
