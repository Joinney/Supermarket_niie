import React, { createContext, useState, useContext, useEffect } from 'react';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  // Định nghĩa danh sách cửa hàng kèm mã quốc gia (code) để gửi xuống API
  const stores = [
    { name: "Demi Việt Nam", code: "vn" },
    { name: "Demi US (Mỹ)", code: "us" },
    { name: "Demi China (Trung Quốc)", code: "cn" }
  ];

  // Khôi phục cửa hàng đã chọn từ LocalStorage (để F5 không bị mất)
  const [currentStore, setCurrentStore] = useState(() => {
    const saved = localStorage.getItem('demi_current_store');
    return saved ? JSON.parse(saved) : stores[0];
  });

  // Lưu lại mỗi khi người dùng đổi cửa hàng
  useEffect(() => {
    localStorage.setItem('demi_current_store', JSON.stringify(currentStore));
  }, [currentStore]);

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, stores }}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook để gọi nhanh
export const useStore = () => useContext(StoreContext);