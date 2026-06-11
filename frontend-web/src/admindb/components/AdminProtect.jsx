import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtect = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const role = localStorage.getItem('adminRole');

  // Nếu không có token hoặc không phải admin, đá ngay về trang login admin độc lập
  if (!adminToken || role !== 'superadmin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtect;