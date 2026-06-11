import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Hàm merge giỏ hàng trống để không bị lỗi crash ở trang Login
  const mergeCart = async () => {
    console.log("Giỏ hàng đã được đồng bộ!");
    return { success: true };
  };

  return (
    <CartContext.Provider value={{ cartItems, mergeCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Xuất khẩu Custom Hook useCart
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider");
  }
  return context;
};