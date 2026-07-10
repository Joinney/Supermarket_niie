import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Truck,
  MapPin,
  ShieldCheck,
  Loader2,
  User,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { authApi, orderApi } from "../../../api/axios";

// Sửa lỗi mất icon Marker mặc định của Leaflet khi dùng với React/Vite
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// =================================================================
// CONFIGURATION: ĐƯỜNG DẪN CÁC ICON TRÊN BẢN ĐỒ (QUẢN LÝ TẬP TRUNG)
// =================================================================
const TRUCK_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2654/2654162.png"; // Icon xe tải chặng cuối
const COORDINATOR_ICON_URL = "https://cdn-icons-png.flaticon.com/512/5643/5643764.png"; // Icon điều phối màn hình chặng đầu
const SHOP_ICON_URL = "https://cdn-icons-png.flaticon.com/512/869/869636.png"; // Icon kho tổng xuất phát
const ROUTE_STATION_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2271/2271068.png"; // Icon Hub trung chuyển liên tỉnh
// =================================================================

export default function ModalLoTrinh({ isOpen, onClose, order }) {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const routingLayer = useRef(null);
  const customerMarkerRef = useRef(null);

  // STATE QUẢN LÝ ĐÓNG/MỞ SIDEBAR THÔNG TIN ĐƠN HÀNG BÊN PHẢI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // STATE QUẢN LÝ BƯU CỤC ĐƯỢC CHỌN ĐỂ HIỂN THỊ TRÊN SIDEBAR BÊN TRÁI
  const [selectedStation, setSelectedStation] = useState(null);

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: 0,
    durationMin: 0,
    storeName: "Đang định vị bưu cục phát...",
    firstMileOfficeName: "Đang định vị bưu cục nhận...",
    loading: true,
    totalOfficesOnRoute: 0,
    isDirectDelivery: false,
  });

  // STATE QUẢN LÝ ĐỊA CHỈ LIÊN THÔNG BỐC CHUẨT TỪ CƠ SỞ DỮ LIỆU
  const [addressData, setAddressData] = useState({
    receiver_name: "Khách hàng DemiMart",
    receiver_phone: "Chưa cập nhật SĐT",
    full_address: "Đang kết xuất địa chỉ đặt hàng từ hệ thống...",
  });

  // STATE LƯU TRỮ ĐƯỜNG DẪN AVATAR KHÁCH HÀNG LIVE THỰC TẾ
  const [liveUserAvatar, setLiveUserAvatar] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  );

  // Tọa độ người nhận cố định bốc từ prop order truyền vào
  const userLat = parseFloat(order?.to_lat || order?.latitude || order?.user_lat || 10.762622);
  const userLng = parseFloat(order?.to_lng || order?.longitude || order?.user_lng || 106.660172);

  // 📐 HÀM TOÁN HỌC CHUẨN: Tính toán Snap Point trên đoạn đường thẳng
  const getClosestPointOnSegment = (latA, lngA, latB, lngB, latC, lngC) => {
    const dy = latB - latA;
    const dx = lngB - lngA;
    if (dx === 0 && dy === 0)
      return {
        lat: latA,
        lng: lngA,
        distSq: (latC - latA) ** 2 + (lngC - lngA) ** 2,
      };

    let t = ((lngC - lngA) * dx + (latC - latA) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    const closestLat = latA + t * dy;
    const closestLng = lngA + t * dx;

    return {
      lat: closestLat,
      lng: closestLng,
      distSq: (latC - closestLat) ** 2 + (lngC - closestLng) ** 2,
    };
  };

  // 📐 KIỂM TRA BƯU CỤC CÓ NẰM TRÊN TUYẾN ĐƯỜNG KHÔNG
  const isOfficeStrictlyOnRoute = (
    officeLat,
    officeLng,
    polylineCoords,
    maxDistanceKm = 5.5,
  ) => {
    const maxDistanceDegSq = (maxDistanceKm * 0.009) ** 2;

    for (let i = 0; i < polylineCoords.length - 1; i++) {
      const p1 = polylineCoords[i];
      const p2 = polylineCoords[i + 1];

      const minLat = Math.min(p1[0], p2[0]) - 0.05;
      const maxLat = Math.max(p1[0], p2[0]) + 0.05;
      const minLng = Math.min(p1[1], p2[1]) - 0.05;
      const maxLng = Math.max(p1[1], p2[1]) + 0.05;

      if (
        officeLat >= minLat &&
        officeLat <= maxLat &&
        officeLng >= minLng &&
        officeLng <= maxLng
      ) {
        const snap = getClosestPointOnSegment(
          p1[0],
          p1[1],
          p2[0],
          p2[1],
          officeLat,
          officeLng,
        );
        if (snap.distSq <= maxDistanceDegSq) return true;
      }
    }
    return false;
  };

  // 📐 KHẮC PHỤC LỖI KHUNG HÌNH MAP: Cập nhật lại size thực tế của Leaflet khi ẩn/hiện Sidebar
  useEffect(() => {
    if (leafletMapInstance.current) {
      setTimeout(() => {
        leafletMapInstance.current.invalidateSize();
      }, 310);
    }
  }, [isSidebarOpen]);

  // 📐 HÀM SINH DIV_ICON AVATAR CHUẨN ĐỘNG
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
      className: "custom-user-avatar-marker-modal",
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
    });
  };

  // 🌟 HIỆU ỨNG THEO DÕI AVATAR DỰ PHÒNG: Tự động vẽ đè lại ghim Khách hàng khi State ảnh thật thay đổi
  useEffect(() => {
    if (leafletMapInstance.current && routingLayer.current && isOpen && liveUserAvatar) {
      if (customerMarkerRef.current) {
        routingLayer.current.removeLayer(customerMarkerRef.current);
      }
      customerMarkerRef.current = L.marker([userLat, userLng], {
        icon: createCustomerAvatarIcon(liveUserAvatar),
      }).bindPopup(`<b>Điểm giao hàng đơn ${order?.ma_don_hang}</b>`);

      customerMarkerRef.current.addTo(routingLayer.current);
    }
  }, [liveUserAvatar, isOpen]);

  useEffect(() => {
    if (!isOpen || !order) return;

    let isMounted = true;
    setSelectedStation(null); // Reset dữ liệu khi mở đơn mới

    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
      routingLayer.current = null;
      customerMarkerRef.current = null;
    }

    const renderRouteMap = async () => {
      setRouteInfo((prev) => ({ ...prev, loading: true }));

      const storeLat = 10.792622;
      const storeLng = 106.680172;
      const storeName = "Kho Xuất Phát Tổng DemiMart";

      let apiCalcDistance = 0;
      let apiCalcDuration = 0;
      let databaseTrackingLogs = [];

      try {
        // [1] LUỒNG ĐỒNG BỘ AVATAR KHI CÓ USER_ID
        let targetAvatar =
          order?.user_info?.avatar_url ||
          order?.user_info?.avatar ||
          order?.user_info?.image_url ||
          order?.avatar_url;

        if (!targetAvatar && order.user_id) {
          try {
            const userProfileRes = await authApi.get(`/auth/internal/users/${order.user_id}`);
            if (userProfileRes.data?.avatar_url || userProfileRes.data?.avatar || userProfileRes.data?.image_url) {
              targetAvatar = userProfileRes.data.avatar_url || userProfileRes.data.avatar || userProfileRes.data.image_url;
            }
          } catch (authFetchErr) {
            console.warn("⚠️ Không thể kéo profile avatar từ Auth Service:", authFetchErr.message);
          }
        }

        if (isMounted && targetAvatar && targetAvatar.trim() !== "") {
          setLiveUserAvatar(targetAvatar);
        }

        // [2] ĐỒNG BỘ ĐỊA CHỈ KHÁCH HÀNG TỪ DATABASE
        try {
          const addrRes = await authApi.get("/addresses");
          const addrDataList = addrRes.data?.data || addrRes.data || [];

          if (Array.isArray(addrDataList) && addrDataList.length > 0) {
            const matchedAddr =
              addrDataList.find((addr) => Number(addr.district_id) === Number(order.to_district_id)) ||
              addrDataList.find((addr) => addr.is_default) ||
              addrDataList[0];

            if (matchedAddr && isMounted) {
              setAddressData({
                receiver_name: matchedAddr.receiver_name || "Khách hàng DemiMart",
                receiver_phone: matchedAddr.receiver_phone || "Chưa cập nhật SĐT",
                full_address: `${matchedAddr.detail_address}, ${matchedAddr.ward_name}, ${matchedAddr.district_name}, ${matchedAddr.province_name}`,
              });
            }
          }
        } catch (addrErr) {}

        // [3] TÍNH TOÁN KHOẢNG CÁCH GỐC DỰ PHÒNG
        try {
          const res = await orderApi.post("/orders/shipping/calc", { userLat, userLng });
          const responseData = res.data?.data;
          if (responseData) {
            apiCalcDistance = Number(responseData.distanceKm || 0);
            apiCalcDuration = Number(responseData.estimatedMinutes || 0);
          }
        } catch (apiErr) {}

        // [4] Gọi API tải danh sách bưu cục mạng lưới (KML) - DÙNG orderApi
        try {
          const targetOrderId = order.id || order.ma_don_hang;
          const trackingRes = await orderApi.get(`/orders/tracking-logs/${targetOrderId}`);
          if (trackingRes.data?.success) {
            databaseTrackingLogs = trackingRes.data.data || [];
          }
        } catch (dbLogErr) {
          console.error("⚠️ Không lấy được tracking logs từ DB:", dbLogErr.message);
        }

        if (!isMounted) return;

        // KHỞI TẠO BẢN ĐỒ LEAFLET
        if (!leafletMapInstance.current && mapRef.current) {
          leafletMapInstance.current = L.map(mapRef.current).setView([userLat, userLng], 12);

          L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN", {
            maxZoom: 20,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
            attribution: "© Google Maps Việt Nam",
          }).addTo(leafletMapInstance.current);

          routingLayer.current = L.featureGroup().addTo(leafletMapInstance.current);
        }

        const customShopIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/869/869636.png",
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -34],
        });
        const customDistrictTruckIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2654/2654162.png",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -32],
        });
        const customRouteStationIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2271/2271068.png",
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -28],
        });

        // Sắp xếp Waypoints bám trục liên tỉnh một chiều
        let waypoints = [`${storeLng},${storeLat}`];
        const isTayNguyenZone =
          userLng < 108.2 && userLat > 11.5 && userLat < 15.0;

        if (isTayNguyenZone) {
          waypoints.push("106.883412,11.521093");
          waypoints.push("107.684125,12.001254");
        } else if (userLat > 11.2) {
          waypoints.push("107.234125,10.938512");
          waypoints.push("108.106943,10.933391");
          if (userLat > 12.0) waypoints.push("109.196749,12.245071");
          if (userLat > 13.5) waypoints.push("109.219515,13.774697");
          if (userLat > 16.0) waypoints.push("108.221464,16.059541");
          if (userLat > 18.0) waypoints.push("105.681123,18.673412");
          if (userLat > 20.0) waypoints.push("105.820421,20.251093");
        }

        if (lastMileLng && lastMileLat) {
          waypoints.push(`${lastMileLng},${lastMileLat}`);
        }
        waypoints.push(`${userLng},${userLat}`);

        const coordsString = waypoints.join(";");
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&continue_straight=true`;

        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && isMounted && routingLayer.current) {
          const route = routeData.routes[0];
          const coordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

          // Vẽ đường Polyline
          L.polyline(coordinates, {
            color: "#006c49",
            weight: 5,
            opacity: 0.9,
            lineJoin: "round",
            lineCap: "round",
          }).addTo(routingLayer.current);

          // Cập nhật State hiển thị lên thanh thông tin đầu Modal
          setRouteInfo({
            distanceKm: apiCalcDistance > 0 ? apiCalcDistance : parseFloat((route.distance / 1000).toFixed(1)),
            durationMin: apiCalcDuration > 0 ? apiCalcDuration : Math.ceil(route.duration / 60),
            storeName: lastMileName,
            firstMileOfficeName: firstMileName,
            loading: false,
            totalOfficesOnRoute: hubOnRouteList.length,
          });

          if (leafletMapInstance.current && routingLayer.current) {
            leafletMapInstance.current.fitBounds(routingLayer.current.getBounds(), { padding: [50, 50] });
          }
        }
      } catch (error) {
        console.error("🔥 Lỗi xử lý tải bản đồ lộ trình:", error);
        if (isMounted) setRouteInfo((prev) => ({ ...prev, loading: false }));
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

  if (!isOpen) return null;

  const items = order?.items || order?.danh_sach_san_pham || [];
  const groupedSidebarItemsMap = {};

  items.forEach((item) => {
    const key = item.ma_san_pham || item.product_name || "unknown";
    if (!groupedSidebarItemsMap[key]) {
      groupedSidebarItemsMap[key] = {
        product_name: item.product_name || "Kiện hàng Demi Mart",
        image_url: item.image_url,
        variants: [],
      };
    }
    groupedSidebarItemsMap[key].variants.push({
      name: item.variant_name || "Mặc định",
      qty: item.quantity || item.qty || 1,
    });
  });
  const finalGroupedItems = Object.values(groupedSidebarItemsMap);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-screen h-screen flex flex-col overflow-hidden max-h-screen">
        
        {/* Header Modal */}
        <div className="p-4 border-b flex justify-between items-center bg-[#006c49] text-white shrink-0">
          <div className="flex items-center gap-2">
            <Truck size={20} />
            <h3 className="font-bold text-sm">Hệ thống Quản lý và Tối ưu Lộ trình Logistics</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Thanh Thông Tin Tuyến Đường Đa Điểm */}
        <div className="p-3 bg-emerald-50/50 flex justify-between items-center border-b shrink-0 text-xs">
          <div className="flex items-center gap-6 max-w-[60%]">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-700 shrink-0">
                <MapPin size={14} />
              </div>
              <div className="max-w-[180px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Bưu cục nhận (Đầu)</span>
                <span className="font-bold text-slate-700 block truncate">{routeInfo.firstMileOfficeName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-1.5 rounded-full text-[#006c49] shrink-0">
                <MapPin size={14} />
              </div>
              <div className="max-w-[180px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Bưu cục phát (Cuối)</span>
                <span className="font-bold text-slate-700 block truncate">{routeInfo.storeName}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex gap-5 shrink-0 font-bold text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Trạm trục trung chuyển</span>
              <span className="text-[#e65100] block font-black">
                {routeInfo.loading
                  ? "..."
                  : `${routeInfo.totalOfficesOnRoute} Hub chặng giữa`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Khoảng cách tổng</span>
              <span className="block text-slate-700 font-black">
                {routeInfo.loading ? "..." : `${routeInfo.distanceKm} km`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Thời gian dự kiến</span>
              <span className="text-amber-600 block font-black">
                ⏳ {routeInfo.loading ? "..." : `~${routeInfo.durationMin} phút`}
              </span>
            </div>
          </div>
        </div>

        {/* Thân Modal Split Layout */}
        <div className="flex flex-1 flex-row w-full h-full overflow-hidden relative">
          {/* 🗺️ Bên Trái: Bản đồ */}
          <div className="relative flex-1 h-full bg-slate-100 transition-all duration-300">
            {routeInfo.loading && (
              <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-[#006c49]">
                <Loader2 className="animate-spin w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Đang đồng bộ lộ trình nghiệp vụ thực tế từ cơ sở dữ liệu...
                </span>
              </div>
            )}
            <div ref={mapRef} style={{ height: "100%", width: "100%" }} className="z-0 outline-none" />
          </div>

          {/* NÚT TAB THU GỌN SIDEBAR PHẢI */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 z-[1001] bg-white hover:bg-emerald-50 text-slate-500 border-y border-l border-slate-200 w-5 h-20 rounded-l-xl flex items-center justify-center shadow-md transition-all duration-300 focus:outline-none cursor-pointer"
            style={{ right: isSidebarOpen ? "32%" : "0" }}
          >
            {isSidebarOpen ? <ChevronRight size={16} className="stroke-[3]" /> : <ChevronLeft size={16} className="stroke-[3]" />}
          </button>

          {/* 📄 Bên Phải: Panel hiển gia thông tin đơn hàng */}
          <div
            className={`h-full bg-slate-50 border-l border-slate-200 flex flex-col overflow-y-auto p-5 gap-4 shadow-inner transition-all duration-300 ${
              isSidebarOpen ? "w-[32%] opacity-100 visible" : "w-0 p-0 opacity-0 invisible border-l-0"
            }`}
          >
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block mb-1">Mã vận đơn hệ thống</span>
              <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                📦 #{order?.ma_don_hang || "CHƯA_CẬP_NHẬT"}
              </h4>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#006c49] border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Trạng thái: {order?.trang_thai_don_hang || "Chờ xử lý"}
              </div>
            </div>

            {/* Khối thông tin khách hàng */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <User size={14} className="text-slate-500" /> Thông tin người đặt nhận hàng
              </h5>
              <div>
                <span className="text-slate-400 text-[11px] block">Tên người nhận</span>
                <span className="font-black text-slate-700 text-sm block bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {addressData.receiver_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Số điện thoại</span>
                <span className="font-bold text-slate-700 text-sm block bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono tracking-wide">
                  {addressData.receiver_phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Địa chỉ đặt hàng chi tiết</span>
                <span className="font-medium text-slate-600 text-xs leading-relaxed block mt-0.5 bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/40 shadow-xs">
                  📍 {addressData.full_address}
                </span>
              </div>
            </div>

            {/* Khối danh sách sản phẩm mua */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
              <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Package size={14} className="text-slate-500" /> Danh sách sản phẩm mua ({finalGroupedItems.length})
              </h5>
              <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                {finalGroupedItems.length > 0 ? (
                  finalGroupedItems.map((group, index) => (
                    <div key={index} className="flex gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs items-center">
                      <img
                        src={group.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"}
                        alt="prod"
                        className="w-11 h-11 rounded-xl border object-cover bg-white shrink-0 shadow-xs"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-slate-700 block truncate">{group.product_name}</span>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed truncate">
                          Phân loại:{" "}
                          {group.variants.map((v, i) => (
                            <span key={i}>
                              {v.name} • <b className="text-slate-600">x{v.qty}</b>
                              {i < group.variants.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 font-medium text-center py-4 text-[11px]">Không tìm thấy chi tiết kiện hàng.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1 border-t pt-3">
                <div className="bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Tổng trọng lượng</span>
                  <span className="font-bold text-slate-700 text-xs">{order?.khoi_luong ? `${order.khoi_luong} kg` : "0.5 kg"}</span>
                </div>
                <div className="bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Hình thức</span>
                  <span className="font-bold text-slate-700 text-[11px] truncate block">{order?.hinh_thuc_thanh_toan || "Thẻ tín dụng / COD"}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 mt-1 shadow-xs">
                <span className="text-slate-500 font-bold text-xs">Tổng thanh toán đơn:</span>
                <span className="font-black text-[#006c49] text-base">
                  {(Number(order?.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Khối Thời Gian Nhật Ký */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1"><Calendar size={13} /> Ngày đặt vận đơn:</span>
                <span className="font-medium text-slate-700">{new Date(order?.ngay_tao || Date.now()).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1"><Truck size={13} /> Đơn vị vận chuyển:</span>
                <span className="font-semibold text-[#006c49]">{order?.don_vi_van_chuyen || "DemiMart Logistics"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t flex justify-between items-center text-xs shrink-0 text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#006c49]" /> Đã dọn dẹp và
            đóng gói tinh gọn: Loại bỏ hoàn toàn endpoint save-route-stations dư
            thừa tại Client.
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}