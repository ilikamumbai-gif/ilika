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
       <CartDrawer/>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <Heading heading="Return and Refund Policy" />

          <div className=" space-y-6 text-sm sm:text-base leading-relaxed content-text">

            <p>
              At <strong>ilika.in</strong>, we strive to ensure complete customer
              satisfaction. If you are not satisfied with your purchase, you may
              request a return or refund for eligible products under the
              conditions mentioned below.
            </p>

            {/* Section 1 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                1. Eligibility for Returns & Refunds
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Product is damaged, defective, or incorrect</li>
                <li>Product is not as described on the product page</li>
                <li>
                  Product is unused, unwashed, and in original condition with
                  tags and packaging intact
                </li>
                <li>
                  Product damaged during transit (do not accept visibly damaged
                  packages)
                </li>
              </ul>
              <p className="mt-2 text-xs sm:text-sm">
                📌 <strong>Note:</strong> If a damaged package is accepted, an
                open-box/unboxing video is mandatory for claim verification.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                2. Non-Returnable Items
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Products marked as “Non-Returnable”</li>
                <li>Products without original packaging, tags, or accessories</li>
                <li>Items damaged due to misuse or negligence</li>
                <li>Items returned without prior approval or RMA number</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                3. Return Timeframe
              </h3>
              <p>
                Return requests must be raised within{" "}
                <strong>7 days</strong> from the date of delivery.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                4. How to Initiate a Return
              </h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Log in to your ilika.in account</li>
                <li>Go to <strong>My Orders</strong></li>
                <li>Select the product and choose a return reason</li>
                <li>Submit the return request</li>
                <li>
                  Upon approval, receive RMA number and return instructions
                </li>
                <li>
                  Pack the product securely (preferably original packaging)
                </li>
                <li>
                  Ship the product back or schedule pickup (shipping costs are
                  borne by the customer unless stated otherwise)
                </li>
              </ol>
            </div>

            {/* Section 5 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                5. Refund Process
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Refunds processed within 3–7 working days after inspection</li>
                <li>Refund credited to original payment method</li>
                <li>COD orders refunded via bank transfer</li>
              </ul>

              <p className="mt-2">
                <strong>EMI Refunds:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Refunds subject to bank policies</li>
                <li>Interest or processing fees are non-refundable</li>
                <li>EMI reversal timelines vary by bank</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                6. Payment Gateway
              </h3>
              <p>
                All online payments on ilika.in are securely processed through
                <strong> Razorpay</strong> and authorized banking partners. Ilika
                does not store card or bank details.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                7. Contact Us
              </h3>
              <p>
                <strong>Ilika Support Team</strong>
                <br />
                📧 Email:{" "}
                <a
                  href="mailto:ilika.mumbai@gmail.com"
                  className="underline font-medium"
                >
                  ilika.mumbai@gmail.com
                </a>
                <br />
                📞 Phone: +91 91208 79879 <br />

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
