import React from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedMethod,
  finalTotal = 0,  
  walletBalance = 0
}) {
  if (!isOpen) return null;

// 🌟 ĐỒNG BỘ ĐỔI HẾT THÀNH "icon:" ĐỂ KHÔNG BỊ TRẮNG XÓA NỮA THUẬN ƠI
  const paymentMethods = [
    { 
      id: 'COD', 
      name: 'Thanh toán khi nhận hàng (COD)', 
      description: 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận kiện hàng.',
      icon: (
        <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      defaultBg: 'bg-emerald-100/40 hover:bg-emerald-100/70',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-200/60',
      textColor: 'text-emerald-800'
    },
    { 
      id: 'PayPal', 
      name: 'PayPal System', 
      description: 'Thanh toán quốc tế an toàn tuyệt đối qua cổng giao dịch PayPal (USD).',
      icon: (
        <svg className="w-7 h-7 text-[#003087]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.354a.641.641 0 0 1 .632-.538h6.497c4.27 0 7.043 2.13 6.497 7.644-.504 5.084-3.714 7.644-7.95 7.644H8.441a.214.214 0 0 0-.212.247l-.94 5.438a.213.213 0 0 0 .213.243z"/>
          <path d="M11.936 8.01c-.504 5.083-3.713 7.644-7.95 7.644H1.831a.214.214 0 0 0-.212.246l-.94 5.439a.213.213 0 0 0 .213.243h3.407a.641.641 0 0 0 .633-.538l.947-5.485a.214.214 0 0 1 .212-.177h1.493c3.843 0 6.339-1.916 6.83-6.83.435-4.356-1.571-6.195-5.176-6.195H7.076a.641.641 0 0 0-.633.538L5.19 12.012a.214.214 0 0 1-.212.176H3.485a.214.214 0 0 1-.212-.246l1.242-7.185a.641.641 0 0 1 .633-.538h4.167c3.605 0 5.611 1.839 5.176 6.196z" opacity="0.35"/>
        </svg>
      ),
      defaultBg: 'bg-blue-100/40 hover:bg-blue-100/70',
      activeBorder: 'border-[#003087]',
      activeBg: 'bg-[#003087]/20',
      textColor: 'text-[#003087]'
    },
    { 
      id: 'VNPay', 
      name: 'VNPay Cổng Chính', 
      description: 'Quét mã QR-Code ứng dụng ngân hàng hoặc thẻ ATM / Visa nội địa.',
      icon: (
        <div className="flex flex-col items-center justify-center select-none leading-none">
          <span className="font-extrabold italic text-[15px] text-[#005baa]">VN</span>
          <span className="font-black italic text-[11px] text-[#e02020] tracking-tighter mt-0.5">PAY</span>
        </div>
      ),
      defaultBg: 'bg-sky-100/50 hover:bg-sky-100/80',
      activeBorder: 'border-[#005baa]',
      activeBg: 'bg-[#005baa]/20',
      textColor: 'text-[#005baa]'
    },
    { 
      id: 'MoMo', 
      name: 'Ví Điện Tử MoMo', 
      description: 'Kết nối siêu tốc và bảo mật với ví điện tử số 1 Việt Nam.',
      icon: (
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MoMo_Logo_App.svg/960px-MoMo_Logo_App.svg.png" 
          alt="MoMo" 
          className="w-full h-full object-contain rounded-md"
        />
      ),
      defaultBg: 'bg-pink-100/40 hover:bg-pink-100/70',
      activeBorder: 'border-[#a50064]',
      activeBg: 'bg-[#a50064]/20',
      textColor: 'text-[#a50064]'
    },
    { 
      id: 'Banking', 
      name: 'Chuyển Khoản Ngân Hàng', 
      description: 'Tạo mã VietQR chuyển khoản nhanh liên ngân hàng 24/7.',
      icon: (
        <div className="flex flex-col items-center justify-center select-none font-sans leading-none border-2 border-blue-600 rounded px-1 py-0.5">
          <span className="font-black text-[12px] text-blue-700 tracking-tighter">Viet</span>
          <span className="font-extrabold text-[10px] text-red-500 tracking-tight mt-0.5">QR</span>
        </div>
      ),
      defaultBg: 'bg-indigo-100/40 hover:bg-indigo-100/70',
      activeBorder: 'border-blue-600',
      activeBg: 'bg-blue-200/50',
      textColor: 'text-blue-700'
    }
  ];

  // 2. 🌟 TỰ ĐỘNG CHÈN VÍ VÀO ĐẦU DANH SÁCH NẾU SỐ DƯ ĐỦ
  if (Number(walletBalance) >= Number(finalTotal) && Number(finalTotal) > 0) {
    paymentMethods.unshift({
      id: 'DemiPay',
      name: 'Ví DemiPay',
      description: `Thanh toán ngay bằng số dư ví. (Khả dụng: ${Number(walletBalance).toLocaleString('vi-VN')}đ)`,
      icon: <Wallet className="w-7 h-7 text-[#006c49]" strokeWidth={2} />,
      defaultBg: 'bg-[#e6f0ed]/60 hover:bg-[#e6f0ed]',
      activeBorder: 'border-[#006c49]',
      activeBg: 'bg-[#006c49]/15',
      textColor: 'text-[#006c49]'
    });
  }

  return (
    // 🎯 ĐẨY XUỐNG THÊM: Tăng khoảng cách từ đỉnh lên pt-[175px] để popup né xa hẳn Header
    <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto pt-[175px]">
      {/* LỚP NỀN MỜ CỦA MODAL */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      ></div>

      {/* KHUNG POPUP CHÍNH */}
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl relative z-10 flex flex-col max-h-[68vh] overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-top-5 duration-200">
        
        {/* TIÊU ĐỀ POPUP */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-[#006c49]">
            <CreditCard size={18} className="stroke-[2.5]" />
            <h3 className="font-black text-xs lg:text-sm uppercase tracking-wider">Phương thức thanh toán</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-lg border border-slate-200/60 shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

{/* DANH SÁCH PHƯƠNG THỨC THANH TOÁN SẶC SỠ ĐỒNG BỘ THƯƠNG HIỆU */}
<div className="p-4 overflow-y-auto space-y-2.5 text-left flex-1">
  {paymentMethods.map((method) => {
    const isSelected = selectedMethod === method.id;
    return (
      <button
        key={method.id}
        onClick={() => {
          onSelect(method.id);
          onClose();
        }}
        className={`w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3.5 shadow-sm group active:scale-[0.99] ${
          isSelected 
            ? `${method.activeBorder} ${method.activeBg} shadow-md` 
            : `border-slate-200/60 ${method.defaultBg}`
        }`}
      >
        {/* 🎯 ĐÃ ĐỔI THÀNH METHOD.ICON & THÊM BACKGROUND HỒNG NẾU LÀ MOMO */}
        <div className={`w-10 h-10 border border-slate-200/60 rounded-xl overflow-hidden shadow-inner flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
          method.id === 'MoMo' ? 'bg-[#a50064] p-1.5' : 'bg-white'
        }`}>
          {method.icon}
        </div>

        {/* KHỐI CHỮ MÔ TẢ */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center justify-between w-full">
            <span className={`text-[11px] font-black uppercase tracking-wide transition-colors ${
              isSelected ? method.textColor : 'text-slate-700'
            }`}>
              {method.name}
            </span>
            {isSelected && (
              <span className="w-2 h-2 bg-current rounded-full shadow-sm animate-pulse" style={{ color: method.textColor }}></span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 font-bold leading-relaxed pr-2">
            {method.description}
          </p>
        </div>
      </button>
    );
  })}
</div>

        {/* FOOTER POPUP */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-right flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 font-black text-[10px] uppercase tracking-widest text-slate-700 rounded-lg transition-colors shadow-sm"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}