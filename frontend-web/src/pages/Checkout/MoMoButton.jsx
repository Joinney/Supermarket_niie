import React from 'react';

export default function MoMoButton({ amount, onClick, disabled }) {
  const isBtnDisabled = disabled || !amount || amount <= 0;

  return (
    <div className="w-full relative z-10">
      <button
        type="button"
        disabled={isBtnDisabled}
        onClick={onClick}
        className={`w-full h-[44px] flex items-center justify-center gap-3 font-semibold text-white transition-all rounded-[4px]
          ${isBtnDisabled 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' 
            : 'bg-[#a50064] hover:bg-[#8c0054] active:scale-[0.99] shadow-md'
          }`}
      >
        {/* ⚡ Đã đổi sang URL ảnh mới theo yêu cầu */}
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MoMo_Logo_App.svg/960px-MoMo_Logo_App.svg.png" 
          alt="MoMo Logo" 
          className={`w-6 h-6 object-contain rounded-md bg-white p-0.5 ${isBtnDisabled ? 'opacity-40' : ''}`} 
        />

        <span className="text-[15px] tracking-wide">Thanh toán bằng Ví MoMo</span>
      </button>
    </div>
  );
}