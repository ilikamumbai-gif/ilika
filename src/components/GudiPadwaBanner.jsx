import React from "react";
import { Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const GudiPadwaBanner = () => {
    const petals = Array.from({ length: 12 });

    return (
        <section className="relative w-full px-4 md:px-10 lg:px-16 my-10 ">

            {/* MAIN CARD */}
            <div className="max-w-[1400px] mx-auto 
                    bg-gradient-to-r from-[#fff5e6] via-[#ffe0e0] to-[#fff5f6] 
                    rounded-3xl shadow-lg p-6 md:p-10 border border-orange-200">

                {/* TOP SECTION */}
                <div className="flex flex-col lg:flex-row items-center gap-10">

                    {/* LEFT TEXT */}
                    <div className="flex-1 text-center lg:text-left">



                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-800 leading-tight">
                            <span className="font-[Poppins] font-semibold">
                                शुभ गुढी पाडवा
                            </span>
                            <br />
                            Celebrate New Beginnings
                        </h1>

                        <p className="text-gray-600 mt-4 max-w-lg mx-auto lg:mx-0">
                            Welcome prosperity, happiness and glowing beauty this festive
                            season with our exclusive Gudi Padwa skincare collection.
                        </p>

                        {/* BUTTONS */}
                        <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">

                            <Link
                                to="/combo"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-medium transition shadow-md"
                            >
                                Shop Festive Offers
                            </Link>

                            <Link
                                to="/shopall"
                                className="border border-orange-400 px-6 py-3 rounded-full text-orange-600 hover:bg-orange-50 transition"
                            >
                                Explore Collection
                            </Link>

                        </div>
                        {/* FEATURES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 text-center">

                            <div className="flex flex-col items-center">
                                <div className="bg-orange-100 p-3 rounded-full mb-3">
                                    <Gift className="text-orange-600" size={22} />
                                </div>
                                <h3 className="font-semibold">Festive Offers</h3>
                                <p className="text-gray-500 text-sm">
                                    Special Gudi Padwa discounts on beauty essentials
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-orange-100 p-3 rounded-full mb-3">
                                    <Sparkles className="text-orange-600" size={22} />
                                </div>
                                <h3 className="font-semibold">Glow Naturally</h3>
                                <p className="text-gray-500 text-sm">
                                    Premium skincare crafted for radiant festive glow
                                </p>
                            </div>



                        </div>

                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="flex-1 w-full h-full flex">

                        <div className="rounded-2xl overflow-hidden shadow border border-orange-200 w-full h-full flex items-center justify-center">

                            <img
                                src="/Images/gudi.png"
                                alt="Gudi Padwa"
                                className="w-full h-full object-contain"
                            />

                        </div>

                    </div>

                </div>

            </div>
        </section>
    );
};

export default GudiPadwaBanner;