import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useLanguage } from "./LanguageContext";
import { productApi } from "../api/axios"; 

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);

  // Dùng Ref để lấy giá trị mới nhất của currentStore trong Socket mà không gây Re-connect
  const currentStoreRef = useRef(currentStore);
  useEffect(() => {
    currentStoreRef.current = currentStore;
  }, [currentStore]);

  // 1. Fetch danh sách quốc gia
  useEffect(() => {
    const fetchNations = async () => {
      try {
        const res = await productApi.get("/nations");
        const data = res.data.data || [];
        const formattedStores = data.map((item) => ({
          code: item.ma_quoc_gia,
          name: item.ten_quoc_gia,
          trang_thai: item.trang_thai,
        }));
        setStores(formattedStores);
      } catch (err) {
        setStores([{ code: "VN", name: "Việt Nam", trang_thai: true }]);
      }
    };
    fetchNations();
  }, []);

  // 2. Thiết lập cửa hàng & Chặn truy cập
  useEffect(() => {
    if (stores.length > 0) {
      const pathSegments = window.location.pathname.split("/");
      const urlCountry = pathSegments[1]?.toUpperCase();
      const matchedStore = stores.find((store) => store.code === urlCountry);

      if (matchedStore && matchedStore.trang_thai === false) {
        window.location.href = "/";
        return;
      }

      const storeToSet =
        matchedStore || stores.find((s) => s.code === "VN") || stores[0];

      if (storeToSet.trang_thai !== false) {
        setCurrentStore(storeToSet);
      } else {
        window.location.href = "/";
      }
    }
  }, [stores, window.location.pathname]);

  // 3. Socket Real-time (Đã tối ưu dependency [])
  useEffect(() => {
    const apiBaseUrl = productApi.defaults.baseURL || "";
    let socketUrl = "";

    try {
      socketUrl = new URL(apiBaseUrl).origin;
    } catch (e) {
      socketUrl = window.location.origin;
    }
    
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log(
        `✅ StoreContext: Đã kết nối Socket tới Product Server thực tế tại: ${socketUrl}`,
      );
    });

    socket.on("connect_error", () => {
      console.warn(`⚠️ StoreContext: Không thể kết nối tới Socket server tại ${socketUrl}.`);
    });

    socket.on("store_status_changed", (data) => {
      console.log("📩 StoreContext nhận tín hiệu thay đổi thị trường:", data);

      const activeStore = currentStoreRef.current;
      if (
        activeStore &&
        String(activeStore.code).toUpperCase() ===
          String(data.ma_quoc_gia).toUpperCase() &&
        data.trang_thai === false
      ) {
        window.location.href = "/";
      }

      setStores((prev) =>
        prev.map((s) =>
          String(s.code).toUpperCase() ===
          String(data.ma_quoc_gia).toUpperCase()
            ? { ...s, trang_thai: data.trang_thai }
            : s,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []); // ✅ Để mảng rỗng để Socket chỉ khởi tạo 1 lần duy nhất

  // --- HÀM FORMAT TIỀN TỆ ---
  const currencyMap = {
    vi: { currency: "VND", locale: "vi-VN", rate: 1 },
    en: { currency: "USD", locale: "en-US", rate: 0.00004 },
    zh: { currency: "CNY", locale: "zh-CN", rate: 0.00029 },
  };

  const currentCurrency = currencyMap[currentLanguage?.code] || currencyMap.vi;

  const formatPrice = (priceInVnd) => {
    if (priceInVnd === null || priceInVnd === undefined) return "";
    const convertedPrice = priceInVnd * currentCurrency.rate;
    const formattedNumber = new Intl.NumberFormat(currentCurrency.locale, {
      minimumFractionDigits: currentCurrency.currency === "VND" ? 0 : 2,
      maximumFractionDigits: currentCurrency.currency === "VND" ? 0 : 2,
    }).format(convertedPrice);

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