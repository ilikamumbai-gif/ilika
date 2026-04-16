import React from "react";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Heading from "../components/Heading";
import VisionMission from "../components/VisionMission";
import CartDrawer from "../components/CartDrawer";

const About = () => {
  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">
        <Header />
         <CartDrawer/>

        {/* ABOUT CONTENT */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          
          <Heading heading="WHO ARE WE?" />

          <p className="mt-6 text-sm sm:text-base leading-relaxed content-text text-center sm:text-left">
            Welcome to <strong>ilika.in</strong>, your one-stop destination for
            premium beauty and skincare solutions. We are dedicated to helping
            you achieve radiant skin and healthy hair through our carefully
            curated range of products.
            <br /><br />
            From advanced <b>hair care and skincare solutions</b> to innovative beauty
            tools, we bring together the best of technology and tradition. Our
            collection includes laser hair removal devices, facial stone
            rollers, Gua Sha tools, and smart beauty gadgets designed to elevate
            your self-care routine.
            <br /><br />
            At ilika.in, we believe beauty is personal. That’s why we focus on
            <b> quality</b>, <b>safety</b>, and <b>effectiveness</b> — so you can feel confident,
            empowered, and comfortable in your own skin.
          </p>

        </section>

        {/* VISION & MISSION */}
        <VisionMission />

        <Footer />
      </div>
    </>
  );
};

export default About;
