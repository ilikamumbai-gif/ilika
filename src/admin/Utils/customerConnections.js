import { getOrderSellingTotal } from "../../utils/orderPricing";

const normalizeText = (value) => String(value || "").trim();

export const normalizeEmail = (value) => normalizeText(value).toLowerCase();

export const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const getRecordEmails = (record = {}) =>
  unique([
    normalizeEmail(record?.email),
    normalizeEmail(record?.userEmail),
    normalizeEmail(record?.shippingAddress?.email),
  ]);

const getRecordPhones = (record = {}) =>
  unique([
    normalizePhone(record?.phone),
    normalizePhone(record?.mobileNumber),
    normalizePhone(record?.shippingAddress?.phone),
    normalizePhone(record?.buyerAddress?.phone),
    normalizePhone(record?.recipientAddress?.phone),
  ]);

export const doesUserMatchRecord = (user = {}, record = {}) => {
  const userId = normalizeText(user?.uid || user?.id);
  const recordUserId = normalizeText(record?.userId || record?.uid || record?.id);
  if (userId && recordUserId && userId === recordUserId) return true;

  const userEmail = normalizeEmail(user?.email);
  if (userEmail && getRecordEmails(record).includes(userEmail)) return true;

  const userPhone = normalizePhone(user?.phone || user?.phoneNumber);
  if (userPhone && getRecordPhones(record).includes(userPhone)) return true;

  return false;
};

export const findMatchedUser = (users = [], record = {}) =>
  users.find((user) => doesUserMatchRecord(user, record)) || null;

export const getUserOrders = (orders = [], user = {}) =>
  orders.filter((order) => doesUserMatchRecord(user, order));

export const getUserCartEvents = (events = [], user = {}) =>
  events.filter((event) => doesUserMatchRecord(user, event));

export const getUserLeads = (leads = [], user = {}) =>
  leads.filter((lead) => doesUserMatchRecord(user, lead));

export const getUserNotifications = (notifications = [], user = {}) =>
  notifications.filter((notification) => doesUserMatchRecord(user, notification));

export const buildUserConnectionSummary = ({
  user,
  orders = [],
  cartEvents = [],
  leads = [],
  notifications = [],
} = {}) => {
  const userOrders = getUserOrders(orders, user);
  const userCartEvents = getUserCartEvents(cartEvents, user);
  const userLeads = getUserLeads(leads, user);
  const userNotifications = getUserNotifications(notifications, user);

  return {
    orders: userOrders,
    cartEvents: userCartEvents,
    leads: userLeads,
    notifications: userNotifications,
    totalSpent: userOrders.reduce((sum, order) => sum + getOrderSellingTotal(order), 0),
  };
};

export const getRecordDisplayName = (record = {}, fallback = "Guest") =>
  normalizeText(record?.name) ||
  normalizeText(record?.shippingAddress?.name) ||
  normalizeText(record?.userName) ||
  fallback;

export const getRecordDisplayEmail = (record = {}) =>
  normalizeText(record?.email) || normalizeText(record?.userEmail) || "-";

export const getRecordDisplayPhone = (record = {}) =>
  normalizeText(record?.phone) ||
  normalizeText(record?.mobileNumber) ||
  normalizeText(record?.shippingAddress?.phone) ||
  "-";
