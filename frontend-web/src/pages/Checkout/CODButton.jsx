import React from 'react';

export default function CODButton({ amount, onClick, disabled }) {
  const isBtnDisabled = disabled || !amount || amount <= 0;

  return (
    <div className="w-full relative z-10">
      <button
        type="button"
        disabled={isBtnDisabled}
        onClick={onClick}
        className={`w-full h-[45px] flex items-center justify-center gap-2 font-semibold text-white transition-all rounded-sm
          ${isBtnDisabled 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            : 'bg-[#10b981] hover:bg-[#059669] active:bg-[#047857] shadow-sm'
          }`}
        style={{ height: '44px' }}
      >
        {/* Icon xe tải giao hàng bằng SVG mượt mà */}
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12.5-10.5l2.25 3H17V8h1.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <span className="text-[15px]">Thanh toán khi nhận hàng (COD)</span>
      </button>
    </div>
  );
}