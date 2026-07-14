import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Plus, Sliders } from "lucide-react";

export default function Global() {
  // ----------------------------------------------------------------
  // 🌟 ĐIỀU CHỈNH LAYOUT FULL-WIDTH (TRÀN VIỀN 2 BÊN) TỐI ƯU 
  // ----------------------------------------------------------------
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("id", "global-fluid-layout-override");
    style.innerHTML = `
      aside, [class*="SidebarKhachHang"], [class*="sidebar"], #sidebar {
        display: none !important;
        width: 0px !important;
        position: absolute !important;
      }
      main, [class*="MainLayout"], .content-wrapper, #root > div {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0px !important;
        padding-left: 0px !important;
        padding-right: 0px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const overrideStyle = document.getElementById("global-fluid-layout-override");
      if (overrideStyle) overrideStyle.remove();
    };
  }, []);

  // Bộ đếm ngược thời gian Flash Deals
  const [timeLeft, setTimeLeft] = useState(38652);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const totalSecs = seconds || 0;
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const s = String(totalSecs % 60).padStart(2, "0");
    return { h, m, s };
  };
  const time = formatTime(timeLeft);

  // Mảng dữ liệu sản phẩm đa dạng đổi sang mệnh giá VNĐ (đ) chuẩn Việt Nam
  const sampleProducts = [
    { id: 1, tag: 'BÁN CHẠY', tagBg: 'bg-red-600', name: 'Bộ Gia Vị Truyền Thống Thượng Hạng Nguyên Chất Tự Nhiên', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80', price: 349000, oldPrice: 550000, unit: 'Bộ 6 chai' },
    { id: 2, tag: 'MỚI', tagBg: 'bg-blue-500', name: 'Combo Bánh Cuốn Truyền Thống Tokyo Chuẩn Vị Nhật', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80', price: 499000, oldPrice: null, unit: 'Hộp 12 cái' },
    { id: 3, tag: 'GIẢM GIÁ', tagBg: 'bg-orange-500', name: 'Dầu Ô Liu Nguyên Chất Extra Virgin Luxury Olive Cao Cấp', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80', price: 419000, oldPrice: 590000, unit: 'Chai 500ml' },
    { id: 4, tag: 'ORGANIC', tagBg: 'bg-emerald-700', name: 'Trà Xanh Thượng Hạng Nguyên Chất Hữu Cơ Organic', img: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=300&q=80', price: 289000, oldPrice: null, unit: 'Hộp 200g' },
    { id: 5, tag: 'HOT', tagBg: 'bg-orange-600', name: 'Hạt Nêm Rong Biển Tự Nhiên Đậm Đà Hộp Cao Cấp', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80', price: 199000, oldPrice: 280000, unit: 'Gói 500g' },
    { id: 6, tag: 'TIẾT KIỆM', tagBg: 'bg-yellow-500', name: 'Bột Ớt Hàn Quốc Siêu Cay Mịn Chuẩn Vị Nhập Khẩu', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80', price: 129000, oldPrice: null, unit: 'Gói 250g' }
  ];

  const countries = [
    { name: "Việt Nam", flag: "https://flagcdn.com/w80/vn.png" },
    { name: "Nhật Bản", flag: "https://flagcdn.com/w80/jp.png" },
    { name: "Hàn Quốc", flag: "https://flagcdn.com/w80/kr.png" },
    { name: "Hoa Kỳ", flag: "https://flagcdn.com/w80/us.png" },
    { name: "Thái Lan", flag: "https://flagcdn.com/w80/th.png" },
    { name: "Ý", flag: "https://flagcdn.com/w80/it.png" },
    { name: "Philipin", flag: "https://flagcdn.com/w80/ph.png" },
    { name: "Malaysia", flag: "https://flagcdn.com/w80/my.png" }
  ];

  // Hàm định dạng hiển thị mệnh giá tiền Việt Nam
  const formatVND = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  };

  // Component Card Sản phẩm tối ưu: Sửa nút thêm sản phẩm đảm bảo luôn luôn tròn đều 100%
  const ProductCard = ({ prod, rank }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 relative flex flex-col justify-between group hover:shadow-md transition duration-200">
      <div>
        {/* Nhãn tag góc trái */}
        {prod.tag && !rank && (
          <span className={`absolute top-2 left-2 ${prod.tagBg} text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase z-10`}>
            {prod.tag}
          </span>
        )}

        {/* Rank Badge dành riêng cho Bảng xếp hạng */}
        {rank && (
          <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white z-10 ${
            rank === 1 ? 'bg-amber-500' : rank === 2 ? 'bg-slate-400' : rank === 3 ? 'bg-amber-700' : 'bg-gray-300'
          }`}>
            {rank}
          </div>
        )}
        
        {/* Khối ảnh sản phẩm */}
        <div className="w-full h-28 flex items-center justify-center overflow-hidden rounded bg-gray-50 mb-2">
          <img src={prod.img} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition duration-300" />
        </div>
        
        {/* Quy cách */}
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{prod.unit}</p>
        
        {/* Tên sản phẩm */}
        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mt-0.5 mb-2 leading-tight min-h-[32px] group-hover:text-green-700 cursor-pointer">
          {prod.name}
        </h4>
      </div>

      <div className="flex items-end justify-between mt-1">
        {/* Giá bán và giá cũ */}
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span className="text-green-700 font-black text-xs leading-none">{formatVND(prod.price)}</span>
            {prod.oldPrice && <span className="text-gray-400 line-through text-[9px] mt-1">{formatVND(prod.oldPrice)}</span>}
          </div>
        </div>
        
        {/* 🌟 Cải tiến: Khóa cứng thuộc tính CSS flex-shrink, width, height để nút luôn có dạng tròn đều hoàn hảo nhất */}
        <button className="w-7 h-7 flex-shrink-0 bg-[#15803d] hover:bg-[#166534] text-white rounded-full flex items-center justify-center shadow transition duration-150 transform hover:scale-105 active:scale-95">
          <Plus size={14} strokeWidth={3} className="block" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#f9fafb] min-h-screen p-4 md:p-6 lg:px-10 max-w-[1440px] mx-auto select-none">
      
      {/* ================= KHỐI ĐẦU TRANG ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Sidebar danh mục xanh đậm góc trái */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-fit overflow-hidden">
          <div className="bg-emerald-800 text-white p-3.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <span>☰</span> DANH MỤC
          </div>
          <ul className="text-[11px] font-bold text-gray-700">
            {[
              "Thực phẩm hữu cơ", "Hải sản tươi sống", "Rau củ hữu cơ", 
              "Thịt & Trứng", "Đồ uống & Bánh", "Bánh kẹo & Đồ ăn vặt", 
              "Chăm sóc nhà cửa", "Sức khỏe & Làm đẹp"
            ].map((cat, idx) => (
              <li key={idx} className="flex justify-between items-center px-4 py-3 hover:bg-emerald-50 hover:text-green-700 border-b border-gray-50 cursor-pointer transition">
                <span>{cat}</span>
                <ChevronRight size={12} className="text-gray-400" />
              </li>
            ))}
          </ul>
        </div>

        {/* Khối nội dung slide và banner bên phải */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Cụm 3 Banner nhỏ trên cùng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 rounded-lg bg-cover bg-center p-3 flex flex-col justify-between relative shadow-sm overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80')" }}>
              <div className="absolute inset-0 bg-black/10"></div>
              <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-max z-10">SẢN PHẨM NỔI BẬT</span>
              <p className="font-bold text-gray-900 text-xs bg-white/90 p-1.5 rounded w-full z-10 truncate">Gia Vị Đặc Sản Việt</p>
            </div>

            <div className="h-32 rounded-lg bg-cover bg-center p-3 flex flex-col justify-between relative shadow-sm overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80')" }}>
              <div className="absolute inset-0 bg-black/10"></div>
              <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-max z-10">KHUYẾN MÃI HÈ</span>
              <p className="font-bold text-gray-900 text-xs bg-white/90 p-1.5 rounded w-full z-10 truncate">Combo Mâm Cuốn</p>
            </div>

            {/* Banner Khuyến mãi cực khủng: Đã tích hợp hình ảnh poster mới của bạn */}
            <div className="rounded-lg flex flex-col justify-between relative overflow-hidden h-32 shadow-sm border border-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80" 
                alt="Khuyến Mãi Cực Khủng" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 bg-emerald-950/70 z-10"></div>
              <div className="z-20 p-4 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[9px] tracking-wider text-emerald-300 font-bold uppercase">100% Organic</span>
                  <h3 className="text-sm font-black text-white mt-0.5 leading-tight">KHUYẾN MÃI CỰC KHỦNG</h3>
                </div>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] py-1 px-3 rounded w-max transition">
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>

          {/* Khối CÁC SẢN PHẨM hàng đầu */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <h2 className="text-emerald-800 font-black text-sm flex items-center gap-2 uppercase tracking-wide">
                <span className="w-1 h-4 bg-emerald-700 inline-block"></span> Các Sản Phẩm
              </h2>
              <div className="flex gap-1">
                <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft size={12} /></button>
                <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight size={12} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {sampleProducts.map((prod) => (
                <ProductCard key={`top-${prod.id}`} prod={prod} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ================= KHÁM PHÁ QUỐC GIA ================= */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-8">
        <h3 className="text-gray-800 font-bold text-xs mb-4 flex items-center gap-2 uppercase tracking-wider">
          🌐 Khám phá quốc gia
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 text-center">
          {countries.map((c, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="w-12 h-12 rounded-full mx-auto border border-gray-200 flex items-center justify-center overflow-hidden p-0.5 group-hover:border-green-600 group-hover:scale-105 transition duration-200">
                <img src={c.flag} alt={c.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <p className="text-[11px] font-bold mt-2 text-gray-600 group-hover:text-green-700 transition">{c.name}</p>
            </div>
          ))}
        </div>
        <button className="w-full text-center border border-gray-200 rounded mt-4 py-2 text-[10px] font-black text-gray-500 hover:bg-gray-50 transition uppercase tracking-wider">
          TẤT CẢ QUỐC GIA
        </button>
      </div>

      {/* ================= 1. KHUYẾN MÃI NHANH (FLASH DEALS) ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-red-600 font-black text-sm uppercase flex items-center gap-1 tracking-wide">
              ⚡ Khuyến mãi nhanh
            </h2>
            <div className="flex gap-0.5 text-[10px] font-black text-white ml-2">
              <span className="bg-red-600 px-1.5 py-0.5 rounded">{time.h}</span>:
              <span className="bg-red-600 px-1.5 py-0.5 rounded">{time.m}</span>:
              <span className="bg-red-600 px-1.5 py-0.5 rounded">{time.s}</span>
            </div>
          </div>
          <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-green-700">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod) => (
            <ProductCard key={`flash-${prod.id}`} prod={prod} />
          ))}
        </div>
      </div>

      {/* ================= 2. BẢNG XẾP HẠNG (RANKING) ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
          <h2 className="text-emerald-800 font-black text-sm uppercase flex items-center gap-2">
            🏆 Bảng xếp hạng bán chạy nhất
          </h2>
          <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-green-700">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod, index) => (
            <ProductCard key={`rank-${prod.id}`} prod={prod} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* ================= 3. HÀNG MỚI (NEW ARRIVALS) ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
          <h2 className="text-emerald-800 font-black text-sm uppercase">✨ Hàng mới về</h2>
          <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-green-700">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod) => {
            const newProd = { ...prod, tag: "NEW", tagBg: "bg-blue-500" };
            return <ProductCard key={`new-${prod.id}`} prod={newProd} />;
          })}
        </div>
      </div>

      {/* ================= 4. BÁN CHẠY NHẤT (BEST SELLERS) ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
          <h2 className="text-emerald-800 font-black text-sm uppercase">🔥 Bán chạy nhất</h2>
          <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-green-700">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod) => {
            const hotProd = { ...prod, tag: "HOT", tagBg: "bg-red-600" };
            return <ProductCard key={`hot-${prod.id}`} prod={hotProd} />;
          })}
        </div>
      </div>

      {/* ================= BANNER GIỮA TRANG ================= */}
      <div className="w-full bg-cover bg-center h-36 rounded-lg mb-8 flex items-center justify-center relative overflow-hidden shadow-inner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80')" }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="z-10 text-center text-white px-4">
          <h2 className="text-xl md:text-2xl font-black tracking-wide">Lễ hội ẩm thực quốc tế - Giảm đến 40%</h2>
          <button className="mt-2.5 bg-emerald-700 hover:bg-emerald-800 font-bold text-[11px] py-1.5 px-5 rounded transition uppercase tracking-wider">
            Mua sắm ngay
          </button>
        </div>
      </div>

      {/* ================= 5. ĐANG GIẢM GIÁ (ON SALE) ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
          <h2 className="text-emerald-800 font-black text-sm uppercase">🏷️ Đang giảm giá mạnh</h2>
          <a href="#" className="text-[11px] font-bold text-gray-400 hover:text-green-700">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod) => {
            const saleProd = { ...prod, tag: "SALE -30%", tagBg: "bg-orange-500", oldPrice: 380000 };
            return <ProductCard key={`sale-${prod.id}`} prod={saleProd} />;
          })}
        </div>
      </div>

      {/* ================= 6. GỢI Ý CHO BẠN ================= */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
          <h2 className="text-emerald-800 font-black text-sm uppercase">💡 Gợi ý dành cho bạn</h2>
          <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded text-[10px] font-bold text-gray-500 flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition">
            <Sliders size={10} /> Làm mới
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sampleProducts.map((prod) => (
            <ProductCard key={`rec-${prod.id}`} prod={prod} />
          ))}
        </div>
      </div>

      {/* ================= CAM KẾT CHÂN TRANG ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-6 text-xs text-gray-600 font-bold">
        {[
          { title: "100% Chính hãng", desc: "Cam kết nguồn gốc giấy tờ rõ ràng", icon: "🛡️" },
          { title: "Giao hàng tận nơi", desc: "Vận chuyển nhanh toàn quốc", icon: "🚚" },
          { title: "Hỗ trợ 24/7", desc: "Tận tình giải đáp thắc mắc", icon: "💬" },
          { title: "Bảo mật thanh toán", desc: "An tâm giao dịch mua sắm", icon: "💳" }
        ].map((badge, bIdx) => (
          <div key={bIdx} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded shadow-sm">
            <span className="text-xl text-green-700">{badge.icon}</span>
            <div className="text-left leading-tight">
              <p className="font-black text-gray-800 text-[11px] uppercase tracking-wide">{badge.title}</p>
              <p className="text-[10px] text-gray-400 font-normal mt-0.5">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}