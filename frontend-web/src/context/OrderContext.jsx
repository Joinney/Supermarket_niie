import React, { createContext, useContext, useState } from 'react';
import { orderApi } from '../api/axios'; // Đã dùng orderApi chuẩn cổng Gateway 5005

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  const placeOrder = async (orderData) => {
    setLoading(true);
    try {
      // Gọi chính xác đến endpoint /orders/place-order qua Gateway
      const response = await orderApi.post('/orders/place-order', orderData);
      
      // Trả về dữ liệu sạch xuôi dòng (chứa ma_don_hang) từ response của Backend
      return response.data; 
    } catch (error) {
      console.error("Lỗi đặt hàng tại Context:", error);
      throw error;
    } finally {
      setLoading(false); // Khối cuối cùng sạch sẽ, hạ loading
    }
  };

  return (
    <OrderContext.Provider value={{ placeOrder, loading, orderHistory }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);