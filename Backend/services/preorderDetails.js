export const validatePreorderDetails = (details = {}) => {
  const name = String(details.name || "").trim().replace(/\s+/g, " ");
  const rawPhone = String(details.phone || "").trim();
  const phone = rawPhone.replace(/[\s()+.-]/g, "");
  const contactMethod = details.contactMethod || (details.email && !details.address ? "email" : "address");
  const address = contactMethod === "address" ? String(details.address || "").trim() : "";
  const email = contactMethod === "email" ? String(details.email || "").trim().toLowerCase() : "";
  const errors = {};
  if (name.length < 2 || name.length > 120) errors.name = "Enter your full name (2–120 characters).";
  if (!/^[\d\s()+.-]+$/.test(rawPhone) || !/^\d{10,15}$/.test(phone)) errors.phone = "Enter a valid mobile number with 10–15 digits.";
  if (address.length > 500) errors.address = "Keep the address within 500 characters.";
  if (!["address", "email"].includes(contactMethod)) errors.contactMethod = "Choose address or email.";
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = "Enter a valid email address.";
  return { valid: Object.keys(errors).length === 0, errors, value: { name, phone, address, email, contactMethod } };
};
