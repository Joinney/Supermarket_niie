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

    return new Intl.NumberFormat(currentCurrency.locale, {
      style: "currency",
      currency: currentCurrency.currency,
      minimumFractionDigits: currentCurrency.currency === "VND" ? 0 : 2,
    }).format(convertedPrice);
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
