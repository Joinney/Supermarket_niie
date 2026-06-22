import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const stores = [
    { code: 'VN', name: 'Việt Nam', currency: 'VND', symbol: '₫', locale: 'vi-VN', rate: 1 },
    { code: 'US', name: 'United States', currency: 'USD', symbol: '$', locale: 'en-US', rate: 0.00004 }, 
    { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', locale: 'zh-CN', rate: 0.00029 }
  ];
  
  const [currentStore, setCurrentStore] = useState(stores[0]);
  const [currencyStore, setCurrencyStore] = useState(stores[0]);

  // Đồng bộ lại Store và Tiền tệ theo URL khi người dùng F5
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const urlCountry = pathSegments[1]?.toUpperCase(); // Ép về viết hoa chuẩn (VN, US, CN)
    
    const matchedStore = stores.find(s => s.code === urlCountry);
    if (matchedStore) {
      setCurrentStore(matchedStore);
      setCurrencyStore(matchedStore); 
    }
  }, []);

  // Hàm quy đổi giá tiền ăn theo currencyStore
  const formatPrice = (priceInVnd) => {
    if (!priceInVnd && priceInVnd !== 0) return '';
    
    const convertedPrice = priceInVnd * currencyStore.rate;

    return new Intl.NumberFormat(currencyStore.locale, {
      style: 'currency',
      currency: currencyStore.currency,
      minimumFractionDigits: currencyStore.currency === 'VND' ? 0 : 2
    }).format(convertedPrice);
  };

  return (
    <StoreContext.Provider value={{ 
      currentStore, 
      setCurrentStore, 
      currencyStore, 
      // 💡 Bọc thêm lớp .toUpperCase() khi setState tiền tệ để bảo vệ dữ liệu, chấp mọi loại chữ hoa/thường truyền vào từ Header/Sidebar
      setCurrencyStore: (storeObj) => {
        if (storeObj?.code) {
          const cleanStore = stores.find(s => s.code === storeObj.code.toUpperCase());
          if (cleanStore) setCurrencyStore(cleanStore);
        }
      }, 
      stores, 
      formatPrice 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);