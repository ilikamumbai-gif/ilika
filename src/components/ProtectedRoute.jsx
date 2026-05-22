import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, authReady } = useAuth();
  const { pathname } = useLocation();

  if (!authReady) {
    return <div className="min-h-screen" aria-busy="true" />;
  }

  if (!currentUser) {
    const loginPath = pathname === "/checkout" ? "/login?redirect=checkout" : "/login";
    return <Navigate to={loginPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
