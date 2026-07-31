import React, { useState, useEffect } from "react";
import { History, RefreshCcw } from "lucide-react";
import { authApi } from "../../../api/axios"; // Đường dẫn tuỳ thuộc thư mục của bạn

export default function Tabvidemipay({ profile }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      // 🌟 SỬA LỖI 1: Bắt đúng trường user_id thay vì id
      const currentUserId = profile?.user_id || profile?.id; 
      if (!currentUserId) return;

      try {
        // 🌟 SỬA LỖI 2: Thêm tiền tố /auth/ vào url để khớp với backend
        const res = await authApi.get(`/auth/wallet/transactions/${currentUserId}`);
        if (res.data && res.data.success) {
          setTransactions(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử ví:", error);
      }
    };
    
    fetchTransactions();
  }, [profile]); 

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', ' -');
  };

  // 🌟 THÊM HÀM FORMAT TIỀN TỆ & MÀU SẮC
  const formatTransaction = (amount, type) => {
    const numAmount = Number(amount);
    const absAmount = Math.abs(numAmount);
    const formattedNumber = absAmount.toLocaleString('vi-VN') + 'đ';

    // Nếu là thanh toán hoặc số tiền âm -> Màu đỏ và dấu trừ
    if (type === 'payment' || numAmount < 0) {
      return {
        text: `-${formattedNumber}`,
        textColor: 'text-red-600',
      };
    } 
    
    // Nếu là nạp/hoàn tiền -> Màu xanh và dấu cộng
    return {
      text: `+${formattedNumber}`,
      textColor: 'text-[#006c49]', 
    };
  };

  return (
    <div className="w-full animate-fadeIn space-y-6">
      {/* LỊCH SỬ GIAO DỊCH */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-[#006c49]" /> Lịch sử giao dịch ví
          </h3>
        </div>

        <div className="space-y-3">
          {transactions.map((txn) => {
            // 🌟 GỌI HÀM FORMAT CHO TỪNG GIAO DỊCH
            const { text, textColor } = formatTransaction(txn.amount, txn.type);

            return (
              <div key={txn.id} className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-4 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                    <RefreshCcw size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{txn.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{txn.description}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">{formatTime(txn.created_at)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {/* 🌟 HIỂN THỊ BIẾN TEXT VÀ MÀU SẮC ĐỘNG TẠI ĐÂY */}
                  <p className={`font-black text-base ${textColor}`}>
                    {text}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Thành công</p>
                </div>
              </div>
            );
          })}
          
          {transactions.length === 0 && (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <History size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">Chưa có giao dịch nào</p>
              <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-[200px]">
                Khi bạn hủy đơn hàng đã thanh toán qua VNPay/PayPal, tiền hoàn sẽ lập tức xuất hiện tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}