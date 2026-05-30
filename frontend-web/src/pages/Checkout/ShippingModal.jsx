import React from 'react';
import { X, Truck, Check } from 'lucide-react';

export default function ShippingModal({ isOpen, onClose, onSelect, shippingMethods, selectedMethodId }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Nút đóng Modal */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        <h2 className="font-black text-xl mb-6 text-[#006c49] flex items-center gap-2">
          <Truck size={24} /> Chọn phương thức vận chuyển
        </h2>

        {/* Danh sách các gói cước trả về từ API GHN */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {shippingMethods && shippingMethods.length > 0 ? (
            shippingMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => {
                  onSelect(method);
                  onClose();
                }}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between relative group ${
                  selectedMethodId === method.id
                    ? 'border-[#006c49] bg-emerald-50 text-[#006c49]'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    selectedMethodId === method.id ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Truck size={20} className={selectedMethodId === method.id ? 'text-[#006c49]' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 group-hover:text-[#006c49] transition-colors">
                      {method.name}
                    </p>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                      {method.days}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-base text-slate-900">
                    {method.cost.toLocaleString()}đ
                  </span>
                  {selectedMethodId === method.id && (
                    <div className="w-5 h-5 rounded-full bg-[#006c49] flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-bold">Không tìm thấy phương thức giao hàng phù hợp.</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra lại địa chỉ nhận hàng của bạn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}