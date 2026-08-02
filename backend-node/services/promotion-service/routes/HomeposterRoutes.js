import express from 'express';
import HomeAdvertisement from '../models/Homeposter.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/promotions/homeposters:
 *   get:
 *     summary: Lấy cấu hình banner quảng cáo trang chủ
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: Thành công
 */
// 🟢 Sửa route '/' thành ['/', '/homeposters'] để hỗ trợ cả 2 đường dẫn
router.get(['/', '/homeposters'], async (req, res) => {
  try {
    let config = await HomeAdvertisement.findOne();
    if (!config) {
      config = await HomeAdvertisement.create({});
    }
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu quảng cáo', error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/promotions/homeposters:
 *   put:
 *     summary: Cập nhật cấu hình banner quảng cáo từ Admin (PosterBuilder)
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: Lưu thành công
 */
// 🟢 Sửa route '/' thành ['/', '/homeposters'] cho phương thức PUT
router.put(['/', '/homeposters'], async (req, res) => {
  try {
    const updated = await HomeAdvertisement.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    // ⚡ Phát tín hiệu Socket.io tới Frontend nếu bạn dùng Realtime
    const io = req.app.get('socketio');
    if (io) {
      io.emit('homeposter_updated', updated);
    }

    res.status(200).json({ success: true, message: 'Lưu cấu hình quảng cáo thành công!', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi lưu quảng cáo', error: err.message });
  }
});

export default router;