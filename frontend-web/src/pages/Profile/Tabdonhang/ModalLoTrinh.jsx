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
import io from "socket.io-client"; 

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
const TRUCK_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2654/2654162.png"; 
const COORDINATOR_ICON_URL = "https://cdn-icons-png.flaticon.com/512/5643/5643764.png"; 
const SHOP_ICON_URL = "https://cdn-icons-png.flaticon.com/512/869/869636.png"; 
const ROUTE_STATION_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2271/2271068.png"; 

const LIVE_ANIMATION_TRUCK_URL = "https://res.cloudinary.com/dm6fqzwhs/image/upload/v1783715858/xedemimart_gsyk3d.png";
const LIVE_SHIPPER_MOTOR_URL = "https://res.cloudinary.com/dm6fqzwhs/image/upload/v1783716506/xemayshiper_zpydkt.png";
// =================================================================

export default function ModalLoTrinh({ isOpen, onClose, order }) {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const routingLayer = useRef(null);
  const customerMarkerRef = useRef(null);

  // KHỞI TẠO MỐC MARKER XE CHẠY LIVE PHÍA NGƯỜI DÙNG VÀ REF SOCKET
  const liveVehicleMarkerRef = useRef(null);
  const socketRef = useRef(null);
  const userSimulationIntervalRef = useRef(null); 

  // CÁC LAYER POLYLINE PHÂN CHẶNG ĐỘNG
  const passedPolylineRef = useRef(null);
  const remainingPolylineRef = useRef(null);

  // STATE QUẢN LÝ ĐÓNG/MỞ SIDEBAR THÔNG TIN ĐƠN HÀNG BÊN PHẢI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // STATE QUẢN LÝ BƯU CỤC ĐƯỢC CHỌN ĐỂ HIỂN THỊ TRÊN SIDEBAR BÊN TRÁI
  const [selectedStation, setSelectedStation] = useState(null);

  // STATE LƯU TOÀN BỘ TỌA ĐỘ TRỤC ĐƯỜNG GỐC OSRM ĐỂ PHỤC VỤ CHIA ĐOẠN ĐƯỜNG ĐI
  const [staticRouteCoords, setStaticRouteCoords] = useState([]);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);

  // Dùng Ref lưu trữ giá trị index mục tiêu để loop tịnh tiến đọc được tức thì
  const targetCoordIndexRef = useRef(0);

  // Thêm state đồng bộ phương thức hiển thị phương tiện vận tải
  const [isTruckVehicleMode, setIsTruckVehicleMode] = useState(true);

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

  // HÀM TỰ ĐỘNG VẼ SẠCH LOGO ICON BƯU CỤC KHÔNG CHỨA KHỐI CHỮ GẠCH CHÂN BÊN DƯỚI
  const createStationCleanIcon = (iconUrl, size = 34) => {
    return L.divIcon({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px;">
          <img src="${iconUrl}" style="width: ${size}px; height: ${size}px; object-fit: contain; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));" />
        </div>
      `,
      className: "custom-modal-station-clean-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  };

  // ICON XE TẢI / XE MÁY CHẠY LIVE REALTIME ĐÃ ĐƯỢC PHÓNG TO VÀ XOÁ BỎ HOÀN TOÀN KHUNG VIỀN TRẮNG
  const createUserLiveVehicleIcon = (isTruckMode, statusText = "Đang di chuyển", widthPx = 64, heightPx = 64) => {
    const currentImg = isTruckMode ? LIVE_ANIMATION_TRUCK_URL : LIVE_SHIPPER_MOTOR_URL;
    
    return L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 150px; position: relative;">
          <div style="background: ${statusText.includes('đến') || statusText.includes('bưu cục') || statusText.includes('Xác nhận') ? '#b91c1c' : '#006c49'}; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; margin-bottom: 4px; border: 1px solid #cbd5e1; text-align: center;">
            ${statusText}
          </div>
          <div style="width: ${widthPx}px; height: ${heightPx}px; display: flex; align-items: center; justify-content: center;">
            <img src="${currentImg}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
      `,
      className: "user-map-live-vehicle-clean",
      iconSize: [150, 95],
      iconAnchor: [75, 87],
    });
  };

  // HÀM UPDATE ĐƯỜNG ĐI DI ĐỘNG DỰA TRÊN INDEX HIỆN TẠI
  const updateDynamicPolylines = (coords, index) => {
    if (!routingLayer.current || coords.length === 0) return;

    const safeIndex = Math.min(index, coords.length - 1);
    const passedPath = coords.slice(0, safeIndex + 1);
    const remainingPath = coords.slice(safeIndex);

    // 1. Cập nhật hoặc vẽ đoạn đường xe ĐÃ đi qua (Xanh đậm, liền mạch)
    if (passedPath.length > 1) {
      if (!passedPolylineRef.current) {
        passedPolylineRef.current = L.polyline(passedPath, {
          color: "#006c49",
          weight: 5,
          opacity: 1,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(routingLayer.current);
      } else {
        passedPolylineRef.current.setLatLngs(passedPath);
      }
    } else if (passedPolylineRef.current) {
      routingLayer.current.removeLayer(passedPolylineRef.current);
      passedPolylineRef.current = null;
    }

    // 2. Cập nhật hoặc vẽ đoạn đường xe CHƯA đi qua (Xanh nhạt, nét đứt hoạt họa)
    if (remainingPath.length > 1) {
      if (!remainingPolylineRef.current) {
        remainingPolylineRef.current = L.polyline(remainingPath, {
          color: "#006c49",
          weight: 4,
          opacity: 0.45,
          dashArray: "8, 12",
          lineJoin: "round",
          lineCap: "round",
        }).addTo(routingLayer.current);
      } else {
        remainingPolylineRef.current.setLatLngs(remainingPath);
      }
    } else if (remainingPath.length <= 1 && remainingPolylineRef.current) {
      routingLayer.current.removeLayer(remainingPolylineRef.current);
      remainingPolylineRef.current = null;
    }
  };

  // Gọi update khi index hoặc mảng tọa độ tổng thay đổi
  useEffect(() => {
    updateDynamicPolylines(staticRouteCoords, currentCoordIndex);
    
    // Giữ icon đồng bộ khi chỉ số tịnh tiến thay đổi
    if (liveVehicleMarkerRef.current && staticRouteCoords.length > 0) {
      const currentPt = staticRouteCoords[Math.min(currentCoordIndex, staticRouteCoords.length - 1)];
      if (currentPt) {
        liveVehicleMarkerRef.current.setLatLng([currentPt[0], currentPt[1]]);
      }
    }
  }, [currentCoordIndex, staticRouteCoords]);

  // KHÁC PHỤC LỖI KHUNG HÌNH MAP: Cập nhật lại size thực tế của Leaflet khi ẩn/hiện Sidebar hoặc bấm mở Panel trái
  useEffect(() => {
    if (leafletMapInstance.current) {
      setTimeout(() => {
        leafletMapInstance.current.invalidateSize();
      }, 310);
    }
  }, [isSidebarOpen, selectedStation]);

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
    setSelectedStation(null); 
    setStaticRouteCoords([]);
    setCurrentCoordIndex(0);
    targetCoordIndexRef.current = 0;
    passedPolylineRef.current = null;
    remainingPolylineRef.current = null;

    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
      routingLayer.current = null;
      customerMarkerRef.current = null;
      liveVehicleMarkerRef.current = null;
    }

    if (userSimulationIntervalRef.current) {
      clearInterval(userSimulationIntervalRef.current);
    }

    const stringRoomId = String(order.ma_don_hang || "").trim();
    
    // 🛠️ ĐỒNG BỘ GATEWAY CỔNG 5005 ĐÚNG VỚI BACKEND ORDER SERVICE
    socketRef.current = io("http://localhost:5005", {
      transports: ["websocket"],
      upgrade: false,
      forceNew: true
    });
    socketRef.current.emit("join_order_room", stringRoomId);

    const renderRouteMap = async () => {
      setRouteInfo((prev) => ({ ...prev, loading: true }));

      const storeLat = 10.771963;
      const storeLng = 106.697194;

      let databaseTrackingLogs = [];
      let currentTruckCoords = [storeLat, storeLng]; 
      let dbStatusText = "Sẵn sàng khởi hành";

      try {
        // [1] LUỒNG ĐỒNG BỘ AVATAR KHI CÓ USER_ID
        let targetAvatar = order?.items?.avatar_url || order?.user_info?.avatar_url || order?.user_info?.avatar || order?.user_info?.image_url || order?.avatar_url;
        if (!targetAvatar && order.user_id) {
          try {
            const userProfileRes = await authApi.get(`/auth/internal/users/${order.user_id}`);
            if (userProfileRes.data?.avatar_url || userProfileRes.data?.avatar || userProfileRes.data?.image_url) {
              targetAvatar = userProfileRes.data.avatar_url || userProfileRes.data.avatar || userProfileRes.data.image_url;
            }
          } catch (authFetchErr) {
            console.warn("⚠️ Cảnh báo profile avatar:", authFetchErr.message);
          }
        }
        if (isMounted && targetAvatar && targetAvatar.trim() !== "") setLiveUserAvatar(targetAvatar);

        // [2] ĐỒNG BỘ ĐỊA CHỈ KHÁCH HÀNG TỪ DATABASE
        try {
          const addrRes = await authApi.get("/addresses");
          const addrDataList = addrRes.data?.data || addrRes.data || [];
          if (Array.isArray(addrDataList) && addrDataList.length > 0) {
            const matchedAddr = addrDataList.find((addr) => Number(addr.district_id) === Number(order.to_district_id)) || addrDataList.find((addr) => addr.is_default) || addrDataList[0];
            if (matchedAddr && isMounted) {
              setAddressData({
                receiver_name: matchedAddr.receiver_name || "Khách hàng DemiMart",
                receiver_phone: matchedAddr.receiver_phone || "Chưa cập nhật SĐT",
                full_address: `${matchedAddr.detail_address}, ${matchedAddr.ward_name}, ${matchedAddr.district_name}, ${matchedAddr.province_name}`,
              });
            }
          }
        } catch (addrErr) {}

        // [3] ĐỒNG BỘ LỘ TRÌNH VÀ TỌA ĐỘ XE LƯU TRONG DB KHI F5
        try {
          const targetOrderId = order.id || order.ma_don_hang;
          const trackingRes = await orderApi.get(`/shipping/logs/${targetOrderId}`);
          if (trackingRes.data?.success) {
            databaseTrackingLogs = trackingRes.data.data || [];
          }
          
          const liveOrderRes = await orderApi.get(`/admin/orders/${targetOrderId}`);
          if (liveOrderRes.data?.success && liveOrderRes.data.data?.current_lat) {
            currentTruckCoords = [parseFloat(liveOrderRes.data.data.current_lat), parseFloat(liveOrderRes.data.data.current_lng)];
            dbStatusText = liveOrderRes.data.data.status_text || "Đang di chuyển";
          }
        } catch (dbLogErr) {
          console.error("⚠️ Không lấy được dữ liệu logs:", dbLogErr.message);
        }

        if (!isMounted) return;

        // KHỞI TẠO BẢN ĐỒ LEAFLET
        if (!leafletMapInstance.current && mapRef.current) {
          leafletMapInstance.current = L.map(mapRef.current).setView([userLat, userLng], 12);
          L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN", {
            maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"], attribution: "© Google Maps DemiMart",
          }).addTo(leafletMapInstance.current);
          routingLayer.current = L.featureGroup().addTo(leafletMapInstance.current);
        }

        const sortedLogs = [...databaseTrackingLogs].sort(
          (a, b) => new Date(a.ngay_tao) - new Date(b.ngay_tao)
        );

        const hasDirectLog = sortedLogs.some(log => log.station_id === "DIRECT_STORE_HQ");
        let waypoints = [`${storeLng},${storeLat}`];
        let firstMileName = "Bưu cục gom hàng DemiMart";
        let lastMileName = "Bưu cục phát chặng cuối DemiMart Express";
        let totalHubs = 0;

        // --- ĐỒNG BỘ HOÀN TOÀN: LỌC SẠCH TRẠM TRÙNG GIỐNG CHITIETTRACKINGORDER ---
        let uniqueStations = [];
        if (hasDirectLog) {
          uniqueStations = sortedLogs;
        } else {
          sortedLogs.forEach((log) => {
            const lat = parseFloat(log.station_lat); const lng = parseFloat(log.station_lng);
            if (!lat || !lng) return;

            if (Math.abs(lat - storeLat) < 0.002 && Math.abs(lng - storeLng) < 0.002) return;
            if (Math.abs(lat - userLat) < 0.002 && Math.abs(lng - userLng) < 0.002) return;

            const isExist = uniqueStations.some(
              (s) =>
                Math.abs(parseFloat(s.station_lat) - lat) < 0.003 &&
                Math.abs(parseFloat(s.station_lng) - lng) < 0.003
            );

            if (!isExist) {
              uniqueStations.push(log);
            }
          });
        }

        if (hasDirectLog) {
          const directLog = sortedLogs.find(l => l.station_id === "DIRECT_STORE_HQ");
          L.marker([storeLat, storeLng], { icon: createStationCleanIcon(SHOP_ICON_URL, 36) }).on("click", () => { if (isMounted) setSelectedStation(directLog); }).addTo(routingLayer.current);
          firstMileName = "Kho hàng trung tâm"; lastMileName = "Giao hàng trực tiếp siêu tốc";
        } else {
          // Duyệt và thêm waypoint từ mảng uniqueStations đã được lọc sạch
          uniqueStations.forEach((log) => {
            const lat = parseFloat(log.station_lat); const lng = parseFloat(log.station_lng);
            if (!lat || !lng) return;
            waypoints.push(`${lng},${lat}`);

            let currentIconUrl = ROUTE_STATION_ICON_URL;
            let iconSizePx = 32;

            if (log.station_type === "FIRST_MILE") {
              firstMileName = log.station_name;
              currentIconUrl = COORDINATOR_ICON_URL;
              iconSizePx = 38;
            } else if (log.station_type === "LAST_MILE") {
              lastMileName = log.station_name;
              currentIconUrl = TRUCK_ICON_URL;
              iconSizePx = 38;
            } else if (log.station_type === "HUB") {
              totalHubs++;
              currentIconUrl = ROUTE_STATION_ICON_URL;
              iconSizePx = 32;
            }

            L.marker([lat, lng], { icon: createStationCleanIcon(currentIconUrl, iconSizePx) })
              .on("click", () => { if (isMounted) setSelectedStation(log); })
              .addTo(routingLayer.current);
          });

          L.marker([storeLat, storeLng], { icon: createStationCleanIcon(SHOP_ICON_URL, 36) }).addTo(routingLayer.current);
        }

        waypoints.push(`${userLng},${userLat}`);

        const finalRenderAvatar = targetAvatar || liveUserAvatar;
        customerMarkerRef.current = L.marker([userLat, userLng], { icon: createCustomerAvatarIcon(finalRenderAvatar) }).bindPopup(`<b>Điểm giao hàng đơn ${order?.ma_don_hang}</b>`);
        customerMarkerRef.current.addTo(routingLayer.current);

        const coordsString = waypoints.join(";");
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&continue_straight=true`;
        const routeRes = await fetch(osrmUrl);
        const routeData = await routeRes.json();

        if (routeData.code === "Ok" && isMounted && routingLayer.current) {
          const route = routeData.routes[0];
          const coordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

          setStaticRouteCoords(coordinates);

          setRouteInfo({
            distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
            durationMin: Math.ceil(route.duration / 60),
            storeName: lastMileName, firstMileOfficeName: firstMileName, loading: false, totalOfficesOnRoute: totalHubs, isDirectDelivery: hasDirectLog
          });

          // Định vị vị trí xe khởi tạo tĩnh từ DB
          let initIndex = 0;
          let minDiff = Infinity;
          for (let i = 0; i < coordinates.length; i++) {
            const d = Math.abs(coordinates[i][0] - currentTruckCoords[0]) + Math.abs(coordinates[i][1] - currentTruckCoords[1]);
            if (d < minDiff) { minDiff = d; initIndex = i; }
          }
          setCurrentCoordIndex(initIndex);
          targetCoordIndexRef.current = initIndex;

          let initTruckMode = !hasDirectLog;
          if (liveVehicleMarkerRef.current) leafletMapInstance.current.removeLayer(liveVehicleMarkerRef.current);
          
          liveVehicleMarkerRef.current = L.marker([coordinates[initIndex][0], coordinates[initIndex][1]], {
            icon: createUserLiveVehicleIcon(initTruckMode, dbStatusText, 64, 64)
          }).addTo(leafletMapInstance.current);

          leafletMapInstance.current.fitBounds(routingLayer.current.getBounds(), { padding: [50, 50] });

          // 🌟 KHÓA CỨNG LÒ XO NỘI SUY: Chỉ bám đuổi tịnh tiến mượt mà khi targetCoordIndexRef thay đổi từ dữ liệu thực tế của Socket
          userSimulationIntervalRef.current = setInterval(() => {
            setCurrentCoordIndex((prevIndex) => {
              const targetIdx = targetCoordIndexRef.current;
              if (prevIndex < targetIdx) {
                const distanceLeft = targetIdx - prevIndex;

                // Đồng bộ nhảy cóc nếu lệch chặng quá xa do F5
                if (distanceLeft > 40) {
                  const currentPt = coordinates[targetIdx];
                  if (liveVehicleMarkerRef.current && currentPt) {
                    liveVehicleMarkerRef.current.setLatLng([currentPt[0], currentPt[1]]);
                  }
                  return targetIdx;
                }

                const dynamicStep = distanceLeft > 15 ? 4 : distanceLeft > 5 ? 2 : 1;
                const nextIdx = Math.min(prevIndex + dynamicStep, targetIdx);
                const currentPt = coordinates[nextIdx];
                if (liveVehicleMarkerRef.current && currentPt) {
                  liveVehicleMarkerRef.current.setLatLng([currentPt[0], currentPt[1]]);
                }
                return nextIdx;
              }
              return prevIndex;
            });
          }, 30);

          // LẮNG NGHE SỰ KIỆN PHÁT TỌA ĐỘ ĐỒNG BỘ "send_truck_location" TÀI XẾ TỪ ADMIN
          socketRef.current.on("send_truck_location", (socketData) => {
            const { coordinates: truckCoords, isArrived, isFullyDelivered, currentStationIndex: socketStationIdx } = socketData;
            
            if (!truckCoords || !Array.isArray(truckCoords) || truckCoords.length < 2) return;

            const adminLat = truckCoords[1];
            const adminLng = truckCoords[0];

            let bestMatchIndex = targetCoordIndexRef.current;
            let minD = Infinity;
            for (let i = 0; i < coordinates.length; i++) {
              const diff = Math.abs(coordinates[i][0] - adminLat) + Math.abs(coordinates[i][1] - adminLng);
              if (diff < minD) {
                minD = diff;
                bestMatchIndex = i;
              }
            }

            let isTruck = true;
            if (hasDirectLog || isFullyDelivered || socketStationIdx >= uniqueStations.length - 1) {
              isTruck = false;
            }
            setIsTruckVehicleMode(isTruck);

            let statusText = "Đang di chuyển";
            if (isFullyDelivered) statusText = "🎉 Đã giao xong";
            else if (isArrived) statusText = "⚠️ Đã đến bưu cục";
            else if (!isTruck) statusText = "Shipper đang giao hỏa tốc";

            if (liveVehicleMarkerRef.current) {
              liveVehicleMarkerRef.current.setIcon(createUserLiveVehicleIcon(isTruck, statusText, 64, 64));
            }

            // 🎯 GÁN ĐÍCH MỤC TIÊU MỚI: Kích hoạt lò xo tịnh tiến chạy đuổi theo Admin
            targetCoordIndexRef.current = bestMatchIndex;

            if (isArrived || isFullyDelivered) {
              setCurrentCoordIndex(bestMatchIndex);
              if (liveVehicleMarkerRef.current) {
                liveVehicleMarkerRef.current.setLatLng([adminLat, adminLng]);
              }
            }
          });

        } else {
          setRouteInfo((prev) => ({ ...prev, firstMileOfficeName: firstMileName, storeName: lastMileName, totalOfficesOnRoute: totalHubs, loading: false, isDirectDelivery: hasDirectLog }));
        }
      } catch (err) {
        console.error("Lỗi bản đồ:", err);
        if (isMounted) setRouteInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    const timeoutId = setTimeout(() => { renderRouteMap(); }, 300);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (userSimulationIntervalRef.current) clearInterval(userSimulationIntervalRef.current);
      if (socketRef.current) socketRef.current.disconnect(); 
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
          
          {/* SIDEBAR TRƯỢT TRÁI HIỂN THỊ CHI TIẾT BƯU CỤC */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-[1002] bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden text-left ${
              selectedStation ? "w-[340px] opacity-100" : "w-0 opacity-0"
            }`}
          >
            {selectedStation && (
              <div className="flex flex-col h-full w-full">
                {/* Header Sidebar trái */}
                <div className="p-4 bg-[#006c49] text-white flex items-center gap-3 shrink-0 shadow-sm relative">
                  <button 
                    onClick={() => setSelectedStation(null)} 
                    className="p-1 hover:bg-white/20 rounded-full transition-colors focus:outline-none cursor-pointer"
                  >
                    <ChevronLeft size={20} className="stroke-[3]" />
                  </button>
                  <h4 className="font-black text-sm tracking-tight truncate pr-6 flex-1">
                    {selectedStation.station_name}
                  </h4>
                  <div className="absolute right-4 bg-white/20 p-1.5 rounded-lg text-white">
                    📍
                  </div>
                </div>

                {/* Body Content Sidebar Trái */}
                <div className="p-5 flex flex-col gap-5 overflow-y-auto bg-white flex-1 text-xs">
                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Tên đơn vị</span>
                    <span className="font-black text-slate-800 text-sm leading-snug block">{selectedStation.station_name}</span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Mã vận hành / trạm</span>
                    <span className="font-mono font-bold text-[#006c49] bg-emerald-50/50 px-2 py-1 rounded border border-emerald-100 block w-fit text-[11px] tracking-wide">
                      {selectedStation.station_id || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Tỉnh/thành phố</span>
                    <span className="font-semibold text-slate-700 block">{selectedStation.tinh_thanh || "Chưa cập nhật"}</span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Quận/huyện</span>
                    <span className="font-semibold text-slate-700 block">{selectedStation.quan_huyen || "Chưa cập nhật"}</span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Phường/xã</span>
                    <span className="font-semibold text-slate-700 block">{selectedStation.phuong_xa || "Chưa cập nhật"}</span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Số nhà, đường chi tiết</span>
                    <span className="font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed block shadow-xs">
                      {selectedStation.so_nha_duong || "Chưa có địa chỉ chi tiết tuyến đường"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100">
                    <div>
                      <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Vĩ độ (Latitude)</span>
                      <span className="font-mono text-slate-600 font-bold block">{parseFloat(selectedStation.station_lat).toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400 text-[10px] uppercase mb-0.5 tracking-wider">Kinh độ (Longitude)</span>
                      <span className="font-mono text-slate-600 font-bold block">{parseFloat(selectedStation.station_lng).toFixed(6)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2 text-[#006c49]">
                    <span className="text-base">🛡️</span>
                    <span className="font-bold text-[10px] leading-relaxed uppercase tracking-wider">Trạm logistics hoạt động bình thường trên trục lõi</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  {(window.Number(order?.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ
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
            <ShieldCheck size={16} className="text-[#006c49]" /> Đã dọn dẹp và đóng gói tinh gọn: Hệ thống đồng bộ hành trình đường vận tải lõi OSRM từ cơ sở dữ liệu thành công.
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}