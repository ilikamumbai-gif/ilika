const sharedDeliveryContent = `<h2>Check delivery for your pincode</h2><p>Delivery depends on the full address and six-digit pincode, not just the city name. Enter your address at checkout and review the shipping charges and any delivery estimate before paying. If your pincode is unavailable or no estimate is shown, <a href="/contact">contact Ilika</a> with the product name and pincode before ordering.</p><p>This applies whether you are ordering from Mumbai, Pune, Delhi, Bengaluru, Chennai, Hyderabad, Ahmedabad, Jaipur or another location in India. A nearby serviced address does not guarantee service to your pincode. See the <a href="/shippingpolicy">shipping policy</a> for delivery terms.</p><h2>Compare the final payable amount</h2><p>Select your product and variant, check the current price, then apply an eligible coupon at checkout. Review the final total, including any shipping charges, before placing the order. An older article or shared promotional link may show an expired price; the current product page and checkout are the reference for your order.</p><h2>COD and EMI availability</h2><p>Use the payment options displayed for your order at checkout. Do not assume that COD or EMI is available for every product, pincode or payment method. If an EMI option is offered, review the provider's eligibility, instalment amount, interest, fees and total payable amount before selecting it.</p><h2>After ordering</h2><p>Keep your order confirmation and use <a href="/track-order">order tracking</a> to check progress. Review the <a href="/return">return policy</a> before purchasing. For an address correction, delayed parcel or product question, contact support with your order number.</p>`;

export const PRICING_DELIVERY_BLOGS = [
  {
    slug: "hair-dryer-pricing-delivery-india",
    title: "Ilika Hair Dryer: Pricing and Delivery in India",
    metaDescription: "Check Ilika hair dryer pricing, variants, pincode delivery, coupons and payment options before ordering in India.",
    image: "/Images/HairdrayerCard.webp",
    internalLink: "/product/leafless-hair-dryer",
    content: `<p>Use this guide to plan your Ilika hair dryer order, compare the amount you will pay and check delivery to your address.</p><h2>Choose your hair dryer and variant</h2><p>Open the <a href="/product/leafless-hair-dryer">Ilika Leafless Hair Dryer product page</a> for the current price, available colours, stock and included accessories. Confirm the selected variant before adding it to your bag. If you are comparing dryers, check heat and speed settings, attachments, power requirements and warranty information alongside the price.</p><p>For help choosing a dryer and caring for it, browse the <a href="/hair-dryer-guides">hair dryer guides</a>.</p>${sharedDeliveryContent}`,
  },
  {
    slug: "face-mask-maker-pricing-delivery-india",
    title: "Ilika Face Mask Makers: Pricing and Delivery in India",
    metaDescription: "Compare Ilika voice and non-voice face mask makers, check current pricing and review pincode delivery and payment options in India.",
    image: "/Images/MaskMakercard.webp",
    internalLink: "/product/voice-face-mask-maker",
    content: `<p>Use this guide to compare Ilika mask maker options and check the details that affect the total cost of your order.</p><h2>Choose voice or non-voice guidance</h2><p>The <a href="/product/voice-face-mask-maker">voice face mask maker</a> offers spoken guidance. Compare it with the <a href="/product/non-voice-face-mask-maker">non-voice face mask maker</a> if you prefer manual controls. Check each product page for current pricing, availability and exactly what is included.</p><h2>Check supplies and ongoing costs</h2><p>Before ordering, review the included accessories and any mask-making supplies listed in the box contents. Check the cost and availability of replacement supplies separately. Follow the product manual for compatible ingredients, preparation and cleaning. The <a href="/blog/voice-face-mask-maker-machine-guide">face mask maker guide</a> explains the two versions and routine maintenance.</p>${sharedDeliveryContent}`,
  },
].map(({ content, ...blog }) => ({
  ...blog,
  id: blog.slug,
  metaTitle: blog.title,
  excerpt: blog.metaDescription,
  author: "Ilika Team",
  createdAt: "2026-09-23T00:00:00.000Z",
  isPrivate: false,
  hideFromBlogListing: false,
  contentSections: [{ id: `${blog.slug}-content`, type: "content-full", content }],
}));
