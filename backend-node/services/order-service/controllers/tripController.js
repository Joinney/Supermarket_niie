import axios from 'axios';
import { TripModel } from '../models/TripModel.js';

/**
 * API tiếp nhận Trip ID, gọi OSRM giải toán TSP và cập nhật kết quả vào MongoDB
 */
export const optimizeTripRoute = async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin Trip ID để xử lý!" });
    }

    // 1. Tìm chuyến hàng thô từ MongoDB
    const trip = await TripModel.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến hàng trong hệ thống Demi Mart!" });
    }

    if (!trip.stops || trip.stops.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách điểm dừng bốc/giao đang trống!" });
    }

    // 2. Gom mảng tọa độ GeoJSON theo định dạng [Lng, Lat]
    // Điểm xuất phát start_point bắt buộc nằm ở Index 0
    const rawCoordinatesList = [
      trip.start_point.location.coordinates,
      ...trip.stops.map(stop => stop.location.coordinates)
    ];

    // Khởi tạo chuỗi "lng,lat;lng,lat;..."
    const coordsString = rawCoordinatesList.map(c => `${c[0]},${c[1]}`).join(';');

    // 3. Thực thi request gửi tới OSRM Trip Engine
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false&overview=full&geometries=geojson`;
    
    console.log(`📡 [LOGISTICS]: Đang tối ưu hóa chuỗi waypoint OSRM cho Trip Code: ${trip.trip_code}`);
    const response = await axios.get(osrmUrl);
    
    if (response.data.code !== 'Ok') {
      return res.status(502).json({ success: false, message: "Trục trặc giải thuật TSP từ OSRM core!" });
    }

    const osrmTrip = response.data.trips[0];
    const osrmWaypoints = response.data.waypoints;

    // 4. Thuật toán "Bẻ khóa" waypoint_index ánh xạ ngược danh sách stop
    const orderedStopsResult = [];

    for (let i = 0; i < osrmWaypoints.length; i++) {
      const originalIndex = osrmWaypoints[i].waypoint_index;
      
      // index === 0 là Kho Tổng, ta chỉ bốc các điểm dừng phụ
      if (originalIndex !== 0) {
        const originalStopData = trip.stops[originalIndex - 1]; // Trừ 1 vì mảng stops gốc không có Kho
        
        orderedStopsResult.push({
          stop_id: originalStopData.stop_id,
          type: originalStopData.type,
          name: originalStopData.name,
          address: originalStopData.address,
          location: originalStopData.location,
          step_order: i // Gán thứ tự chạy thực tế (1, 2, 3...)
        });
      }
    }

    // 5. Đồng bộ hóa và ghi đè kết quả tối ưu vào MongoDB
    trip.optimization_result = {
      is_optimized: true,
      total_distance_km: parseFloat((osrmTrip.distance / 1000).toFixed(2)),
      total_duration_min: Math.ceil(osrmTrip.duration / 60),
      ordered_stops: orderedStopsResult,
      polyline_geojson: osrmTrip.geometry
    };

    trip.status = 'OPTIMIZED';
    const updatedTrip = await trip.save();

    return res.status(200).json({
      success: true,
      message: "Tối ưu hóa hành trình logistics đa điểm thành công!",
      data: {
        trip_code: updatedTrip.trip_code,
        status: updatedTrip.status,
        distance_km: updatedTrip.optimization_result.total_distance_km,
        duration_min: updatedTrip.optimization_result.total_duration_min,
        route_manifest: updatedTrip.optimization_result.ordered_stops
      }
    });

  } catch (error) {
    console.error("🔥 [API TRIP ERROR]:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi xử lý luồng vận tải nội bộ!", error: error.message });
  }
};