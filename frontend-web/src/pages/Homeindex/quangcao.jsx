import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

export default function QuangCao({ t }) {
  return (
    <div className="w-full space-y-6 text-left">
     {/* 1. TOP HERO BANNER */}
      <div className="px-6 md:px-10 pt-4 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f4faf7] via-white to-orange-50/20 rounded-[40px] pb-6 border border-[#e6f0ed]">
        {/* Bên trái: Tiêu đề và Ưu đãi theo thương hiệu Demi Mart */}
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl md:text-[46px] font-black text-[#161b22] tracking-tight leading-[1.1]">
            Chợ Việt Nam & Châu Á<br />
            <span className="text-[#006c49]">trực tuyến lớn nhất Mỹ</span>
          </h1>
          
          <div className="inline-flex flex-col items-start gap-1">
            <div className="bg-[#fea619] text-[#684000] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-sm flex items-center gap-1.5">
              🚚 Giao hàng miễn phí cho 5 đơn đầu tiên
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-3">
              *Giá trị tối thiểu $35, thay đổi theo từng khu vực
            </p>
          </div>
        </div>

        {/* Giữa & Phải: Hình ảnh minh họa + QR Code tải app Demi Mart */}
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {/* Badge quà tặng răng cưa và các bóng sản phẩm trang trí chuẩn UI */}
          <div className="relative flex items-center gap-4 pl-4">
            
            {/* 1. Badge $25 Trị giá* dáng răng cưa / hình sao lượn sóng */}
            <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-md select-none rotate-[-5deg]">
              {/* Tạo hình răng cưa lượn sóng bằng nhiều lớp hình vuông xoay góc */}
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-0 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-12 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-45 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-75 scale-105"></div>
              
              {/* Lớp nền hồng bên trong */}
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-0"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-12"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-45"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-75"></div>
              
              {/* Nội dung chữ */}
              <div className="relative z-10 text-center text-white flex flex-col items-center justify-center -space-y-1">
                <span className="text-xl font-black tracking-tight">$25</span>
                <span className="text-[10px] font-bold tracking-tight">Trị giá*</span>
              </div>
            </div>

            {/* 2. Bóng tròn sản phẩm 1: Quả bưởi (Nền xanh dương nhạt) */}
            <div className="w-16 h-16 rounded-full bg-sky-200/70 border border-sky-100 flex items-center justify-center p-1 shadow-inner relative overflow-hidden transform translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=80&h=80&q=80" 
                className="w-11 h-11 object-contain drop-shadow-sm rotate-[10deg]" 
                alt="Bưởi da xanh" 
              />
            </div>

            {/* 3. Bóng tròn sản phẩm 2: Chai nước/sữa (Nền hồng tím nhạt ở phía sau trên cao) */}
            <div className="w-14 h-14 rounded-full bg-purple-100/80 border border-purple-50 flex items-center justify-center p-1 shadow-inner absolute -top-8 left-20 z-0">
              <img 
                src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=80&h=80&q=80" 
                className="w-9 h-9 object-contain drop-shadow-sm rotate-[-15deg]" 
                alt="Nước giải khát" 
              />
            </div>

          {/* 4. Hình ảnh xe giao hàng và túi hàng Demi Mart (Bản thu nhỏ Mini) */}
            <div className="relative z-10 ml-1 w-24 sm:w-28 md:w-32 lg:w-36 flex-shrink-0 flex flex-col items-center">
              <img 
                src="https://res.cloudinary.com/dm6fqzwhs/image/upload/v1781632779/Screenshot_2026-06-17_005741_zlraht.png" 
                className="w-full h-auto object-contain"
                alt="Delivery Truck"
              />
              <span className="absolute -bottom-1 bg-[#006c49] text-white font-black text-[8px] px-2 py-0.5 rounded shadow uppercase tracking-wider scale-90 whitespace-nowrap">
                Demi Mart
              </span>
            </div>

          </div>

          {/* Cụm QR Code tải App chuẩn theo màu #006c49 */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center p-1 border border-[#d6ede4]">
              {/* Giả lập mã QR code sử dụng màu xanh lục #006c49 */}
              <div className="w-full h-full bg-[radial-gradient(#006c49_2px,transparent_2px)] [background-size:4px_4px]"></div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                Quét mã để <br /> tải app <span className="text-[#006c49]">&rarr;</span>
              </p>
              <div className="flex gap-0.5 text-[#fea619]">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
              </div>
              <p className="text-[9px] text-[#006c49] font-black uppercase tracking-tight">Hơn 1 triệu lượt review</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BỐN BANNER DANH MỤC ĐẶC SẢN (GRID LAYOUT - FULL BACKGROUND IMAGES) */}
      <div className="px-6 md:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Danh mục 1: Xôi Chè (Màu hồng sen) */}
        <div className="h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Ảnh nền Full tràn viền */}
          <img 
            src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&h=300&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            alt="Xôi Chè Việt Nam" 
          />
          {/* Lớp phủ màu hồng sen đặc trưng giúp text hiển thị rõ nét */}
          <div className="absolute inset-0 bg-gradient-to-t from-pink-950/95 via-pink-700/60 to-pink-600/20 mix-blend-multiply"></div>
          
          <div className="space-y-1 relative z-10">
            <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Đặc sản</span>
            <h3 className="text-xl font-black tracking-tight drop-shadow-sm">Xôi Chè <br /> Việt Nam</h3>
            <p className="text-[11px] text-pink-100 font-medium max-w-[160px] leading-tight drop-shadow-sm">Dẻo thơm hương nếp ngọt thanh vị chè!</p>
          </div>
          <button className="w-7 h-7 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative z-10">
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Danh mục 2: Món chay (Màu xanh lá đậm) */}
        <div className="h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Ảnh nền Full tràn viền */}
          <img 
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            alt="Món chay Việt Nam" 
          />
          {/* Lớp phủ màu xanh lá đậm */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-800/60 to-transparent"></div>
          
          <div className="space-y-1 relative z-10">
            <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Thực phẩm thiết yếu</span>
            <h3 className="text-xl font-black tracking-tight drop-shadow-sm">Món chay <br /> Việt Nam</h3>
            <p className="text-[11px] text-green-100 font-medium max-w-[160px] leading-tight drop-shadow-sm">Nguyên liệu thanh đạm, bữa ăn hài hòa</p>
          </div>
          <button className="w-7 h-7 rounded-full bg-white text-emerald-800 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative z-10">
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Danh mục 3: Cà phê & Trà (Màu xanh ngọc) */}
        <div className="h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Ảnh nền Full tràn viền */}
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&h=300&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            alt="Cà phê & Trà" 
          />
          {/* Lớp phủ màu xanh Teal ngọc */}
          <div className="absolute inset-0 bg-gradient-to-t from-teal-950/95 via-teal-600/50 to-transparent"></div>
          
          <div className="space-y-1 relative z-10">
            <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Thực phẩm thiết yếu</span>
            <h3 className="text-xl font-black tracking-tight drop-shadow-sm">Cà phê & Trà</h3>
            <p className="text-[11px] text-teal-600 bg-white/95 px-2 py-0.5 rounded font-extrabold inline-block mt-1 shadow-sm">Cho mỗi ngày đều tràn năng lượng!</p>
          </div>
          <button className="w-7 h-7 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative z-10">
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Danh mục 4: Bánh mì (Màu vàng đất) */}
        <div className="h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300">
          {/* Ảnh nền Full tràn viền */}
          <img 
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            alt="Bánh Mì Việt Nam" 
          />
          {/* Lớp phủ màu nâu hổ phách / vàng đất */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/95 via-amber-700/50 to-transparent"></div>
          
          <div className="space-y-1 relative z-10">
            <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Đặc sản</span>
            <h3 className="text-xl font-black tracking-tight drop-shadow-sm">Bánh Mì</h3>
            <p className="text-[11px] text-amber-100 font-medium max-w-[160px] leading-tight drop-shadow-sm">Khám phá nguyên bản Bánh Mì Việt Nam</p>
          </div>
          <button className="w-7 h-7 rounded-full bg-white text-amber-700 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative z-10">
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

      </div>

      {/* 3. THANH THÔNG BÁO CHẤP NHẬN THANH TOÁN SNAP EBT */}
      <div className="mx-6 md:mx-10 bg-[#00875a] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600 shadow-sm relative overflow-hidden group cursor-pointer">
        <div className="flex items-center gap-4 relative z-10">
          {/* Logo SNAP giả lập hình tròn nền trắng */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
            <span className="text-[#00875a] font-black text-xs tracking-tight">SNAP</span>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
              Chúng tôi hiện chấp nhận thanh toán SNAP EBT
            </h4>
            <p className="text-[11px] text-emerald-100 font-medium">
              Sắm thực phẩm Việt & được giao hàng miễn phí <span className="opacity-60 text-[9px] font-normal ml-1">*Điều kiện EBT khác nhau theo từng tiểu bang.</span>
            </p>
          </div>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-white text-[#00875a] flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform flex-shrink-0">
          <ArrowRight size={16} strokeWidth={3} />
        </div>
      </div>

    </div>
  );
}