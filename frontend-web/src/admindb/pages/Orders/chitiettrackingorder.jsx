import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Polyline,
  Popup, // Sửa lỗi: Thêm import Popup bị thiếu
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; 
import { orderApi } from "../../../api/axios";
import { Loader2, Navigation, Clock, Zap, FastForward, Compass } from "lucide-react";
// import io from "socket.io-client"; // Mở comment nếu có dùng socket thực tế

// --- KHẮC PHỤC LỖI MẤT ASSET ICON MARKER CỦA LEAFLET KHI BUILD VITE ---
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

const TRUCK_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2654/2654162.png"; 
const COORDINATOR_ICON_URL = "https://cdn-icons-png.flaticon.com/512/5643/5643764.png"; 
const SHOP_ICON_URL = "https://cdn-icons-png.flaticon.com/512/869/869636.png"; 
const ROUTE_STATION_ICON_URL = "https://cdn-icons-png.flaticon.com/512/2271/2271068.png"; 

// Hình ảnh xe tải chạy đường trục chặng dài liên tỉnh
const LIVE_ANIMATION_TRUCK_URL = "https://res.cloudinary.com/dm6fqzwhs/image/upload/v1783715202/xedemimart_s5pu46.png";

// Hình ảnh Xe máy Shipper giao hàng nội tỉnh hoặc chặng cuối nhà khách
const LIVE_SHIPPER_MOTOR_URL = "https://res.cloudinary.com/dm6fqzwhs/image/upload/v1783716506/xemayshiper_zpydkt.png";

function ChangeMapView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && typeof bounds.isValid === "function" && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
      setTimeout(() => { map.invalidateSize(); }, 300);
    }
  }, [bounds, map]);
  return null;
}

function MapFocusController({ focusLocation }) {
  const map = useMap();
  useEffect(() => {
    if (focusLocation) {
      map.setView(focusLocation, map.getZoom() < 12 ? 12 : map.getZoom(), {
        animate: true,
        duration: 0.3, 
      });
    }
  }, [focusLocation, map]);
  return null;
}

function UpdateMapLayer({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords && coords.length > 0) map.invalidateSize(); }, [coords, map]);
  return null;
}

// --- LOGISTICS CUSTOM ICONS PHÂN HỆ ĐỘC LẬP ---
const warehouseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2271/2271068.png", 
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const lastMileOfficeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2654/2654162.png", 
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

const storeStartIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/869/869636.png", 
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
  const [focusLocation, setFocusLocation] = useState([10.771963, 106.697194]); // Sửa lỗi: Thêm state focusLocation bị thiếu
  
  // Tọa độ Kho tổng mặc định chuẩn GPS Quận 1 giống ModalLoTrinh
  const [currentStationPosition, setCurrentStationPosition] = useState([
    10.771963, 106.697194,
  ]);

  // State quản lý tọa độ nhà nhận toàn cục để hiển thị Marker chuẩn xác
  const [customerTarget, setCustomerTarget] = useState([10.771963, 106.660172]);
  const [userAvatarUrl, setUserAvatarUrl] = useState("https://cdn-icons-png.flaticon.com/512/149/149071.png");

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: 0,
    durationMin: 0,
    storeName: "Đang định vị chặng...",
    totalOfficesOnRoute: 0,
    isDirectDelivery: false
  });

  const [truckPosition, setTruckPosition] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isArrivedAtStation, setIsArrivedAtStation] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(-1);
  
  const [isFullyDelivered, setIsFullyDelivered] = useState(false); 
  const [deliveredTime, setDeliveredTime] = useState("");
  const [isTruckVehicleMode, setIsTruckVehicleMode] = useState(true);
  const [speedMode, setSpeedMode] = useState("optimized"); 

  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [timeLogs, setTimeLogs] = useState({});

  const animationIndexRef = useRef(0);
  const simulationIntervalRef = useRef(null);
  const socketRef = useRef({ emit: () => {} }); // Sửa lỗi: Tránh crash nếu socket chưa kết nối
  const timelineScrollRef = useRef(null);

  const getSpeedStep = () => {
    if (speedMode === "fast") return 6;      
    return 3;                                 
  };

  const generateLogTime = (key, offsetMinutes = 0) => {
    if (timeLogs[key]) return timeLogs[key];
    const baseDate = orderDetail ? new Date(orderDetail.ngay_tao) : new Date();
    baseDate.setMinutes(baseDate.getMinutes() + offsetMinutes);
    const timeStr = baseDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    const dateStr = baseDate.toLocaleDateString("vi-VN").substring(0, 5);
    const finalStr = `${dateStr} - ${timeStr}`;
    setTimeLogs(prev => ({ ...prev, [key]: finalStr }));
    return finalStr;
  };

  const saveCurrentLocationToDB = async (lat, lng, stationIdx, coordIdx, statusOverride = null) => {
    if (!orderDetail) return;
    try {
      await orderApi.post("/shipping/update-location", {
        ma_don_hang: orderDetail.ma_don_hang,
        order_id: orderDetail.id || id,
        current_lat: lat,
        current_lng: lng,
        current_station_index: stationIdx,
        current_coord_index: coordIdx, 
        status_text: statusOverride || (routeInfo.isDirectDelivery ? "Shipper đang giao hỏa tốc" : "Đang trung chuyển"),
        is_truck: isTruckVehicleMode
      });
    } catch (err) {
      console.error("❌ Lỗi đồng bộ dữ liệu MongoDB:", err);
    }
  };

  const createNewOrderTrackingLogSQL = async (stationData, statusText) => {
    if (!orderDetail) return;
    try {
      await orderApi.post("/orders/tracking-logs/create-node", {
        order_id: orderDetail.id,
        ma_don_hang: orderDetail.ma_don_hang,
        station_id: stationData.station_id || `LIVE_NODE_${Date.now()}`,
        station_name: stationData.station_name,
        tinh_thanh: stationData.tinh_thanh || "",
        quan_huyen: stationData.quan_huyen || "",
        phuong_xa: stationData.phuong_xa || "",
        so_nha_duong: stationData.so_nha_duong || "",
        station_lat: stationData.station_lat,
        station_lng: stationData.station_lng,
        station_type: stationData.station_type || "HUB",
        action_type: isFullyDelivered ? "HOAN_THANH_GIAO" : "NHAP_TRAM_REALTIME",
        trang_thai_hien_thi: statusText
      });
    } catch (err) {
      console.error("❌ Lỗi tạo dòng nhật ký quét trạm SQL:", err.message);
    }
  };

  const jumpToNextStation = async () => {
    if (routeCoords.length === 0 || isArrivedAtStation || isFullyDelivered) return;

    if (routeInfo.isDirectDelivery) {
      const now = new Date();
      const targetIdx = routeCoords.length - 1;
      animationIndexRef.current = targetIdx;
      setCurrentCoordIndex(targetIdx); 
      const finalPt = routeCoords[targetIdx];
      setTruckPosition(finalPt);
      setFocusLocation(finalPt);
      
      socketRef.current.emit("send_truck_location", {
        ma_don_hang: orderDetail.ma_don_hang, coordinates: [finalPt[1], finalPt[0]], isArrived: false, isFullyDelivered: true, currentStationIndex: currentStationIndex
      });

      setIsTruckVehicleMode(false); 
      await saveCurrentLocationToDB(finalPt[0], finalPt[1], currentStationIndex, targetIdx, "🎉 Đã giao xong");
      
      await createNewOrderTrackingLogSQL({
        station_name: "Địa chỉ khách hàng",
        station_lat: finalPt[0],
        station_lng: finalPt[1],
        station_type: "CUSTOMER_HOME"
      }, "Kiện hàng đã được giao tận tay khách hàng an toàn.");

      if (isSimulating) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
      }
      setIsFullyDelivered(true);
      setDeliveredTime(`${now.toLocaleDateString("vi-VN")} - ${now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`);
      return;
    }

    const nextStationIdx = currentStationIndex + 1;
    if (nextStationIdx < stations.length) {
      const targetStation = stations[nextStationIdx];
      let bestMatchIndex = animationIndexRef.current;
      let minDistance = Infinity;

      for (let i = animationIndexRef.current; i < routeCoords.length; i++) {
        const diff = Math.abs(routeCoords[i][0] - parseFloat(targetStation.station_lat)) + Math.abs(routeCoords[i][1] - parseFloat(targetStation.station_lng));
        if (diff < minDistance) {
          minDistance = diff;
          bestMatchIndex = i;
        }
      }

      animationIndexRef.current = bestMatchIndex;
      setCurrentCoordIndex(bestMatchIndex); 
      const matchPt = routeCoords[bestMatchIndex];
      setTruckPosition(matchPt);
      setFocusLocation(matchPt);

      socketRef.current.emit("send_truck_location", {
        ma_don_hang: orderDetail.ma_don_hang, coordinates: [matchPt[1], matchPt[0]], isArrived: true, isFullyDelivered: false, currentStationIndex: nextStationIdx
      });

      await saveCurrentLocationToDB(matchPt[0], matchPt[1], nextStationIdx, bestMatchIndex, "⚠️ Đã đến bưu cục");
      await createNewOrderTrackingLogSQL(targetStation, `Đã quét mã nhập trạm thành công tại ${targetStation.station_name}`);

      if (isSimulating) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
      }
      setIsArrivedAtStation(true);
      setCurrentStationIndex(nextStationIdx);
    } else {
      const now = new Date();
      const targetIdx = routeCoords.length - 1;
      animationIndexRef.current = targetIdx;
      setCurrentCoordIndex(targetIdx); 
      const endPt = routeCoords[targetIdx];
      setTruckPosition(endPt);
      setFocusLocation(endPt);
      
      socketRef.current.emit("send_truck_location", {
        ma_don_hang: orderDetail.ma_don_hang, coordinates: [endPt[1], endPt[0]], isArrived: false, isFullyDelivered: true, currentStationIndex: currentStationIndex
      });

      setIsTruckVehicleMode(false); 
      await saveCurrentLocationToDB(endPt[0], endPt[1], currentStationIndex, targetIdx, "🎉 Đã giao xong");
      
      await createNewOrderTrackingLogSQL({
        station_name: "Địa chỉ người nhận",
        station_lat: endPt[0],
        station_lng: endPt[1],
        station_type: "CUSTOMER_HOME"
      }, "Đã hoàn thành bàn giao kiện hàng.");

      if (isSimulating) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
      }
      setIsFullyDelivered(true);
      setDeliveredTime(`${now.toLocaleDateString("vi-VN")} - ${now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`);
    }
  };

  const createStationTextLabelIcon = (iconUrl, labelText, size = 36) => {
    return L.divIcon({
      html: `<div style="display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px;"><img src="${iconUrl}" style="width: ${size}px; height: ${size}px; object-fit: contain; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));" /></div>`,
      className: "custom-station-clean-icon-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  };

  const createLiveTruckIcon = (widthPx = 64, heightPx = 64) => {
    const currentVehicleImg = isTruckVehicleMode ? LIVE_ANIMATION_TRUCK_URL : LIVE_SHIPPER_MOTOR_URL;
    return L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 120px; position: relative;">
          <div style="background: ${isArrivedAtStation ? '#b91c1c' : '#006c49'}; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; margin-bottom: 4px; border: 1px solid #cbd5e1;">
            ${isFullyDelivered ? "🎉 Đã giao xong" : isArrivedAtStation ? "⚠️ Đã đến bưu cục" : isTruckVehicleMode ? "Đang trung chuyển" : "Shipper đang giao hỏa tốc"}
          </div>
          <div style="width: ${widthPx}px; height: ${heightPx}px; display: flex; align-items: center; justify-content: center;">
            <img src="${currentVehicleImg}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
      `,
      className: "custom-live-truck-marker-clean",
      iconSize: [120, 90],
      iconAnchor: [60, 82],
    });
  };

  const createCustomerAvatarIcon = (url) => {
    return L.divIcon({
      html: `<div style="width: 42px; height: 42px; border-radius: 50%; border: 3px solid #006c49; box-shadow: 0 3px 8px rgba(0,0,0,0.35); overflow: hidden; background-color: #ffffff; display: flex; align-items: center; justify-content: center;"><img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'" /></div>`,
      className: "custom-customer-avatar-marker",
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
    });
  };

  useEffect(() => {
    if (isSimulating) {
      clearInterval(simulationIntervalRef.current);
      startTruckSimulation();
    }
  }, [speedMode]);

  useEffect(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = timelineScrollRef.current.scrollHeight;
    }
  }, [currentStationIndex, isArrivedAtStation, isFullyDelivered]);

  const startTruckSimulation = () => {
    if (routeCoords.length === 0 || isArrivedAtStation || isFullyDelivered) return;
    setIsSimulating(true);
    const stepSize = getSpeedStep(); 
    let dbSaveCounter = 0; 
    
    simulationIntervalRef.current = setInterval(async () => {
      let currentIndex = animationIndexRef.current;

      if (currentIndex < routeCoords.length) {
        const currentCoord = routeCoords[currentIndex];
        setTruckPosition(currentCoord);
        setFocusLocation(currentCoord);

        socketRef.current.emit("send_truck_location", {
          ma_don_hang: orderDetail.ma_don_hang, coordinates: [currentCoord[1], currentCoord[0]], isArrived: false, isFullyDelivered: false, currentStationIndex: currentStationIndex
        });

        dbSaveCounter++;
        if (dbSaveCounter % 20 === 0) { 
          await saveCurrentLocationToDB(currentCoord[0], currentCoord[1], currentStationIndex, currentIndex);
        }

        if (routeInfo.isDirectDelivery) {
          setIsTruckVehicleMode(false); 
        } else if (currentStationIndex >= stations.length - 1 && stations.length > 0) {
          setIsTruckVehicleMode(false); 
        } else {
          setIsTruckVehicleMode(true);  
        }

        let foundStationIdx = -1;
        for (let i = 0; i < stations.length; i++) {
          if (i <= currentStationIndex) continue; 
          const sLat = parseFloat(stations[i].station_lat); const sLng = parseFloat(stations[i].station_lng);
          if (Math.abs(currentCoord[0] - sLat) < 0.0008 && Math.abs(currentCoord[1] - sLng) < 0.0008) {
            foundStationIdx = i;
            break;
          }
        }

        if (foundStationIdx !== -1) {
          clearInterval(simulationIntervalRef.current);
          setIsSimulating(false);
          setIsArrivedAtStation(true);
          setCurrentStationIndex(foundStationIdx);

          const targetStationLog = stations[foundStationIdx];
          
          socketRef.current.emit("send_truck_location", {
            ma_don_hang: orderDetail.ma_don_hang, coordinates: [currentCoord[1], currentCoord[0]], isArrived: true, isFullyDelivered: false, currentStationIndex: foundStationIdx
          });

          await saveCurrentLocationToDB(currentCoord[0], currentCoord[1], foundStationIdx, currentIndex, "⚠️ Đã đến bưu cục");
          await createNewOrderTrackingLogSQL(targetStationLog, `Đã nhập trạm quét mã thành công tại bưu cục trung chuyển`);
          return;
        }

        animationIndexRef.current += stepSize; 
        setCurrentCoordIndex(animationIndexRef.current); 
      } else {
        const now = new Date();
        const endPt = routeCoords[routeCoords.length - 1];
        setTruckPosition(endPt);
        setIsSimulating(false);
        setIsFullyDelivered(true);
        setIsTruckVehicleMode(false); 
        setDeliveredTime(`${now.toLocaleDateString("vi-VN")} - ${now.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`);
        
        socketRef.current.emit("send_truck_location", {
          ma_don_hang: orderDetail.ma_don_hang, coordinates: [endPt[1], endPt[0]], isArrived: false, isFullyDelivered: true, currentStationIndex: currentStationIndex
        });

        await saveCurrentLocationToDB(endPt[0], endPt[1], currentStationIndex, routeCoords.length - 1, "🎉 Đã giao xong");
        await createNewOrderTrackingLogSQL({
          station_name: "Địa chỉ người nhận",
          station_lat: endPt[0],
          station_lng: endPt[1],
          station_type: "CUSTOMER_HOME"
        }, "Giao hàng thành công hoàn tất hành trình.");

        clearInterval(simulationIntervalRef.current);
      }
    }, 25);
  };

  const handleConfirmArrival = async () => {
    if (currentStationIndex >= 0 && currentStationIndex < stations.length) {
      const currentStation = stations[currentStationIndex];
      await createNewOrderTrackingLogSQL(currentStation, `Đã làm thủ tục xuất bưu cục - Rời kho vận chuyển`);
    }
    
    setIsArrivedAtStation(false); 
    animationIndexRef.current += 5; 
    setCurrentCoordIndex(animationIndexRef.current);
    startTruckSimulation(); 
  };

  const fetchTrackingDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      let adminToken = localStorage.getItem("adminToken");
      if (adminToken) adminToken = adminToken.replace(/^"|"$/g, "").trim();

      const requestConfig = { headers: { Authorization: adminToken ? `Bearer ${adminToken}` : "" } };
      const orderRes = await orderApi.get(`/admin/orders/${id}`, requestConfig);
      let orderMainData = null;

      if (orderRes.data?.success) {
        orderMainData = orderRes.data.data;
        setOrderDetail(orderMainData);
        let finalAvatar = orderMainData?.user_info?.avatar_url;
        if (finalAvatar) setUserAvatarUrl(finalAvatar);
      } else {
        throw new Error("Không lấy được dữ liệu cấu trúc gốc của đơn hàng.");
      }

      const logRes = await orderApi.get(`/orders/tracking-logs/${orderMainData?.id || id}`, requestConfig);
      let rawLogs = logRes.data?.success ? logRes.data.data || [] : [];

      const storeLat = 10.771963;
      const storeLng = 106.697194;

      const userLat = parseFloat(orderMainData?.to_lat || orderMainData?.latitude || orderMainData?.toLat || 10.762622);
      const userLng = parseFloat(orderMainData?.to_lng || orderMainData?.longitude || orderMainData?.toLng || 106.660172);

      setCustomerTarget([userLat, userLng]);

      const sortedLogs = [...rawLogs].sort(
        (a, b) => new Date(a.ngay_tao) - new Date(b.ngay_tao),
      );

      const hasDirectLog = sortedLogs.some(log => log.station_id === "DIRECT_STORE_HQ");

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
              Math.abs(parseFloat(s.station_lng) - lng) < 0.003,
          );

          if (!isExist) {
            uniqueStations.push(log);
          }
        });
      }
      setStations(uniqueStations);

      let waypoints = [`${storeLng},${storeLat}`];
      
      if (!hasDirectLog) {
        uniqueStations.forEach((log) => {
          waypoints.push(`${parseFloat(log.station_lng)},${parseFloat(log.station_lat)}`);
        });
      }
      waypoints.push(`${userLng},${userLat}`);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints.join(";")}?overview=full&geometries=geojson&continue_straight=true`;
      const routeRes = await fetch(osrmUrl);
      const routeData = await routeRes.json();

      if (routeData.code === "Ok" && routeData.routes?.length > 0) {
        const currentRoute = routeData.routes[0]; // Sửa lỗi: Khai báo biến route của OSRM
        const coordinates = currentRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
        setRouteCoordinates(coordinates);

        let localStationIdx = orderMainData.current_station_index || -1;
        let isDeliveredFromDB = orderMainData.status_text && (orderMainData.status_text.includes("giao xong") || orderMainData.status_text.includes("thành công"));

        if (orderMainData.current_coord_index !== undefined && orderMainData.current_coord_index !== null) {
          const savedIndex = Math.min(orderMainData.current_coord_index, coordinates.length - 1);
          
          animationIndexRef.current = savedIndex;
          setCurrentCoordIndex(savedIndex);
          setTruckPosition(coordinates[savedIndex]);
          setFocusLocation(coordinates[savedIndex]);
          
          if (orderMainData.current_station_index !== undefined) {
            setCurrentStationIndex(localStationIdx);
          }

          if (orderMainData.status_text && orderMainData.status_text.includes("bưu cục")) {
            setIsArrivedAtStation(true);
          }
          if (isDeliveredFromDB) {
            setIsFullyDelivered(true);
            setDeliveredTime(new Date(orderMainData.updated_at || Date.now()).toLocaleDateString("vi-VN") + " - " + new Date(orderMainData.updated_at || Date.now()).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}));
          }
        } else if (orderMainData.current_lat && orderMainData.current_lng) {
          setTruckPosition([orderMainData.current_lat, orderMainData.current_lng]);
          let closestIdx = 0;
          let minDiff = Infinity;
          coordinates.forEach((pt, idx) => {
            let diff = Math.abs(pt[0] - orderMainData.current_lat) + Math.abs(pt[1] - orderMainData.current_lng);
            if (diff < minDiff) { minDiff = diff; closestIdx = idx; }
          });
          animationIndexRef.current = closestIdx;
          setCurrentCoordIndex(closestIdx);
        } else {
          setTruckPosition(coordinates[0]);
          animationIndexRef.current = 0;
          setCurrentCoordIndex(0);
        }

        const bounds = L.latLngBounds([[storeLat, storeLng], [userLat, userLng]]);
        coordinates.forEach((pt) => bounds.extend(pt));
        setMapBounds(bounds);

        if (hasDirectLog || isDeliveredFromDB || (localStationIdx >= uniqueStations.length - 1 && uniqueStations.length > 0)) {
          setIsTruckVehicleMode(false); 
        } else {
          setIsTruckVehicleMode(true); 
        }

        setRouteInfo({
          distanceKm: parseFloat((currentRoute.distance / 1000).toFixed(1)),
          durationMin: Math.ceil(currentRoute.duration / 60),
          storeName: hasDirectLog ? "Giao thẳng từ Kho tổng" : (uniqueStations.find((s) => s.station_type === "LAST_MILE")?.station_name || "Bưu cục phát chặng cuối"),
          totalOfficesOnRoute: uniqueStations.filter((s) => s.station_type === "HUB").length,
          isDirectDelivery: hasDirectLog
        });
      }
    } catch (err) {
      setError("Không thể nạp thông tin trục hành trình đường bộ OSRM.");
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicTimeline = () => {
    const listNodes = [];

    listNodes.push({
      title: "Đã tiếp nhận đơn hàng",
      desc: "Kho tổng Store2Door - TP. Hồ Chí Minh",
      badge: "✓ ĐÃ XÁC NHẬN BỞI BƯU CỤC",
      time: generateLogTime("tiep_nhan", 0),
      isCompleted: true
    });

    if (currentStationIndex >= 0 || currentCoordIndex > 0) {
      listNodes.push({
        title: "Đã rời kho",
        desc: "Vận chuyển đến trung tâm phân loại trung chuyển",
        badge: "✓ ĐÃ XÁC NHẬN BỞI BƯU CỤC",
        time: generateLogTime("roi_kho_tong", 35),
        isCompleted: true
      });
    }

    stations.forEach((station, idx) => {
      if (idx < currentStationIndex) {
        listNodes.push({
          title: `Đã đến bưu cục`,
          desc: `Kiện hàng cập bến an toàn tại: ${station.station_name}`,
          badge: "✓ ĐÃ XÁC NHẬN BỞI BƯU CỤC",
          time: generateLogTime(`toi_tram_${idx}`, 60 + idx * 120),
          isCompleted: true
        });
        listNodes.push({
          title: `Đã rời kho`,
          desc: `Vận chuyển từ bưu cục ${station.station_name} sang chặng kế tiếp`,
          badge: "✓ ĐÃ XÁC NHẬN BỞI BƯU CỤC",
          time: generateLogTime(`roi_tram_${idx}`, 95 + idx * 120),
          isCompleted: true
        });
      }
      else if (idx === currentStationIndex) {
        if (isArrivedAtStation) {
          listNodes.push({
            title: `Đã đến bưu cục`,
            desc: `Kiện hàng cập bến tại: ${station.station_name}`,
            badge: "✓ ĐÃ XÁC NHẬN BỞI BƯU CỤC",
            time: generateLogTime(`toi_tram_${idx}`, 60 + idx * 120),
            isCompleted: true
          });
          if (!isFullyDelivered) {
            listNodes.push({
              title: "Đang xử lý tại bưu cục",
              desc: `Đang làm thủ tục điều phối xe trung chuyển rời ${station.station_name}`,
              badge: "🚚 CHỜ XUẤT BƯU CỤC",
              time: "Hiện tại",
              isCurrent: true
            });
          }
        } else {
          listNodes.push({
            title: "Đang vận chuyển",
            desc: `Xe đang di chuyển lưu thông quốc lộ đến trạm: ${station.station_name}`,
            badge: "🚚 LIVE",
            time: "Hiện tại",
            isCurrent: true,
            isLive: true
          });
        }
      }
    });

    if (isFullyDelivered) {
      listNodes.push({
        title: "Giao hàng thành công 🎉",
        desc: "Kiện hàng đã được bàn giao tận tay khách hàng an toàn toàn vẹn.",
        time: deliveredTime,
        isEndNode: true,
        isCompleted: true
      });
    } else if (currentStationIndex === stations.length - 1 && !isArrivedAtStation) {
      listNodes.push({
        title: "Đang giao hàng",
        desc: "Bưu tá đang giao đến địa chỉ người nhận",
        time: "Hiện tại",
        isCurrent: true,
        isLive: true
      });
    }

    return listNodes;
  };

  useEffect(() => { 
    if (id) fetchTrackingDetail(); 
    return () => { 
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current); 
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-2 bg-[#fafafa] text-[#006c49]">
        <Loader2 className="animate-spin w-9 h-9 stroke-[3]" />
        <span className="text-xs font-black uppercase tracking-widest">Đang khởi tạo thực địa...</span>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="w-full min-h-screen p-10 bg-[#fafafa] text-center font-bold text-rose-500 text-xs">
         {error || "Không tìm thấy thông tin vận đơn khớp."}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left min-h-screen pb-10 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Link to="/admin/Donhang/DanhsachTrackingorder" className="hover:text-[#006c49]">Shipments</Link>
            <span>❯</span> <span className="text-slate-600">#{orderDetail.ma_don_hang}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Vận đơn: {orderDetail.ma_don_hang}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-slate-900">Lộ trình di chuyển</h2>
              <span className="text-xs text-slate-400 font-bold">Tổng hành trình: {routeInfo.distanceKm} km</span>
            </div>

            <div 
              ref={timelineScrollRef}
              className="max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
            >
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4 pt-2">
                {renderDynamicTimeline().map((node, index) => (
                  <div key={index} className={`relative pl-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${node.isCurrent ? 'bg-amber-50/40 p-3 rounded-2xl border border-amber-100 border-dashed animate-fadeIn' : node.isEndNode ? 'bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 border-dashed animate-fadeIn' : 'animate-fadeIn'}`}>
                    
                    {node.isCompleted ? (
                      <span className="absolute -left-[7px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#0a2540] ring-4 ring-slate-100"></span>
                    ) : (
                      <span className="absolute -left-[7px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-4 ring-amber-50"></span>
                    )}

                    <div className="flex-1">
                      <h4 className={`text-sm font-black ${node.isCurrent ? 'text-amber-600 flex items-center gap-1.5' : 'text-slate-900'}`}>
                        {node.title} {node.isLive && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">LIVE</span>}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{node.desc}</p>
                      
                      {node.badge && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-[#0a2540] text-[9px] font-black rounded border border-slate-200 uppercase tracking-wider">
                            {node.badge}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-slate-400 font-bold">{node.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full border-b border-slate-50 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  🚚 Phân hệ điều phối xe giao hàng <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest">OSRM</span>
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isArrivedAtStation ? (
                  <button 
                    onClick={handleConfirmArrival}
                    className="px-4 py-1.5 bg-[#006c49] hover:bg-emerald-800 text-white text-[11px] font-black rounded-md shadow animate-bounce cursor-pointer border-none"
                  >
                    ✓ Xác nhận xe đi tiếp (Đã rời kho)
                  </button>
                ) : (
                  <button 
                    onClick={startTruckSimulation}
                    disabled={isSimulating || isFullyDelivered}
                    className="px-4 py-1.5 bg-[#0a2540] hover:bg-[#1e3a5f] text-white text-[11px] font-black rounded-md shadow flex items-center gap-1 cursor-pointer disabled:opacity-40 border-none"
                  >
                    {isFullyDelivered ? "✓ Hành trình đã hoàn tất" : animationIndexRef.current === 0 ? "▷ Khởi hành chuyến xe" : "▷ Tiếp tục hành trình"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">🕹️ Cấu hình tốc độ mô phỏng vận tải:</span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/60 shadow-xs">
                <button
                  onClick={jumpToNextStation}
                  disabled={isArrivedAtStation || isFullyDelivered}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-30"
                >
                  <FastForward size={12} /> {routeInfo.isDirectDelivery ? "Tới thẳng nhà khách" : "Tới bưu cục kế (Nhảy trạm)"}
                </button>

                <button
                  onClick={() => setSpeedMode("optimized")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                    speedMode === "optimized" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 bg-transparent hover:bg-slate-50"
                  }`}
                >
                  <Compass size={12} /> Tối ưu
                </button>

                <button
                  onClick={() => setSpeedMode("fast")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-none ${
                    speedMode === "fast" ? "bg-amber-600 text-white shadow-sm animate-pulse" : "text-slate-600 bg-transparent hover:bg-slate-50"
                  }`}
                >
                  <Zap size={12} /> Nhanh siêu tốc
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 relative overflow-hidden">
            <div className="w-full h-[410px] rounded-2xl overflow-hidden border relative z-10 border-slate-100">
              {mapBounds ? (
                <MapContainer center={[14.0, 108.0]} zoom={6} scrollWheelZoom={false} className="w-full h-full outline-none">
                  <TileLayer url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&gl=VN" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
                  <ChangeMapView bounds={mapBounds} />
                  <UpdateMapLayer coords={routeCoords} />
                  <MapFocusController focusLocation={focusLocation} />

                  {routeCoords.length > 1 && (() => {
                    const safeIndex = Math.min(currentCoordIndex, routeCoords.length - 1);
                    const passedPath = routeCoords.slice(0, safeIndex + 1);
                    const remainingPath = routeCoords.slice(safeIndex);

                    return (
                      <>
                        {remainingPath.length > 1 && (
                          <Polyline 
                            positions={remainingPath} 
                            color="#006c49" 
                            weight={4} 
                            opacity={0.45} 
                            dashArray="8, 12" 
                          />
                        )}

                        {passedPath.length > 1 && (
                          <Polyline 
                            positions={passedPath} 
                            color="#006c49" 
                            weight={5} 
                            opacity={1} 
                          />
                        )}
                      </>
                    );
                  })()}

                  {truckPosition && (
                    <Marker position={truckPosition} icon={createLiveTruckIcon()} />
                  )}

                  <Marker
                    position={customerTarget}
                    icon={createCustomerAvatarIcon(userAvatarUrl)}
                  >
                    <Popup>
                      <span className="text-xs font-bold">
                        🏠 Đích đến giao hàng (Nhà khách hàng: {orderDetail?.user_info?.full_name || "Võ Duy Toàn"})
                      </span>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50">Đang nạp bản đồ nền...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                📋 Cấu trúc kiện hàng
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Dịch vụ vận chuyển:</span>
                  <span className="font-black text-[#006c49]">{orderDetail.don_vi_van_chuyen || "DemiMart Express"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Thời gian chặng tính toán:</span>
                  <span className="font-black text-amber-600">~ {routeInfo.durationMin} phút</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Trọng lượng quy đổi:</span>
                  <span className="font-black text-slate-700">0.5 kg</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                💳 Chi phí đối soát dịch vụ
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Tiền hàng gốc:</span>
                  <span className="font-bold text-slate-700">{(Number(orderDetail.tong_tien_hang) || 0).toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Phí cấu trúc đường bộ:</span>
                  <span className="font-bold text-slate-700">{(Number(orderDetail.phi_van_chuyen) || 0).toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-100 pt-2.5 text-sm">
                  <span className="text-slate-800 font-black">Tổng thu khách (COD):</span>
                  <span className="font-black text-[#006c49]">{(Number(orderDetail.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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