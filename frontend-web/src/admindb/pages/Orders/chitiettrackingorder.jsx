import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, useMap, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { orderApi } from "../../../api/axios";
import { Loader2 } from "lucide-react";

// --- KHẮC PHỤC LỖI MẤT ASSET ICON MARKER CỦA LEAFLET KHI BUILD VITE ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// --- COMPONENT TỰ ĐỘNG ZOOM/PAN THEO TOÀN BỘ ĐƯỜNG ĐI CHẶNG TRỤC ---
function ChangeMapView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
      setTimeout(() => { map.invalidateSize(); }, 300);
    }
  }, [bounds, map]);
  return null;
}

function UpdateMapLayer({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.invalidateSize();
    }
  }, [coords, map]);
  return null;
}

// --- LOGISTICS CUSTOM ICONS PHÂN HỆ ĐỘC LẬP ---
const warehouseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2271/2271068.png", // Hub chặng giữa
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const lastMileOfficeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2654/2654162.png", // Bưu cục phát chặng cuối
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

const storeStartIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/869/869636.png", // Kho tổng xuất phát
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

export default function Chitiettrackingorder() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  
  const [routeCoords, setRouteCoordinates] = useState([]);
  const [stations, setStations] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [currentStationPosition, setCurrentStationPosition] = useState([10.792622, 106.680172]);
  
  // State quản lý tọa độ nhà nhận toàn cục để hiển thị Marker chuẩn xác
  const [customerTarget, setCustomerTarget] = useState([10.762622, 106.660172]);

  // State lưu chuỗi ảnh Avatar người dùng bốc từ Database (Mặc định dùng ảnh đại diện xám nếu chưa tìm thấy key)
  const [userAvatarUrl, setUserAvatarUrl] = useState("https://cdn-icons-png.flaticon.com/512/149/149071.png");

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: 0,
    durationMin: 0,
    storeName: "Đang định vị chặng...",
    totalOfficesOnRoute: 0
  });

  const fetchTrackingDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      let adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        adminToken = adminToken.replace(/^"|"$/g, '').trim();
      }

      const requestConfig = {
        headers: { Authorization: adminToken ? `Bearer ${adminToken}` : "" }
      };

      // 1. Lấy thông tin đơn hàng gốc từ API cổng 5005
      const orderRes = await orderApi.get(`/orders/admin/orders/${id}`, requestConfig);
      let orderMainData = null;
      
      if (orderRes.data?.success) {
        orderMainData = orderRes.data.data;
        setOrderDetail(orderMainData);
        
        console.log("=== [DEBUG] ĐƠN HÀNG LOGISTICS GỐC ===", orderMainData);
        if (orderMainData?.user_info) {
          console.log("=== [DEBUG] ĐỐI TƯỢNG USER_INFO BÊN TRONG ===", orderMainData.user_info);
        }

        // 🌟 BỘ THUẬT TOÁN DÒ TÌM AVATAR DỰ PHÒNG THÔNG MINH (DEEP SCAN) 🌟
        // Tự động kiểm tra tất cả các trường có khả năng chứa link ảnh đại diện khách hàng
        let finalAvatar = null;
        
        if (orderMainData?.user_info) {
          finalAvatar = orderMainData.user_info.avatar || 
                        orderMainData.user_info.image_url || 
                        orderMainData.user_info.avatar_url || 
                        orderMainData.user_info.image ||
                        orderMainData.user_info.picture;
        }
        
        if (!finalAvatar) {
          finalAvatar = orderMainData?.avatar || 
                        orderMainData?.avatar_url || 
                        orderMainData?.image_url || 
                        orderMainData?.customer_avatar;
        }

        // Nếu tìm thấy link ảnh hợp lệ, cập nhật ngay vào bản đồ số
        if (finalAvatar && typeof finalAvatar === 'string' && finalAvatar.trim() !== '') {
          console.log("🎯 Đã dò quét trúng link Avatar khách hàng thật:", finalAvatar);
          setUserAvatarUrl(finalAvatar);
        } else {
          console.warn("⚠️ Hệ thống chưa tìm thấy key Avatar hợp lệ trong API. Đang sử dụng ảnh mặc định.");
        }

      } else {
        throw new Error("Không lấy được dữ liệu cấu trúc gốc của đơn hàng.");
      }

      const realOrderId = orderMainData?.id || id;

      // 2. Lấy danh sách nhật trình logs quét trạm trung chuyển từ DB
      const logRes = await orderApi.get(`/orders/shipping/logs/${realOrderId}`, requestConfig);
      let rawLogs = [];
      if (logRes.data?.success) {
        rawLogs = logRes.data.data || [];
      }

      // Tọa độ Kho tổng cố định (HCM)
      const storeLat = 10.792622;
      const storeLng = 106.680172;
      
      const userLat = parseFloat(orderMainData?.to_lat || orderMainData?.latitude || orderMainData?.toLat || 10.762622);
      const userLng = parseFloat(orderMainData?.to_lng || orderMainData?.longitude || orderMainData?.toLng || 106.660172);
      
      setCustomerTarget([userLat, userLng]);

      // Tạo bản sao mảng an toàn và sắp xếp tuần tiến theo chuỗi thời gian quét (Cũ xếp trước -> Mới xếp sau)
      const sortedLogs = [...rawLogs].sort((a, b) => new Date(a.ngay_tao) - new Date(b.ngay_tao));

      // Lọc khử trùng lặp tọa độ toán học nâng cao để chặn OSRM vẽ vòng lặp rác
      let uniqueStations = [];
      sortedLogs.forEach(log => {
        const lat = parseFloat(log.station_lat);
        const lng = parseFloat(log.station_lng);
        if (!lat || !lng) return;

        if (Math.abs(lat - storeLat) < 0.002 && Math.abs(lng - storeLng) < 0.002) return;
        if (Math.abs(lat - userLat) < 0.002 && Math.abs(lng - userLng) < 0.002) return;

        const isExist = uniqueStations.some(s => 
          Math.abs(parseFloat(s.station_lat) - lat) < 0.003 && 
          Math.abs(parseFloat(s.station_lng) - lng) < 0.003
        );

        if (!isExist) {
          uniqueStations.push(log);
        }
      });

      setStations(uniqueStations);

      // 3. THIẾT LẬP WAYPOINTS THEO TUYẾN CHUẨN ĐỘC ĐẠO
      let waypoints = [`${storeLng},${storeLat}`];
      uniqueStations.forEach(log => {
        waypoints.push(`${parseFloat(log.station_lng)},${parseFloat(log.station_lat)}`);
      });
      waypoints.push(`${userLng},${userLat}`);

      // 4. GỌI API ROUTE ĐỊNH TUYẾN ĐƠN NHÁNH THEO ĐÚNG TRÌNH TỰ MẢNG ÉP BUỘC
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints.join(';')}?overview=full&geometries=geojson&continue_straight=true`;
      
      const routeRes = await fetch(osrmUrl);
      const routeData = await routeRes.json();

      if (routeData.code === "Ok" && routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        setRouteCoordinates(coordinates);

        const bounds = L.latLngBounds([[storeLat, storeLng], [userLat, userLng]]);
        coordinates.forEach(pt => {
          if (Array.isArray(pt) && pt.length === 2) bounds.extend(pt);
        });
        setMapBounds(bounds);

        // Đặt vị trí trạm hiện thời live tại bưu cục mới nhất
        if (uniqueStations.length > 0) {
          const lastLog = uniqueStations[uniqueStations.length - 1];
          setCurrentStationPosition([parseFloat(lastLog.station_lat), parseFloat(lastLog.station_lng)]);
        } else {
          setCurrentStationPosition([storeLat, storeLng]);
        }

        setRouteInfo({
          distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
          durationMin: Math.ceil(route.duration / 60),
          storeName: uniqueStations.find(s => s.station_type === 'LAST_MILE')?.station_name || "Bưu cục phát chặng cuối",
          totalOfficesOnRoute: uniqueStations.filter(s => s.station_type === 'HUB').length
        });
      }

    } catch (err) {
      console.error("🔥 Lỗi thiết lập hành trình đường bộ:", err);
      setError("Không thể nạp thông tin vận hành chặng trục uốn lượn đường bộ của đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTrackingDetail();
    }
  }, [id]);

  // KHỞI TẠO ĐỘNG DIV_ICON CHỨA ẢNH NGƯỜI DÙNG THẬT TRÒN VIỀN TRẮNG ĐẸP MẮT ĐÈ TRÊN NỀN BẢN ĐỒ
  const createCustomerAvatarIcon = (url) => {
    return L.divIcon({
      html: `<div style="
        width: 42px; 
        height: 42px; 
        border-radius: 50%; 
        border: 3px solid #006c49; 
        box-shadow: 0 3px 8px rgba(0,0,0,0.35); 
        overflow: hidden; 
        background-color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" />
      </div>`,
      className: "custom-customer-avatar-marker",
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42]
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-2 bg-[#fafafa] text-[#006c49]">
        <Loader2 className="animate-spin w-9 h-9 stroke-[3]" />
        <span className="text-xs font-black uppercase tracking-widest">Đang kết xuất liên thông thực địa OSRM...</span>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="w-full min-h-screen p-10 bg-[#fafafa] text-center font-bold text-rose-500 text-xs">
        ⚠️ {error || "Không tìm thấy thông tin vận đơn khớp trong cơ sở dữ liệu."}
        <div className="mt-4"><Link to="/admin/Donhang/DanhsachTrackingorder" className="text-[#006c49] underline">Quay lại danh sách</Link></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left min-h-screen pb-10 p-6">
      
      {/* BREADCRUMB HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Link to="/admin/Donhang/DanhsachTrackingorder" className="hover:text-[#006c49] transition-colors">Shipments</Link>
            <span>❯</span>
            <span className="text-slate-600">#{orderDetail.ma_don_hang}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Vận đơn: {orderDetail.ma_don_hang}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-[#006c49] border border-emerald-100">
              {orderDetail.trang_thai_don_hang || "IN TRANSIT"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
            🖨️ In vận đơn
          </button>
        </div>
      </div>

      {/* COMPONENT LAYOUT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CỘT TRÁI: TIMELINE VÀ BẢN ĐỒ MAP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LỊCH TRÌNH QUÉT TRẠM TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-slate-900">Lịch trình quét trạm hệ thống</h2>
              <span className="text-xs text-slate-400 font-bold">Tổng hành trình: {routeInfo.distanceKm} km</span>
            </div>

            <div className="relative border-l-2 border-dashed border-slate-200 ml-3 space-y-8 pb-2">
              <div className="relative pl-6">
                <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#006c49] ring-4 ring-emerald-50"></span>
                <h4 className="text-sm font-black text-slate-900">Kho tổng xuất phát Store2Door (TP.HCM)</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Đã đóng gói và bốc xếp phân phối lên thùng xe tải trục</p>
              </div>

              {stations.map((log, index) => (
                <div key={log.id || index} className="relative pl-6">
                  <span className={`absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full ${index === stations.length - 1 ? "bg-amber-500 ring-4 ring-amber-50 animate-pulse" : "bg-[#006c49] ring-4 ring-emerald-50"}`}></span>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{log.station_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Khu vực: {log.phuong_xa} • {log.quan_huyen} • {log.tinh_thanh}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-[#006c49] text-[9px] font-black rounded uppercase border tracking-wider">
                          {log.trang_thai_hien_thi}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 font-bold block">
                        {new Date(log.ngay_tao).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BẢN ĐỒ MAP LEAFLET TUYẾN TÍNH ĐỘC ĐẠO */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 relative overflow-hidden">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded-lg border border-dashed mb-3">
              <span>Trục hành trình bám sát đường bộ huyết mạch Việt Nam:</span>
              <span className="font-bold text-[#006c49]">STATUS: OSRM TRIP COMPLIANT</span>
            </div>
            
            <div className="w-full h-[410px] rounded-2xl overflow-hidden border relative z-10 mt-1">
              {mapBounds ? (
                <MapContainer center={[14.0, 108.0]} zoom={6} scrollWheelZoom={false} className="w-full h-full outline-none">
                  <TileLayer attribution='&copy; Google Maps' url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN" subdomains={['mt0', 'mt1', 'mt2', 'mt3']} />
                  
                  <ChangeMapView bounds={mapBounds} />
                  <UpdateMapLayer coords={routeCoords} />
                  
                  {routeCoords.length > 1 && (
                    <Polyline key={routeCoords.length} positions={routeCoords} color="#006c49" weight={5} opacity={0.9} lineJoin="round" lineCap="round" />
                  )}

                  {/* Ghim vị trí điểm đầu Kho tổng */}
                  <Marker position={[10.792622, 106.680172]} icon={storeStartIcon}>
                    <Popup><span className="text-xs font-bold">📍 Kho xuất phát tổng DemiMart TP.HCM</span></Popup>
                  </Marker>

                  {/* Duyệt ghim động bưu cục trung gian */}
                  {stations.map((station) => {
                    const lat = parseFloat(station.station_lat);
                    const lng = parseFloat(station.station_lng);
                    if (!lat || !lng) return null;

                    const isLastMile = station.station_type === 'LAST_MILE';

                    return (
                      <Marker key={station.id} position={[lat, lng]} icon={isLastMile ? lastMileOfficeIcon : warehouseIcon}>
                        <Popup>
                          <div className="text-xs">
                            <b className="text-[#006c49] block mb-0.5">{station.station_name}</b>
                            <span>Phân loại trạm: {station.station_type}</span>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* 🌟 ĐÃ KHẮC PHỤC CHUẨN XÁC: Render trực tiếp Marker động chứa avatar thật của khách hàng Võ Duy Toàn */}
                  <Marker position={customerTarget} icon={createCustomerAvatarIcon(userAvatarUrl)}>
                    <Popup>
                      <span className="text-xs font-bold">
                        🏠 Đích đến giao hàng (Nhà khách hàng: {orderDetail?.user_info?.full_name || "Võ Duy Toàn"})
                      </span>
                    </Popup>
                  </Marker>

                  {/* Địa điểm bưu cục Live chặng cuối */}
                  {currentStationPosition && (
                    <Marker position={currentStationPosition} icon={lastMileOfficeIcon}>
                      <Popup><span className="text-xs font-black text-emerald-600">🏠 Vị trí Bưu cục phát Live hiện thời</span></Popup>
                    </Marker>
                  )}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs font-bold text-slate-400 bg-slate-50 gap-2">
                  <Loader2 className="animate-spin text-[#006c49] w-6 h-6" />
                  Đang khởi tạo trục nơ định tuyến đường bộ...
                </div>
              )}
            </div>
          </div>

          {/* TÀI CHÍNH VÀ CẤU TRÚC KIỆN HÀNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">📋 Cấu trúc kiện hàng</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Dịch vụ vận chuyển:</span><span className="font-black text-[#006c49]">{orderDetail.don_vi_van_chuyen || "DemiMart Express"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Thời gian chặng tính toán:</span><span className="font-black text-amber-600">~ {routeInfo.durationMin} phút</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Trọng lượng quy đổi:</span><span className="font-black text-slate-700">0.5 kg</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">💳 Chi phí đối soát dịch vụ</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Tiền hàng gốc:</span><span className="font-bold text-slate-700">{(Number(orderDetail.tong_tien_hang) || 0).toLocaleString("vi-VN")} đ</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-bold">Phí cấu trúc đường bộ:</span><span className="font-bold text-slate-700">{(Number(orderDetail.phi_van_chuyen) || 0).toLocaleString("vi-VN")} đ</span></div>
                <div className="flex justify-between border-t border-dashed border-slate-100 pt-2.5 text-sm">
                  <span className="text-slate-800 font-black">Tổng thu khách (COD):</span>
                  <span className="font-black text-[#006c49]">{(Number(orderDetail.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CỘT PHẢI (SIDEBAR): THANH TOÁN & ĐỊA CHỈ LIÊN THÔNG BẢN QUYỀN */}
        <div className="space-y-6">
          <div className="bg-[#006c49] text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-200 mb-4">Trạng thái ví đơn hàng</h3>
            <div className="flex items-center gap-4">
              <div>
                <h4 className="text-sm font-black tracking-tight">Cơ chế: {orderDetail.phuong_thuc_thanh_toan || "Ví liên thông App"}</h4>
                <p className="text-[11px] text-emerald-100 font-bold mt-1">Trạng thái ví: {orderDetail.trang_thai_thanh_toan || "PENDING"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-1.5">👤 Thông tin địa chỉ đối soát</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Mã đơn liên thông</span>
                <span className="font-black text-[#006c49] text-sm block mt-0.5 font-mono">#{orderDetail.ma_don_hang}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Tọa độ đích thực địa bưu cục phát</span>
                <span className="font-semibold text-slate-600 block mt-0.5 leading-relaxed font-mono">Lat: {customerTarget[0]} • Lng: {customerTarget[1]}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}