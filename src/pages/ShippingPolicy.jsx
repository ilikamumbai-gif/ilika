import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const ShippingPolicy = () => {
  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color min-h-screen">
        <Header />
        <CartDrawer/>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py- text-gray-700 leading-relaxed">

          <Heading heading="Our Shipping Policy" />

          {/* INTRO */}
          <p className="mt-6">
            At <span className="font-semibold">ilika.in</span>, we work hard to
            ensure that your orders are processed and delivered as quickly as possible.
          </p>

          {/* ORDER PROCESSING */}
          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold heading-color">
              Order Processing & Shipping
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Once payment is accepted and the order is confirmed, it is immediately processed.</li>
              <li>Orders are usually processed within <strong>1–2 business days</strong> (excluding Sundays & public holidays).</li>
              <li>Delivery timelines may vary depending on location and courier partner.</li>
            </ul>
          </section>

          {/* CANCELLATION */}
          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold heading-color">
              Order Cancellation
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Orders can be cancelled only before they are shipped.</li>
              <li>Once dispatched, cancellation may not be possible.</li>
              <li>Please contact us immediately to request cancellation or modification.</li>
            </ul>

            <p className="mt-2">
              📧 Email: <span className="font-medium">support@ilika.in</span>
            </p>
          </section>

          {/* RETURNS */}
          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold heading-color">
              Returns & Exchanges
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Customer satisfaction is our top priority.</li>
              <li>Due to hygiene and safety reasons, some items may not be eligible for return.</li>
              <li>Eligibility is governed by our Return & Refund Policy.</li>
              <li>If you receive a damaged or incorrect product, contact us immediately with proof.</li>
            </ul>

            <p>📧 Email: <span className="font-medium">support@ilika.in</span></p>
          </section>

          {/* SHIPPING COST */}
          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold heading-color">
              Shipping Costs & Liability
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li>Shipping charges (if any) are displayed at checkout.</li>
              <li>We are not responsible for additional return shipping costs unless stated.</li>
              <li>We cannot compensate for lost packages without confirmed delivery proof.</li>
            </ul>
          </section>

          {/* CONTACT */}
          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold heading-color">
              Contact Us
            </h2>

            <div className="bg-white rounded-xl p-5 shadow-sm border space-y-2">
              <p className="font-medium">Ilika Support Team</p>
              <p>📧 support@ilika.in</p>
              <p>📞 9270114738</p>
              <p>🕒 Monday – Saturday, 10:00 AM – 6:00 PM</p>
            </div>
          </section>

        </div>

        <Footer />
      </div>
    </>
  );
};

export default ShippingPolicy;
