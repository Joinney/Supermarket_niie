import React from 'react';
import { Wallet } from 'lucide-react';

export default function DemiPayButton({ amount, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-[#006c49] text-white font-black text-sm lg:text-base uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#006c49]/20 hover:bg-[#005a3d] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      <Wallet size={22} strokeWidth={2.5} />
      Thanh toán bằng Ví DemiPay ({(amount || 0).toLocaleString('vi-VN')}đ)
    </button>
  );
}