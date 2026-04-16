import React from "react";
import { Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const GudiPadwaBanner = () => {
    return (
        <section className="relative w-full px-4 md:px-10 lg:px-16 my-10">

            {/* MAIN CARD */}
            <div className="max-w-[1400px] mx-auto 
                    bg-gradient-to-r from-[#fff5e6] via-[#ffe0e0] to-[#fff5f6] 
                    rounded-3xl shadow-lg p-6 md:p-8 lg:p-10 border border-orange-200">

                {/* TOP SECTION */}
                <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 lg:gap-10">

                    {/* LEFT TEXT */}
                    <div className="flex-1 w-full text-center lg:text-left">

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-800 leading-tight">
                            <span className="font-[Poppins] font-semibold">
                                शुभ गुढी पाडवा
                            </span>
                            <br />
                            Celebrate New Beginnings
                        </h1>

                        {/* ✅ leading-snug reduces line spacing */}
                        <p className="text-gray-600 mt-3 max-w-lg mx-auto lg:mx-0 leading-snug text-sm sm:text-base">
                            Welcome prosperity, happiness and glowing beauty this festive
                            season with our exclusive Gudi Padwa skincare collection.
                        </p>

                        {/* BUTTONS */}
                        <div className="flex flex-wrap gap-3 mt-5 justify-center lg:justify-start">
                            <Link
                                to="/combo"
                                className="bg-[#E96A6A] hover:bg-orange-600 text-white px-5 py-2.5 rounded-full font-medium transition shadow-md text-sm sm:text-base"
                            >
                                Shop Festive Offers
                            </Link>
                            <Link
                                to="/shopall"
                                className="border border-orange-400 px-5 py-2.5 rounded-full text-orange-600 hover:bg-orange-50 transition text-sm sm:text-base"
                            >
                                Explore Collection
                            </Link>
                        </div>

                        {/* FEATURES — desktop only */}
                        <div className="hidden lg:grid grid-cols-2 gap-6 mt-8 text-center">
                            <div className="flex flex-col items-center">
                                <div className="bg-orange-100 p-3 rounded-full mb-2">
                                    <Gift className="text-orange-600" size={20} />
                                </div>
                                <h3 className="font-semibold text-sm">Festive Offers</h3>
                                <p className="text-gray-500 text-xs leading-snug mt-1">
                                    Special Gudi Padwa discounts on beauty essentials
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-orange-100 p-3 rounded-full mb-2">
                                    <Sparkles className="text-orange-600" size={20} />
                                </div>
                                <h3 className="font-semibold text-sm">Glow Naturally</h3>
                                <p className="text-gray-500 text-xs leading-snug mt-1">
                                    Premium skincare crafted for radiant festive glow
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT IMAGE — square, responsive sizes */}
                    <div className="flex-1 w-full flex justify-center">
                     <div className="rounded-2xl overflow-hidden shadow border border-orange-200 aspect-[5/4] w-[300px] sm:w-[360px] md:w-[400px] lg:w-full lg:max-w-md xl:max-w-lg">
                            <img
                                src="/Images/gudi.webp"
                                alt="Gudi Padwa"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                </div>

                {/* FEATURES — mobile & tablet only, below image */}
                <div className="grid lg:hidden grid-cols-2 gap-6 mt-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-orange-100 p-2.5 rounded-full mb-2">
                            <Gift className="text-orange-600" size={18} />
                        </div>
                        <h3 className="font-semibold text-sm">Festive Offers</h3>
                        <p className="text-gray-500 text-xs leading-snug mt-1">
                            Special Gudi Padwa discounts on beauty essentials
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-orange-100 p-2.5 rounded-full mb-2">
                            <Sparkles className="text-orange-600" size={18} />
                        </div>
                        <h3 className="font-semibold text-sm">Glow Naturally</h3>
                        <p className="text-gray-500 text-xs leading-snug mt-1">
                            Premium skincare crafted for radiant festive glow
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default GudiPadwaBanner;