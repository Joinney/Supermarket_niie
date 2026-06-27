import React from 'react';

export default function VNPAYButton({ amount, onClick, disabled }) {
  const isBtnDisabled = disabled || !amount || amount <= 0;

  return (
    <div className="w-full relative z-10">
      <button
        type="button"
        disabled={isBtnDisabled}
        onClick={onClick} // 🎯 Nhận lệnh trực tiếp từ Checkout.jsx truyền xuống
        className={`w-full h-[44px] flex items-center justify-center gap-2.5 font-medium text-white transition-all rounded-[4px]
          ${isBtnDisabled 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' 
            : 'bg-[#005baa] hover:bg-[#004b8c] active:scale-[0.99] shadow-md'
          }`}
      >
        <img 
          src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg" 
          alt="VNPAY Logo" 
          className={`h-5 object-contain bg-white px-2 py-0.5 rounded ${isBtnDisabled ? 'opacity-40' : ''}`}
        />
        <span className="text-[15px] tracking-wide">Thanh toán qua VNPAY</span>
      </button>
    </div>
  );
}