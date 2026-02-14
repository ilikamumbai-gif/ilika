import React from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const Privacy = () => {
  return (
    <>
      <MiniDivider />
      <Header />
       <CartDrawer/>

      <section className="w-full primary-bg-color">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <Heading heading="Privacy Policy" />

          <div className=" space-y-6 text-sm sm:text-base leading-relaxed content-text">

            <p>
              At <strong>Ilika</strong>, your privacy is our priority. This Privacy
              Policy explains how we collect, use, disclose, and protect your
              information when you visit or interact with our website{" "}
              <a
                href="https://www.ilika.in"
                className="underline font-medium"
                target="_blank"
              >
                https://www.ilika.in
              </a>
              .
            </p>

            <p>
              This Policy applies to individuals who browse, access, or provide
              information on or through our Platform, in accordance with
              applicable Indian laws and regulations.
            </p>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                This Policy does not apply to:
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal information collected offline</li>
                <li>Websites that do not reference this Policy</li>
                <li>Users outside India</li>
                <li>Third-party websites linked through our Platform</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                📌 Information We Collect
              </h3>

              <ul className="space-y-2 pl-4 list-disc">
                <li>
                  <strong>Personal Information:</strong> Name, email, phone
                  number, shipping & billing address
                </li>
                <li>
                  <strong>Payment Information:</strong> Securely processed via
                  Razorpay (Ilika does not store card or banking details)
                </li>
                <li>
                  <strong>Account Information:</strong> Login credentials,
                  preferences, order history
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser, device,
                  cookies & analytics data
                </li>
                <li>
                  <strong>Communications:</strong> Emails or messages with
                  customer support
                </li>
              </ul>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                ⚙️ How We Use Your Information
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process orders and payments</li>
                <li>Enable EMI & NetBanking transactions</li>
                <li>Provide customer support</li>
                <li>Improve products & user experience</li>
                <li>Send communications (with consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                🔄 Sharing of Information
              </h3>
              <p>
                We do not sell your personal information. Data may be shared
                only with payment partners, logistics providers, service
                vendors, analytics tools, or legal authorities when required.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                🍪 Cookies & Tracking
              </h3>
              <p>
                Cookies help us improve performance and personalize content.
                You may disable cookies via browser settings, though some
                features may be limited.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                🔐 Data Security
              </h3>
              <p>
                We apply industry-standard security practices. However, no
                system is 100% secure. Users should protect passwords and
                account details.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                👤 Your Rights
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Update or correct information</li>
                <li>Request data deletion</li>
                <li>Opt out of marketing communication</li>
              </ul>
              <p className="mt-2">
                Email us at{" "}
                <a href="mailto:support@ilika.in" className="underline">
                  ilika.mumbai@gmail.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                👶 Children’s Privacy
              </h3>
              <p>
                Our services are not intended for children under 13 years of
                age.
              </p>
            </div>

            <div>
              <h3 className="heading-color font-semibold text-lg mb-2">
                📞 Contact Us
              </h3>
              <p>
                <strong>Email:</strong> ilika.mumbai@gmail.com <br />
                <strong>Phone:</strong> +91 91208 79879 <br />
                <strong>Website:</strong>{" "}
                <a href="https://www.ilika.in" className="underline">
                  www.ilika.in
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Privacy;
