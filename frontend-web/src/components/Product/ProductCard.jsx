import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useStore } from '../../context/StoreContext';

const ProductCard = ({ p }) => {
  // 1. GỌI CONTEXT STORE RA ĐỂ LẤY QUỐC GIA HIỆN TẠI
  const { currentStore } = useStore();

  const defaultImage = "https://placehold.co/300x300?text=Demi+Mart";
  const mainImage = p.hinh_anh_chinh || defaultImage;
  const currentPrice = Number(p.gia_ban_thap_nhat) || 0;
  
  // 2. Ưu tiên đường dẫn link chạy theo store người dùng đang chọn
  const country = currentStore?.code || p.country_code || 'vn'; 
  const category = p.slug_danh_muc || 'san-pham';
  const stockCount = p.tong_ton_kho || 0;

  return (
    <Link to={`/${country}/product/${category}/${p.ma_san_pham}`} className="flex-shrink-0">
      <div className="w-full group cursor-pointer font-sans bg-white p-2 rounded-[32px] hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 border border-transparent hover:border-slate-50">
        <div className="relative aspect-square bg-[#f8fafc] rounded-[24px] overflow-hidden mb-3 border border-slate-50 group-hover:border-[#e6f0ed] transition-all">
          <img 
            src={mainImage} 
            loading="lazy"
            onError={(e) => { e.target.src = defaultImage; }}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500 p-4" 
            alt={p.ten_san_pham} 
          />
          <button 
            className="absolute bottom-3 right-3 w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg text-[#006c49] hover:bg-[#006c49] hover:text-white transition-all transform active:scale-90 z-20"
            onClick={(e) => { e.preventDefault(); console.log("Thêm vào giỏ:", p.ma_san_pham); }}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-1 px-1">
          <div className="flex items-baseline gap-2">
            {/* 3. BỌC HÀM TIỀN TỆ VÀO ĐÂY */}
            <span className="text-[#ff4d4f] font-black text-lg leading-none">
              {formatCurrency(currentPrice, currentStore?.code)}
            </span>
          </div>
          <p className="text-[13px] text-[#161b22] leading-tight line-clamp-2 h-8 font-bold group-hover:text-[#006c49] transition-colors">{p.ten_san_pham}</p>
          <div className="flex gap-1 items-center pt-0.5">
            <span className="bg-[#e6f0ed] text-[#006c49] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{p.ten_danh_muc || 'Siêu thị'}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">SỐ LƯỢNG: {stockCount}</p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;