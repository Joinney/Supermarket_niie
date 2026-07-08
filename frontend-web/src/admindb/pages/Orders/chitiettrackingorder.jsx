import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, useMap, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- COMPONENT CON: Tự động di chuyển khung nhìn bản đồ về miền Trung để bao quát hành trình Việt Nam ---
function ChangeMapView({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], 6); 
      setTimeout(() => { map.invalidateSize(); }, 200);
    }
  }, [coords, map]);
  return null;
}

// --- CẤU HÌNH ICON TĨNH TRÊN PHÂN HỆ MAP ---
const warehouseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2271/2271068.png", // Icon Trạm kho bãi / Hậu cần xuất phát
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const truckIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048314.png", // Icon Xe tải đang chạy Live
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const receiverHomeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/869/869636.png", // 🌟 ĐÃ ĐỔI: Icon Ngôi nhà đại diện cho NGƯỜI NHẬN
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function Chitiettrackingorder() {
  const [mapCenter] = useState({ lat: 15.90306, lng: 105.80664 });

  // Tọa độ tuyến hành trình Quốc Lộ 1A Việt Nam
  const routeCoordinates = [
    [10.77688, 106.70081], // TP. Hồ Chí Minh
    [10.95743, 106.84272], 
    [11.94042, 109.21921], 
    [13.77492, 109.21953], 
    [16.05440, 108.20216], // Đà Nẵng
    [16.46371, 107.59086], 
    [18.67347, 105.68112], 
    [20.40112, 106.16834], 
    [21.02851, 105.80481], // Hà Nội
  ];

  const [truckPosition] = useState([17.4645, 106.6029]);

  const trackingData = {
    ma_van_don: "S2D-88291022",
    trang_thai: "IN TRANSIT",
    du_kien_giao: "24 Tháng 5, 2024",
    tai_xe: {
      ten: "Nguyễn Văn An",
      id: "DRV-9921",
      hang: "Hạng C",
      danh_gia: "4.8",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    },
    nguoi_nhan: {
      ten: "Lê Thị Thu Thảo",
      sdt: "0912 *** 888",
      dia_chi: "123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ",
      ghi_chu: "Lưu ý: Giao trong giờ hành chính, gọi trước 30p."
    },
    goi_hang: {
      loai: "Linh kiện điện tử",
      trong_luong: "4.5 kg",
      kich_thuoc: "30x20x15 cm",
      dich_vu: "Hỏa tốc (24h)"
    },
    thanh_toan: {
      phi_van_chuyen: "85,000 VND",
      tien_thu_ho: "1,200,000 VND",
      hinh_thuc: "Ví điện tử (Đã TT)",
      tong_cong: "1,285,000 VND"
    }
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left min-h-screen pb-10">
      
      {/* BREADCRUMB & TOP HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Link to="/admin/Donhang/DanhsachTrackingorder" className="hover:text-[#006c49] transition-colors">Shipments</Link>
            <span>❯</span>
            <span className="text-slate-600">#{trackingData.ma_van_don}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Vận đơn: {trackingData.ma_van_don}
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide">
              {trackingData.trang_thai}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm">
            🖨️ In vận đơn
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#006c49] hover:bg-[#005338] text-white rounded-xl text-xs font-bold transition shadow-sm">
            📞 Liên hệ tài xế
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. LỘ TRÌNH DI CHUYỂN TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-slate-900">Lộ trình di chuyển</h2>
              <span className="text-xs text-slate-400 font-bold">Dự kiến giao: {trackingData.du_kien_giao}</span>
            </div>

            <div className="relative border-l-2 border-dashed border-slate-200 ml-3 space-y-8 pb-2">
              {/* Bước 1 */}
              <div className="relative pl-6">
                <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#006c49] ring-4 ring-emerald-50"></span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Đã tiếp nhận đơn hàng</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Kho tổng Store2Door - TP. Hồ Chí Minh</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#006c49] text-white text-[9px] font-black rounded uppercase tracking-wider">
                        Đã xác nhận bởi bưu cục
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">22/05 - 08:35</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">22/05 - 08:30</span>
                    <button className="px-2 py-1 bg-[#006c49] hover:bg-[#005338] text-white rounded-md text-[10px] font-bold shadow-sm transition">
                      ☉ Theo dõi vị trí
                    </button>
                  </div>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="relative pl-6">
                <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#006c49] ring-4 ring-emerald-50"></span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Đã rời kho</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Vận chuyển đến trung tâm phân loại Miền Tây</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#006c49] text-white text-[9px] font-black rounded uppercase tracking-wider">
                        Đã xác nhận bởi bưu cục
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">22/05 - 14:50</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">22/05 - 14:45</span>
                    <button className="px-2 py-1 bg-[#006c49] hover:bg-[#005338] text-white rounded-md text-[10px] font-bold shadow-sm transition">
                      ☉ Theo dõi vị trí
                    </button>
                  </div>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="relative pl-6">
                <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-4 ring-amber-50 animate-pulse"></span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-amber-600">Đang vận chuyển</h4>
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[8px] font-black rounded">LIVE</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-bold mt-1">Đang trên đường đến Cần Thơ - Quốc lộ 1A</p>
                    
                    <div className="flex gap-2 mt-2.5">
                      <button className="px-3 py-1.5 bg-[#006c49] hover:bg-[#005338] text-white text-[11px] font-black rounded-xl transition shadow-sm">
                        ✓ Xác nhận đã tới bưu cục
                      </button>
                      <button disabled className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-300 text-[11px] font-black rounded-xl cursor-not-allowed">
                        ❯ Bắt đầu chặng kế tiếp
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-amber-600 font-black block mb-1">Hiện tại</span>
                    <button className="px-2 py-1 bg-[#006c49] hover:bg-[#005338] text-white rounded-md text-[10px] font-bold shadow-sm transition">
                      ☉ Theo dõi vị trí
                    </button>
                  </div>
                </div>
              </div>

              {/* Bước 4 */}
              <div className="relative pl-6 opacity-40">
                <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-slate-200 text-slate-400 text-[10px]">●</span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Đang giao hàng</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Bưu tá đang giao đến địa chỉ người nhận</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 font-bold block">Dự kiến: 24/05</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. MAP CONTAINER */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 relative overflow-hidden">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded-lg border border-dashed mb-3">
              <span>Hành trình vận chuyển liên tỉnh (QL1A):</span>
              <span className="font-bold text-[#006c49]">STATUS: LIVE COMPLIANT</span>
            </div>
            
            <div className="w-full h-[400px] rounded-2xl overflow-hidden border relative z-10 mt-1">
              <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={6} scrollWheelZoom={false} className="w-full h-full">
                <TileLayer attribution='&copy; <a href="https://www.esri.com/">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
                <ChangeMapView coords={mapCenter} />
                
                <Polyline positions={routeCoordinates} color="#006c49" weight={4} opacity={0.85} dashArray="3, 8" />

                {/* Trạm xuất phát */}
                <Marker position={[10.77688, 106.70081]} icon={warehouseIcon}>
                  <Popup><span className="text-xs font-bold">📍 Xuất phát: Kho bưu cục TP.HCM</span></Popup>
                </Marker>

                {/* Trạm trung chuyển */}
                <Marker position={[16.05440, 108.20216]} icon={warehouseIcon}>
                  <Popup><span className="text-xs font-bold">🏢 Trạm trung chuyển: Kho Đà Nẵng</span></Popup>
                </Marker>

                {/* 🏠 Vị trí Người nhận (Gán icon Ngôi nhà theo yêu cầu) */}
                <Marker position={[21.02851, 105.80481]} icon={receiverHomeIcon}>
                  <Popup><span className="text-xs font-bold">🏠 Người nhận: Trạm nhận Hà Nội</span></Popup>
                </Marker>

                {/* 🚚 Vị trí xe tải di chuyển Live */}
                <Marker position={truckPosition} icon={truckIcon}>
                  <Popup><span className="text-xs font-black text-amber-600">🚚 Xe tải vận chuyển</span></Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* 3. CHI TIẾT GÓI HÀNG & THANH TOÁN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">📋 Thông tin gói hàng</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Loại hàng hóa:</span><span className="font-black text-slate-700">{trackingData.goi_hang.loai}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Trọng lượng:</span><span className="font-black text-slate-700">{trackingData.goi_hang.trong_luong}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Kích thước:</span><span className="font-black text-slate-700">{trackingData.goi_hang.kich_thuoc}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Dịch vụ:</span><span className="font-black text-[#006c49]">{trackingData.goi_hang.dich_vu}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">💳 Thông tin thanh toán</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Phí vận chuyển:</span><span className="font-bold text-slate-700">{trackingData.thanh_toan.phi_van_chuyen}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Tiền thu hộ (COD):</span><span className="font-bold text-slate-700">{trackingData.thanh_toan.tien_thu_ho}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Hình thức:</span><span className="font-bold text-slate-500">{trackingData.thanh_toan.hinh_thuc}</span></div>
                <div className="flex justify-between border-t border-dashed border-slate-100 pt-2.5 text-sm">
                  <span className="text-slate-800 font-black">Tổng cộng:</span>
                  <span className="font-black text-[#006c49]">{trackingData.thanh_toan.tong_cong}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* 🌟 ĐÃ ĐỔI MÀU: Thẻ tài xế phụ trách đổi sang màu chủ đạo xanh đậm #006c49 */}
          <div className="bg-[#006c49] text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] text-white/5 text-7xl font-black select-none">DRIVER</div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-200 mb-4">Tài xế phụ trách</h3>
            <div className="flex items-center gap-4">
              <img src={trackingData.tai_xe.avatar} alt={trackingData.tai_xe.ten} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
              <div>
                <h4 className="text-sm font-black tracking-tight">{trackingData.tai_xe.ten}</h4>
                <p className="text-[11px] text-emerald-100 font-bold mt-0.5">ID: {trackingData.tai_xe.id} • {trackingData.tai_xe.hang}</p>
                <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs font-black">★ ★ ★ ★ ★ <span className="text-white text-[10px] ml-1">{trackingData.tai_xe.danh_gia}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button className="py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition">📞 Gọi điện</button>
              <button className="py-2 bg-white text-[#006c49] font-bold rounded-xl text-xs transition">💬 Nhắn tin</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-1.5">👤 Thông tin người nhận</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Người nhận</span>
                <span className="font-black text-slate-800 text-sm block mt-0.5">{trackingData.nguoi_nhan.ten}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Số điện thoại</span>
                <span className="font-bold text-slate-700 block mt-0.5">{trackingData.nguoi_nhan.sdt}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Địa chỉ giao hàng</span>
                <span className="font-semibold text-slate-600 block mt-0.5 leading-relaxed">{trackingData.nguoi_nhan.dia_chi}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-[11px] font-semibold mt-4">
                <span className="text-base leading-none">ℹ️</span>
                <p>{trackingData.nguoi_nhan.ghi_chu}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-1.5">🕒 Lịch sử cập nhật</h3>
            <div className="space-y-4 text-xs">
              <div className="border-l-2 border-[#006c49] pl-3">
                <p className="font-black text-slate-800">Vào vùng quét trạm Cần Thơ</p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">23/05/2024, 09:12 AM</span>
              </div>
              <div className="border-l-2 border-slate-200 pl-3">
                <p className="font-bold text-slate-600">Kiểm tra an ninh tại trạm TP.HCM</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">22/05/2024, 15:20 PM</span>
              </div>
              <div className="border-l-2 border-slate-200 pl-3">
                <p className="font-bold text-slate-600">Phân loại hàng hóa tại kho tổng</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">22/05/2024, 10:15 AM</span>
              </div>
              <div className="border-l-2 border-slate-200 pl-3">
                <p className="font-bold text-slate-600">Hợp đồng vận chuyển được khởi tạo</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">21/05/2024, 21:00 PM</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}