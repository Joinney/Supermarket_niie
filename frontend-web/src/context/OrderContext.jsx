import React, { createContext, useContext, useState } from 'react';
import { orderApi } from '../api/axios'; // Import instance bạn vừa tạo

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  const placeOrder = async (orderData) => {
    setLoading(true);
    try {
      const response = await orderApi.post('/orders', orderData);
      return response.data; // Trả về thông tin đơn hàng (có ma_don_hang)
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrderContext.Provider value={{ placeOrder, loading, orderHistory }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);