import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // Hoặc loading spinner

  // Nếu chưa đăng nhập khách hàng, đẩy về trang login của khách
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};