import React, { useEffect, useRef, useState } from "react";
import { X, Truck, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { orderApi } from "../../../api/axios";

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

      const userLat = parseFloat(order.to_lat || order.latitude || order.user_lat || 10.762622);
      const userLng = parseFloat(order.to_lng || order.longitude || order.user_lng || 106.660172);

      let storeLat = 10.792622;
      let storeLng = 106.680172;
      let storeName = order.don_vi_van_chuyen || "Siêu thị DemiMart Express"; 
      
      // 🚀 Biến hứng số liệu chuẩn từ API giống hệt lúc Checkout
      let apiCalcDistance = 0;
      let apiCalcDuration = 0;

      try {
        try {
          const res = await orderApi.post('/orders/shipping/calc', { userLat, userLng }); 
          const responseData = res.data?.data;

          if (responseData) {
            apiCalcDistance = Number(responseData.distanceKm || 0);
            apiCalcDuration = Number(responseData.estimatedMinutes || 0);

            const nearestStore = responseData.nearestStore;
            if (nearestStore) {
              const mongoLat = nearestStore.location?.coordinates?.[1];
              const mongoLng = nearestStore.location?.coordinates?.[0];
              storeLat = parseFloat(nearestStore.lat ?? mongoLat ?? storeLat);
              storeLng = parseFloat(nearestStore.lng ?? mongoLng ?? storeLng);
              storeName = nearestStore.name ? `Siêu thị ${nearestStore.name}` : storeName;
            }
          }
        } catch (apiErr) {
          console.warn("⚠️ API định tuyến lỗi, dùng tọa độ mặc định:", apiErr.message);
        }

        if (!isMounted) return;

        if (!leafletMapInstance.current) {
          leafletMapInstance.current = L.map(mapRef.current).setView([userLat, userLng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
          }).addTo(leafletMapInstance.current);
        }

        if (routingLayer.current) leafletMapInstance.current.removeLayer(routingLayer.current);
        routingLayer.current = L.featureGroup().addTo(leafletMapInstance.current);

        const storeIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', iconSize: [32, 32], iconAnchor: [16, 32] });
        L.marker([storeLat, storeLng], { icon: storeIcon }).bindPopup(`<b>${storeName}</b><br/>Nơi xuất hàng`).addTo(routingLayer.current);

        const userIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1047/1047711.png', iconSize: [32, 32], iconAnchor: [16, 32] });
        L.marker([userLat, userLng], { icon: userIcon }).bindPopup(`<b>Điểm giao hàng</b>`).addTo(routingLayer.current);

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${userLng},${userLat}?overview=full&geometries=geojson`;
        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && isMounted) {
          const route = routeData.routes[0];
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          L.polyline(coordinates, { color: '#006c49', weight: 5, opacity: 0.8, lineJoin: 'round' }).addTo(routingLayer.current);

          // 🚀 THỨ TỰ ƯU TIÊN CHUẨN XÁC 100%:
          // 1. Lấy số trong DB (đối với đơn mới đặt sau khi sửa Bước 1)
          // 2. Lấy số từ API /orders/shipping/calc (cứu các đơn cũ lỡ lưu 0km)
          // 3. Cuối cùng đường cùng mới xài OSRM tự đo
          const dbDist = Number(order.tong_khoang_cach_km);
          const dbDur = Number(order.thoi_gian_du_kien_phut);

          const bestDistance = dbDist > 0 ? dbDist : (apiCalcDistance > 0 ? apiCalcDistance : (route.distance / 1000).toFixed(1));
          const bestDuration = dbDur > 0 ? dbDur : (apiCalcDuration > 0 ? apiCalcDuration : Math.ceil(route.duration / 60));

          setRouteInfo({
            distanceKm: bestDistance,
            durationMin: bestDuration,
            storeName: storeName, 
            loading: false
          });

          leafletMapInstance.current.fitBounds(routingLayer.current.getBounds(), { padding: [50, 50] });
        }
      } catch (error) {
        console.error("🔥 Lỗi vẽ bản đồ lộ trình:", error);
        if (isMounted) setRouteInfo(prev => ({ ...prev, loading: false, storeName: "Lỗi định vị tuyến" }));
      }
    };

    const timeoutId = setTimeout(() => {
      renderRouteMap();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen && leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // 🌟 ĐÃ GỘP CHUẨN: z-[9999] nằm ở thẻ ngoài cùng để đè Header
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      
      {/* 🌟 ĐÃ GỘP CHUẨN: mt-36 nằm ở thẻ chứa nội dung trắng để tụt xuống */}
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh] mt-36">
        
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
              {/* Tên kho hiển thị động */}
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