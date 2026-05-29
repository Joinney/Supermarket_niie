import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  // Nếu không có token, chuyển hướng về trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};