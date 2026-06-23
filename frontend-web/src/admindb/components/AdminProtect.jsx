import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtect = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const role = localStorage.getItem('adminRole');

  // Danh sách các vai trò được phép đứng trong khu vực /admin
  const allowedRoles = ['Admin', 'Manager', 'Staff'];

  if (!adminToken || !allowedRoles.includes(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtect;