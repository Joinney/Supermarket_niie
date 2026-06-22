import React, { createContext, useContext, useEffect, useState } from "react";
import { useLanguage } from "./LanguageContext";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();

  const stores = [
    { code: "VN", name: "Việt Nam" },
    { code: "US", name: "United States" },
    { code: "CN", name: "China" },
  ];

  const currencyMap = {
    vi: {
      currency: "VND",
      locale: "vi-VN",
      rate: 1,
    },
    en: {
      currency: "USD",
      locale: "en-US",
      rate: 0.00004,
    },
    zh: {
      currency: "CNY",
      locale: "zh-CN",
      rate: 0.00029,
    },
  };

  const [currentStore, setCurrentStore] = useState(stores[0]);

  useEffect(() => {
    const pathSegments = window.location.pathname.split("/");
    const urlCountry = pathSegments[1]?.toUpperCase();

    const matchedStore =
      stores.find((store) => store.code === urlCountry) || stores[0];

    setCurrentStore(matchedStore);
  }, []);

  const currentCurrency = currencyMap[currentLanguage?.code] || currencyMap.vi;

  const formatPrice = (priceInVnd) => {
    if (priceInVnd === null || priceInVnd === undefined) {
      return "";
    }

    const convertedPrice = priceInVnd * currentCurrency.rate;

    // Chỉ dùng Intl để định dạng số thập phân và dấu phẩy (vd: 1,000.50 hoặc 15.000)
    // KHÔNG dùng style: "currency" để tránh trình duyệt tự in chữ sai
    const formattedNumber = new Intl.NumberFormat(currentCurrency.locale, {
      minimumFractionDigits: currentCurrency.currency === "VND" ? 0 : 2,
      maximumFractionDigits: currentCurrency.currency === "VND" ? 0 : 2,
    }).format(convertedPrice);

    // Tự tay gắn Symbol để đảm bảo 100% hiển thị đúng
    switch (currentCurrency.currency) {
      case "USD":
        return `$${formattedNumber}`;
      case "CNY":
        return `¥${formattedNumber}`;
      case "VND":
      default:
        return `${formattedNumber}đ`;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        setCurrentStore,
        stores,
        formatPrice,
        currentCurrency,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
