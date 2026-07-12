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
    is_truck,
    is_direct_delivery // Kế thừa cờ nhận diện đơn hàng nội tỉnh (giao thẳng) từ Frontend
  } = req.body;

  try {
    if (!ma_don_hang) {
      return res.status(400).json({ success: false, message: "Thiếu mã đơn hàng!" });
    }

    const stationIdx = Number(current_station_index);
    const coordIdx = current_coord_index !== undefined ? Number(current_coord_index) : 0;
    const cleanStatus = status_text ? status_text.toLowerCase().trim() : "";
    
    const latNum = parseFloat(current_lat);
    const lngNum = parseFloat(current_lng);

    // ----------------------------------------------------------------
    // 🛠️ LOGIC ÉP CHẶNG THEO GPS THỰC ĐỊA TUYỆT ĐỐI CHÍNH XÁC
    // ----------------------------------------------------------------
    let calculatedOrderStatus = "Đang giao"; // Mặc định cho các chặng giữa và chặng phát sau này
    let customerStatusText = status_text || "Đang vận chuyển";

    // Mốc kiểm tra từ khóa hoàn tất đơn hàng
    const isDeliverySuccess = (
      cleanStatus.includes("giao xong") || 
      cleanStatus.includes("thành công") || 
      cleanStatus.includes("hoàn thành") || 
      cleanStatus.includes("🎉 đã giao xong")
    );

    // [KIỂM TRA CHẶNG]: Tách biệt đơn nội tỉnh (giao trực tiếp) và liên tỉnh (qua HUB)
    if (is_direct_delivery === true || is_direct_delivery === 'true') {
      
      if (isDeliverySuccess) {
        // Nút bấm chặng cuối: Giao hàng thành công
        calculatedOrderStatus = "Đã giao";
        customerStatusText = "🎉 Giao hàng thành công";
      } 
      else if (stationIdx === -1 && coordIdx === 0) {
        // Trạng thái tĩnh ban đầu tại kho khi chưa bấm chạy mô phỏng
        calculatedOrderStatus = "Lấy hàng";
        customerStatusText = "Bưu tá đã tiếp nhận đơn hàng hỏa tốc và đang chuẩn bị hàng";
      } 
      else {
        // ĐƠN TRONG TỈNH: Chỉ cần bấm "Khởi hành/Tiếp tục" (coordIdx > 0 hoặc xe di chuyển) -> Chuyển ĐANG GIAO luôn
        calculatedOrderStatus = "Đang giao";
        if (!status_text || cleanStatus.includes("trung chuyển")) {
          customerStatusText = "Shipper đang giao hỏa tốc kiện hàng đến địa chỉ của bạn";
        }
      }

    } else {
      // ----------------------------------------------------------------
      // GIỮ NGUYÊN LUỒNG XỬ LÝ ĐƠN LIÊN TỈNH GỐC CỦA BẠN (QUA NHIỀU HUB)
      // ----------------------------------------------------------------
      const isAdminClickNextButton = (
        cleanStatus.includes("xuất bưu cục") || 
        cleanStatus.includes("rời kho") || 
        cleanStatus.includes("rời bưu cục") || 
        cleanStatus.includes("rời khỏi trạm") ||
        cleanStatus.includes("rời kho vận chuyển") ||
        cleanStatus.includes("đi tiếp")
      );

      if (isDeliverySuccess) {
        calculatedOrderStatus = "Đã giao";
        customerStatusText = "🎉 Giao hàng thành công";
      } 
      else if (stationIdx === -1) {
        calculatedOrderStatus = "Xác nhận"; 
        if (!status_text) {
          customerStatusText = "Xe vận tải đang di chuyển từ tổng kho hướng về trạm nhận hàng";
        }
      } 
      else if (stationIdx === 0) {
        if (isAdminClickNextButton) {
          calculatedOrderStatus = "Đang giao";
          customerStatusText = status_text || "Xe đã rời trạm đầu tiên, bắt đầu hành trình trung chuyển liên tỉnh";
        } else {
          calculatedOrderStatus = "Lấy hàng";
          customerStatusText = status_text || "Đã cập bến bưu cục chặng đầu - Đang làm thủ tục quét mã lấy hàng";
        }
      }
      else if (stationIdx > 0) {
        calculatedOrderStatus = "Đang giao";
      }
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
          "current_location.coordinates": [lngNum, latNum], 
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
      message: "Đã đồng bộ cập nhật lộ trình thực địa và trạng thái stepper thành công!",
      order_status: calculatedOrderStatus,
      data: updatedData
    });
  } catch (error) {
    console.error("❌ Lỗi API update-location:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;