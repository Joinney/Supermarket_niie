import express from 'express';
import { LiveLocation } from '../models/liveLocationModel.js'; 
import db from '../configs/database.js'; // Kết nối database PostgreSQL để đồng bộ trạng thái đơn hàng

const router = express.Router();

router.post('/update-location', async (req, res) => {
  const { 
    ma_don_hang, 
    order_id, 
    current_lat, 
    current_lng, 
    current_station_index, 
    current_coord_index, 
    status_text, 
    is_truck 
  } = req.body;

  try {
    if (!ma_don_hang) {
      return res.status(400).json({ success: false, message: "Thiếu mã đơn hàng!" });
    }

    // ----------------------------------------------------------------
    // 🛠️ LOGIC ÉP TRẠNG THÁI CHUẨN XÁC THEO HÀNH ĐỘNG ĐIỀU PHỐI CỦA ADMIN
    // ----------------------------------------------------------------
    let calculatedOrderStatus = "Đang giao"; // Mặc định cho các chặng sau
    let customerStatusText = status_text || "Đang vận chuyển";

    const stationIdx = Number(current_station_index);
    const coordIdx = current_coord_index !== undefined ? Number(current_coord_index) : 0;
    const cleanStatus = status_text ? status_text.toLowerCase().trim() : "";

    // === TẠI SHOP HOẶC ĐANG TRÊN ĐƯỜNG ĐI CHẶNG ĐẦU (stationIdx === -1) ===
    if (stationIdx === -1) {
      calculatedOrderStatus = "Lấy hàng";
      if (!status_text) {
        customerStatusText = "Sẵn sàng khởi hành";
      }
    } 
    // === CHẶNG LIÊN QUAN ĐẾN BƯU CỤC ĐẦU TIÊN (INDEX = 0) ===
    else if (stationIdx === -1) {
      // Khi nhấn ĐI TIẾP (Có chữ "xuất bưu cục" hoặc "rời kho") -> Chuyển ngay sang ĐANG GIAO
      if (cleanStatus.includes("xuất bưu cục") || cleanStatus.includes("rời kho") || cleanStatus.includes("rời bưu cục")) {
        calculatedOrderStatus = "Đang giao";
        customerStatusText = status_text;
      } 
      // Ngược lại (Đang di chuyển từ Shop tới hoặc Đã đến bưu cục 1 nhưng chưa bấm rời đi) -> Giữ LẤY HÀNG
      else {
        calculatedOrderStatus = "Lấy hàng";
        customerStatusText = status_text || "Xe đang di chuyển đến bưu cục gom hàng đầu tiên";
      }
    }
    // === CHẶNG DI CHUYỂN QUA CÁC TRẠM TRUNG CHUYỂN PHÍA SAU (INDEX > 0) ===
    else if (stationIdx > 2) {
      calculatedOrderStatus = "Đang giao";
    }

    // === CHẶNG CUỐI: HOÀN THÀNH GIAO ĐẾN KHÁCH HÀNG ===
    if (cleanStatus.includes("giao xong") || cleanStatus.includes("thành công")) {
      calculatedOrderStatus = "Đã giao";
      customerStatusText = "🎉 Giao hàng thành công";
    }

    // ----------------------------------------------------------------
    // [1] ĐỒNG BỘ CẬP NHẬT TRẠNG THÁI VÀO SQL (Bảng public.orders)
    // ----------------------------------------------------------------
    const updateOrderSql = `
      UPDATE public.orders 
      SET trang_thai_don_hang = $1 
      WHERE ma_don_hang = $2
    `;
    
    if (db.query) {
      await db.query(updateOrderSql, [calculatedOrderStatus, ma_don_hang]);
    } else {
      await db.execute(updateOrderSql, [calculatedOrderStatus, ma_don_hang]);
    }

    // ----------------------------------------------------------------
    // [2] ĐỒNG BỘ CẬP NHẬT TỌA ĐỘ VÀ STATUS_TEXT VÀO MONGODB
    // ----------------------------------------------------------------
    const updatedData = await LiveLocation.findOneAndUpdate(
      { ma_don_hang: ma_don_hang }, 
      {
        $set: {
          order_id: order_id,
          "current_location.coordinates": [Number(current_lng), Number(current_lat)], 
          current_station_index: stationIdx,
          current_coord_index: coordIdx, 
          status_text: customerStatusText, 
          is_truck: is_truck !== undefined ? is_truck : true,
          last_updated: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' } 
    );

    return res.status(200).json({
      success: true,
      message: "Đã đồng bộ cập nhật tọa độ xe và trạng thái đơn hàng thành công!",
      order_status: calculatedOrderStatus,
      data: updatedData
    });
  } catch (error) {
    console.error("❌ Lỗi API update-location:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;