import express from 'express';
import { LiveLocation } from '../models/liveLocationModel.js'; 

const router = express.Router();

router.post('/update-location', async (req, res) => {
  const { 
    ma_don_hang, 
    order_id, 
    current_lat, 
    current_lng, 
    current_station_index, 
    current_coord_index, // 🌟 NHẬN THÊM: Chỉ số index tiến trình từ Front-End gửi lên
    status_text, 
    is_truck 
  } = req.body;

  try {
    const updatedData = await LiveLocation.findOneAndUpdate(
      { ma_don_hang: ma_don_hang }, 
      {
        $set: {
          order_id: order_id,
          // Đảo vị trí thành [Kinh độ lng, Vĩ độ lat] để đúng chuẩn GeoJSON của MongoDB
          "current_location.coordinates": [Number(current_lng), Number(current_lat)], 
          current_station_index: Number(current_station_index),
          // 🌟 LƯU TRỮ VÀO MONGO: Ép kiểu dữ liệu Number chống reset tiến trình OSRM khi F5
          current_coord_index: current_coord_index !== undefined ? Number(current_coord_index) : 0, 
          status_text: status_text || "Đang di chuyển",
          is_truck: is_truck !== undefined ? is_truck : true,
          last_updated: new Date()
        }
      },
      // Thay new: true bằng returnDocument để tránh cảnh báo Mongoose đời mới
      { upsert: true, returnDocument: 'after' } 
    );

    return res.status(200).json({
      success: true,
      message: "Đã cập nhật vị trí và tiến trình xe vào MongoDB Atlas thành công!",
      data: updatedData
    });
  } catch (error) {
    console.error("❌ Lỗi API update-location:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;