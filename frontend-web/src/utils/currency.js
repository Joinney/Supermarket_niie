const EXCHANGE_RATES = {
  us: 27000, // 1 USD = 27,000 VND
  cn: 4000,  // 1 CNY = 4,000 VND
};

// =====================================================================
// LOGIC CHUYỂN ĐỔI TIỀN TỆ ĐỒNG BỘ TOÀN HỆ THỐNG DEMI MART
// =====================================================================
export const formatCurrency = (amountVND, storeCode = 'vn') => {
  if (amountVND === undefined || amountVND === null) return "0đ";
  
  const currentCode = storeCode.toLowerCase();
  
  // Kịch bản 1: Cửa hàng Mỹ (US)
  if (currentCode === 'us') {
    const rate = EXCHANGE_RATES.us;
    return "$" + (amountVND / rate).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  // Kịch bản 2: Cửa hàng Trung Quốc (CN)
  if (currentCode === 'cn') {
    const rate = EXCHANGE_RATES.cn;
    return "¥" + (amountVND / rate).toLocaleString('zh-CN', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    });
  }
  
  // Kịch bản mặc định: Cửa hàng Việt Nam (VN) hoặc lỗi mã kho
  return amountVND.toLocaleString('vi-VN') + "đ";
};