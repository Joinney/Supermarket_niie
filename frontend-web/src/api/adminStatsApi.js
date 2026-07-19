// File: frontend/src/api/adminStatsApi.js
import { productApi, orderApi } from "./axios";

const getAuthHeaders = () => {
  let token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (token) {
    // Xóa dấu nháy kép bọc chuỗi nếu có
    token = token.replace(/^"|"$/g, '');
  }
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  };
};

export const adminStatsApi = {
  // 📦 Gọi sang Product Microservice (Cổng 5002)
  getProductStats: () => {
    return productApi.get("/products/admin/statistics", getAuthHeaders());
  },
  
  // 📄 Gọi sang Order Microservice (Cổng 5005) - Đã đồng bộ đẩy params lọc thẻ KPI
  getOrderOverview: (filters = {}) => {
    return orderApi.get("/orders/admin/overview", {
      params: filters, 
      ...getAuthHeaders()
    });
  },
  
  // 📊 Gọi sang Order Microservice (Cổng 5005) - Đã đồng bộ đẩy params lọc biểu đồ
  getMonthlyRevenue: (filters = {}) => {
    return orderApi.get("/orders/admin/monthly-revenue", { 
      params: filters, 
      ...getAuthHeaders() 
    });
  },

  // 🏆 Gọi sang Order Microservice (Cổng 5005) - Lấy danh sách Top sản phẩm thực tế theo bộ lọc
  getTopProducts: (filters = {}) => {
    return orderApi.get("/orders/admin/top-products", {
      params: filters,
      ...getAuthHeaders()
    });
  },
};