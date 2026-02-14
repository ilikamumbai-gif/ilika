import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import { Phone, Mail, MapPin } from "lucide-react";
import CartDrawer from "../components/CartDrawer";

const Contact = () => {
  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
         <CartDrawer/>

        {/* PAGE CONTENT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          
          <Heading heading="CONTACT US" />

          {/* CUSTOMER SUPPORT TEXT */}
          <p className=" max-w-3xl mx-auto text-center text-sm sm:text-base leading-relaxed content-text">
            Our customer support team is here to help you with any questions,
            concerns, or product guidance. Whether you need assistance with
            your order, product usage, or general queries — we’d love to hear
            from you.
          </p>

          {/* CONTACT INFO */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2 hover:scale-110 transition">
              <Phone />
              <p className="font-semibold heading-2-color">Phone</p>
              <p className="text-sm">+91 91208 79879</p>
            </div>

            <div className="flex flex-col items-center gap-2 hover:scale-110 transition">
              <Mail />
              <p className="font-semibold heading-2-color">Email</p>
              <p className="text-sm">ilika.mumbai@gmail.com</p>
            </div>

            <div className="flex flex-col items-center gap-2 hover:scale-110 transition">
              <MapPin />
              <p className="font-semibold heading-2-color">Location</p>
              <p className="text-sm text-center">
                Virar (East), Maharashtra, India
              </p>
            </div>
          </div>

          {/* FORM + MAP */}
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* CONTACT FORM */}
            <div className="secondary-bg-color shadow-sm p-6 sm:p-8">
              <h3 className="text-xl heading-color mb-6">Send us a message</h3>

              <form className="space-y-5">  
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 rounded-xl outline text-sm"
                />

                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-3 rounded-xl outline text-sm"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full p-3 rounded-xl outline text-sm"
                />

                <textarea
                  rows="4"
                  placeholder="Your Message"
                  className="w-full p-3 rounded-xl outline text-sm resize-none"
                ></textarea>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* GOOGLE MAP */}
            <div className="shadow-sm overflow-hidden h-[350px] sm:h-[420px]">
            

              <iframe title="Ilika Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.0678866438457!2d72.81075367525975!3d19.45263968183104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7a98481d54da9%3A0xfe2885a709a73c6e!2sPadmibai%20Tower!5e0!3m2!1sen!2sus!4v1770789669681!5m2!1sen!2sus" className="w-full h-full border-0" loading="lazy" aria-hidden="true" tabIndex="-1"></iframe>
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
