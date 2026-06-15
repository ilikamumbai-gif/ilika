import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const Return = () => {
  return (
    <>
      <MiniDivider />


      <section className="w-full primary-bg-color">
        <Header />
        <CartDrawer />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <Heading level="h1" heading="Return and Refund Policy" />

          <div className="space-y-6 text-sm sm:text-base leading-relaxed content-text">

            <p>
              At <strong>ilika.in</strong>, we are committed to delivering premium-quality
              products and a smooth shopping experience to our customers. As part of our
              policy, orders once successfully placed and delivered are generally not
              eligible for refunds.
            </p>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                1. Refund Policy
              </h3>
              <p>
                At <strong>ilika.in</strong>, we are committed to maintaining the highest
                standards of product quality and hygiene. Due to the nature of our products,
                all purchases made on our website are considered final.
              </p>

              <p className="mt-2">
                Therefore, we currently do not provide refunds once an order has been
                successfully placed and delivered. We kindly request customers to review
                product details carefully before completing their purchase.
              </p>

              <p className="mt-2 text-xs sm:text-sm">
                📌 However, in case a customer receives a damaged, defective, or incorrect
                product, our support team will be happy to assist with an eligible return
                or replacement process as per our policy.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                2. Return Eligibility
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Returns are accepted only if the product is damaged, defective, or incorrect.</li>
                <li>The product must be unused and in original condition.</li>
                <li>Original packaging, tags, accessories, and invoice must be available.</li>
                <li>Returns without prior approval will not be accepted.</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                3. Damaged Packaging Policy
              </h3>
              <p>
                If the outer packing or box is damaged during delivery, the customer should
                still accept the parcel. Only if the product seal is damaged or broken, the
                parcel should not be accepted.
              </p>
              <p className="mt-2 text-xs sm:text-sm">
                📌 <strong>Note:</strong> Damage to the outer box or packaging alone will
                not be considered a valid reason for refusal or return.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                4. Return Timeframe
              </h3>
              <p>
                Return requests must be raised within <strong>7 days</strong> from the date
                of delivery.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                5. How to Initiate a Return
              </h3>
              <p>
                There is no return button available on the website. To request a return,
                the customer must contact us through WhatsApp using the WhatsApp option
                available on our website.
              </p>
              <p className="mt-2">
                Our support team will review the request and guide the customer with the
                next steps if the return is approved.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                6. Payment Gateway
              </h3>
              <p>
                All online payments on ilika.in are securely processed through
                <strong> Razorpay</strong> and authorized banking partners. Ilika does not
                store card or bank details.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                7. Contact Us
              </h3>
              <p>
                <strong>Ilika Support Team</strong>
                <br />
                📧 Email:{" "}
                <a
                  href="mailto:customersupport.ilika@gmail.com"
                  className="underline font-medium"
                >
                  customersupport.ilika@gmail.com
                </a>
                <br />
                📞 Phone: +91 92701 14738 <br />
                <br />
                🕒 Working Hours: Monday to Saturday, 10:00 AM – 6:00 PM
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Return;
