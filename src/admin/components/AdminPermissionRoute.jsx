import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { hasPermission } from "../Utils/permissions";

const AdminPermissionRoute = ({ permission, children }) => {
  const { admin } = useAdminAuth();

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!permission || hasPermission(admin, permission)) {
    return children;
  }

  return <Navigate to="/admin" replace />;
};

export default AdminPermissionRoute;
