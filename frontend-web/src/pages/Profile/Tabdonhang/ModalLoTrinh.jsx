import React, { useEffect, useRef, useState } from "react";
import { X, Truck, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { orderApi } from "../../../api/axios"; // Nhớ kiểm tra lại đường dẫn import này cho khớp với máy bạn

// Sửa lỗi mất icon Marker mặc định của Leaflet khi dùng với React/Vite/Webpack
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

export default function ModalLoTrinh({ isOpen, onClose, order }) {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const routingLayer = useRef(null);

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: 0,
    durationMin: 0,
    storeName: "Đang định vị...",
    loading: true
  });

  useEffect(() => {
    if (!isOpen || !order) return;

    let isMounted = true;

    const renderRouteMap = async () => {
      setRouteInfo(prev => ({ ...prev, loading: true }));

      // 1. Lấy tọa độ Khách hàng (Sử dụng tọa độ fallback nếu đơn hàng chưa lưu)
      const userLat = parseFloat(order.latitude || order.user_lat || 10.762622);
      const userLng = parseFloat(order.longitude || order.user_lng || 106.660172);

      try {
        // 2. Gọi API backend để lấy tọa độ kho (Fallback nếu API chưa sẵn sàng)
        let storeLat = 10.792622;
        let storeLng = 106.680172;
        let storeName = "Kho Tổng Demi";

        try {
          const res = await orderApi.post('/shipping/calc', { userLat, userLng });
          if (res.data && res.data.storeLat) {
            storeLat = res.data.storeLat;
            storeLng = res.data.storeLng;
            storeName = res.data.storeName || "Kho Demi Gần Nhất";
          }
        } catch (apiErr) {
          console.warn("⚠️ Không lấy được kho từ API, sử dụng kho mặc định.");
        }

        if (!isMounted) return;

        // 3. Khởi tạo bản đồ Leaflet (chỉ khởi tạo 1 lần)
        if (!leafletMapInstance.current) {
          leafletMapInstance.current = L.map(mapRef.current).setView([userLat, userLng], 13);
          
          // Nạp layer bản đồ từ OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(leafletMapInstance.current);
        }

        // Tạo layer group để dễ dàng xóa lộ trình cũ nếu người dùng đổi đơn hàng
        if (routingLayer.current) {
          leafletMapInstance.current.removeLayer(routingLayer.current);
        }
        routingLayer.current = L.featureGroup().addTo(leafletMapInstance.current);

        // Đánh dấu điểm xuất phát (Kho hàng)
        const storeIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', // Icon kho
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        L.marker([storeLat, storeLng], { icon: storeIcon })
          .bindPopup(`<b>${storeName}</b><br/>Nơi xuất hàng`)
          .addTo(routingLayer.current);

        // Đánh dấu điểm đến (Khách hàng)
        const userIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1047/1047711.png', // Icon nhà
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        L.marker([userLat, userLng], { icon: userIcon })
          .bindPopup(`<b>Điểm giao hàng</b><br/>Đơn: ${order.ma_don_hang || ''}`)
          .addTo(routingLayer.current);

        // 4. Gọi API OSRM miễn phí để lấy mảng tọa độ vẽ đường đi
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${userLng},${userLat}?overview=full&geometries=geojson`;
        
        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && isMounted) {
          const route = routeData.routes[0];
          
          // OSRM trả tọa độ định dạng [lng, lat], Leaflet cần [lat, lng] nên phải đảo ngược lại
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Vẽ nét đứt / nét liền cho đường đi
          L.polyline(coordinates, { 
            color: '#006c49', 
            weight: 5, 
            opacity: 0.8,
            lineJoin: 'round'
          }).addTo(routingLayer.current);

          // Cập nhật khoảng cách & thời gian lên UI
          setRouteInfo({
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.ceil(route.duration / 60),
            storeName: storeName,
            loading: false
          });

          // Zoom bản đồ tự động co giãn để nhìn thấy cả kho và người nhận
          leafletMapInstance.current.fitBounds(routingLayer.current.getBounds(), { padding: [50, 50] });
        } else {
          throw new Error("Không tìm thấy đường đi khả dụng");
        }

      } catch (error) {
        console.error("🔥 Lỗi xử lý lộ trình:", error);
        if (isMounted) {
          setRouteInfo(prev => ({ ...prev, loading: false, storeName: "Lỗi kết nối vệ tinh" }));
        }
      }
    };

    // Delay 300ms đợi DOM của Modal render xong hoàn toàn rồi mới nhúng bản đồ vào
    const timeoutId = setTimeout(() => {
      renderRouteMap();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOpen, order]);

  // Dọn dẹp bản đồ khi đóng Modal để chống lỗi "Map container is already initialized"
  useEffect(() => {
    if (!isOpen && leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-4 border-b flex justify-between items-center bg-[#006c49] text-white shrink-0">
          <div className="flex items-center gap-2">
            <Truck size={20} />
            <h3 className="font-bold text-sm">Lộ trình giao hàng {order?.ma_don_hang}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Thanh Thông Tin Tuyến Đường */}
        <div className="p-3 bg-emerald-50/50 flex justify-between items-center border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-full text-[#006c49]"><MapPin size={16} /></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Xuất phát từ</span>
              <span className="text-xs font-black text-slate-700">{routeInfo.storeName}</span>
            </div>
          </div>
          
          <div className="text-right flex gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Khoảng cách</span>
              <span className="text-xs font-black text-[#006c49]">
                {routeInfo.loading ? "..." : `${routeInfo.distanceKm} km`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Dự kiến</span>
              <span className="text-xs font-black text-amber-600">
                ⏳ {routeInfo.loading ? "..." : `~${routeInfo.durationMin} phút`}
              </span>
            </div>
          </div>
        </div>

        {/* Khu vực Bản Đồ */}
        <div className="relative w-full h-[400px] bg-slate-100 flex-1 shrink-0">
          {routeInfo.loading && (
            <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-[#006c49]">
              <Loader2 className="animate-spin w-8 h-8"/>
              <span className="text-xs font-black uppercase tracking-widest">Đang kết nối GPS...</span>
            </div>
          )}
          {/* Rất quan trọng: Phải set chiều cao trực tiếp cho thẻ chứa map */}
          <div ref={mapRef} style={{ height: '400px', width: '100%' }} className="z-0 outline-none" />
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#006c49]"/> Bảo hiểm hàng hóa & Vận chuyển 100%
          </span>
        </div>
      </div>
    </div>
  );
}