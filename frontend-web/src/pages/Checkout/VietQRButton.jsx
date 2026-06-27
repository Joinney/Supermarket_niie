import React from 'react';

export default function VietQRButton({ amount, onClick, disabled }) {
  const isBtnDisabled = disabled || !amount || amount <= 0;

  return (
    <div className="w-full relative z-10">
      <button
        type="button"
        disabled={isBtnDisabled}
        onClick={onClick}
        className={`w-full h-[44px] flex items-center justify-center gap-3 font-bold text-white transition-all rounded-[4px] relative overflow-hidden
          ${isBtnDisabled 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' 
            : 'bg-gradient-to-r from-blue-700 via-blue-600 to-red-500 hover:brightness-110 active:scale-[0.99] shadow-md'
          }`}
      >
        {/* Khối chữ VietQR vuông bo góc nền trắng nổi bật */}
        <div className="bg-white flex flex-col items-center justify-center leading-none px-1.5 py-0.5 rounded border border-slate-200 shadow-inner flex-shrink-0">
          <span className="font-black text-[11px] text-blue-700 tracking-tighter">Viet</span>
          <span className="font-extrabold text-[9px] text-red-500 tracking-tight mt-0.5">QR</span>
        </div>

        <span className="text-[15px] tracking-wide font-semibold">Thanh toán chuyển khoản nhanh</span>
      </button>
    </div>
  );
}