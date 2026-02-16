import React, { useState } from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import Footer from "../components/Footer";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "How long does delivery take?",
    answer:
      "Orders are processed within 1–2 business days. Delivery usually takes 3–7 working days depending on your location.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Yes, orders can be cancelled before dispatch. Once shipped, cancellation is not possible.",
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes, Cash on Delivery is available for selected locations across India.",
  },
  {
    question: "Are your products suitable for sensitive skin?",
    answer:
      "Yes, most of our products are dermatologically tested and safe for sensitive skin. However, we recommend a patch test before use.",
  },
  {
    question: "What if I receive a damaged product?",
    answer:
      "Please contact us within 24 hours with images or an unboxing video at support@ilika.in and we will replace the product.",
  },
  {
    question: "Can I return opened products?",
    answer:
      "Due to hygiene reasons, opened products cannot be returned unless they are damaged or incorrect.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order is shipped, you will receive a tracking link via SMS/email/WhatsApp.",
  },
  {
    question: "Do your products contain harmful chemicals?",
    answer:
      "Our formulations are free from parabens and harsh chemicals and are designed for safe daily use.",
  },
  {
    question: "How should I choose the right skincare routine?",
    answer:
      "You can use our CTM Builder to select Cleanser, Toner and Moisturizer based on your skin type.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach us at support@ilika.in or call 9270114738 between 10 AM – 6 PM (Mon–Sat).",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color min-h-screen">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-">
          <Heading heading="Frequently Asked Questions" />

          <div className="mt-8 space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
              >
                {/* QUESTION */}
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium heading-color"
                >
                  {faq.question}
                  <ChevronDown
                    className={`transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* ANSWER */}
                <div
                  className={`px-5 transition-all duration-300 ${
                    openIndex === index
                      ? "max-h-40 py-4 opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Faq;
