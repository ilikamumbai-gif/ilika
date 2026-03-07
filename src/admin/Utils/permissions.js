export const hasPermission = (admin, permission) => {

  if (!admin) return false;

  const role = admin.role;

  const permissions = {

    superadmin: [
      "products",
      "orders",
      "users",
      "categories",
      "combos",
      "blogs",
      "reviews",
      "admins",
      "logs"
    ],

    admin: [
      "products",
      "orders",
      "categories",
      "combos",
      "blogs",
      "reviews"
    ],

    editor: [
      "blogs"
    ]

  };

  return permissions[role]?.includes(permission);

};