export const ALL_ADMIN_PERMISSIONS = [
  "dashboard",
  "products",
  "coupons",
  "combos",
  "categories",
  "orders",
  "cart-products",
  "notifications",
  "users",
  "reviews",
  "feedback",
  "warranty",
  "blogs",
  "reports",
  "admins",
  "logs",
];

const DEFAULT_ROLE_PERMISSIONS = {
  superadmin: ALL_ADMIN_PERMISSIONS,
  admin: [
    "dashboard",
    "products",
    "coupons",
    "combos",
    "categories",
    "orders",
    "cart-products",
    "notifications",
    "users",
    "reviews",
    "feedback",
    "warranty",
    "blogs",
    "reports",
  ],
};

export const isSuperAdmin = (admin) => admin?.role === "superadmin";

export const getEffectivePermissions = (admin) => {
  if (!admin) return [];
  if (isSuperAdmin(admin)) return ALL_ADMIN_PERMISSIONS;

  if (Array.isArray(admin.permissions)) {
    return admin.permissions;
  }

  return DEFAULT_ROLE_PERMISSIONS[admin.role] || [];
};

export const hasPermission = (admin, permission) => {
  return getEffectivePermissions(admin).includes(permission);
};
