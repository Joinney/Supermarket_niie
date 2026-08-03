// File: backend/services/order-service/routes/orderRoutes.js
import express from 'express';
import { 
  getShippingFee, 
  placeOrder, 
  updateInternalOrderStatus, 
  getOrderStatistics, 
  getAllOrdersAdmin, 
  getMyOrders, 
  getOrderDetailAdmin, 
  cancelOrder,
  getOrdersByUserAdmin,
  getPostOffices,
  testReadKml,
  getOrderTrackingLogs,
  createOrderTrackingLogNode, 
  calculateShipping,
  getUserSpent,
  payOrderWithDemiPay,
  updateOrderStatusAdmin // 🌟 Import hàm xử lý cập nhật trạng thái đơn hàng của Admin
} from '../controllers/orderController.js';

// Đồng bộ import các hàm thống kê từ đúng tệp tin cấu hình statisticsController
import { 
  getMonthlyRevenue, 
  getOrderOverviewStats,
  getTopProducts
} from '../controllers/statisticsController.js';

// Chỉ sử dụng middleware 'protect' đã được định nghĩa chắc chắn để chống lỗi requireAdmin undefined
import { protect } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// ========================================================
// 🛒 ROUTE DÀNH CHO KHÁCH HÀNG (CUSTOMER ENDPOINTS)
// ========================================================

// 1. Tính cước phí giao nhận vận chuyển dự phòng (GHN)
router.post('/shipping-fee', protect, getShippingFee);

// 2. Tính toán cự cận địa lý cửa hàng hoạt động và chi phí dựa trên tọa độ
router.post('/shipping/calc', calculateShipping);

// 3. Lấy danh sách bưu cục GHN cho bản đồ (Xử lý dữ liệu KML động)
router.post('/post-offices', getPostOffices);

// 4. Tiếp nhận đặt hàng (Tự động hóa cấy lộ trình bưu cục vào DB khi khởi tạo)
router.post('/place-order', protect, placeOrder);

// 5. Lấy danh sách lịch sử đơn hàng cá nhân của người dùng đang đăng nhập
router.get('/my-orders', protect, getMyOrders);

// 5.1 Khách hàng tự hủy đơn hàng đang ở trạng thái chờ xử lý (Tự động hoàn kho & xóa sạch trạm trục)
router.put('/orders/:ma_don_hang/cancel', protect, cancelOrder);

// 5.2 Kiểm tra xem khách hàng đã đánh giá đơn hàng này chưa (Dữ liệu tạm để không báo 404)
router.get('/:id/check-review', (req, res) => {
    res.status(200).json({ hasReviewed: false }); 
});

// ========================================================
// 🔒 ROUTE ĐỒNG BỘ NỘI BỘ (INTERNAL SERVICE ENDPOINTS)
// ========================================================

// 6. Tiếp nhận đồng bộ trạng thái thanh toán từ Payment-Service (Gọi nội bộ Docker)
router.post('/internal/update-status', updateInternalOrderStatus);
router.post('/internal-status', updateInternalOrderStatus);

// ========================================================
// 📊 ROUTE DÀNH CHO QUẢN TRỊ VIÊN (ADMIN ENDPOINTS)
// ========================================================

// 7. Thống kê số liệu đơn hàng cho Admin Dashboard (Tổng doanh thu, đơn trong ngày...)
router.get('/admin/statistics', protect, getOrderStatistics); 

// 8. Lấy danh sách toàn bộ đơn hàng phân trang, tìm kiếm và lọc cho Admin (Tích hợp bóc vết trạm hiện tại)
router.get('/admin/all-orders', protect, getAllOrdersAdmin); 

// 9. Lấy chi tiết 1 đơn hàng kèm danh sách sản phẩm và thông tin khách hàng (Auth-Service)
router.get('/admin/orders/:id', protect, getOrderDetailAdmin); 

// 🌟 10. Admin cập nhật trạng thái đơn hàng nhanh (Xác nhận, chuyển trạng thái giao hàng)
router.put('/admin/orders/:ma_don_hang/status', protect, updateOrderStatusAdmin);
router.patch('/admin/orders/:ma_don_hang/status', protect, updateOrderStatusAdmin);

// 11. Admin can thiệp hủy đơn hàng đang chờ xử lý và kích hoạt hoàn kho sản phẩm
router.put('/admin/orders/:ma_don_hang/cancel', protect, cancelOrder); 

// 12. Lấy danh sách đơn hàng theo user id (Admin) - để trang quản trị xem lịch sử đơn của 1 khách
router.get('/admin/user-orders/:userId', protect, getOrdersByUserAdmin);

// Các endpoint cung cấp chuỗi thời gian cho đồ thị và số liệu widgets tầng 1
router.get('/admin/monthly-revenue', protect, getMonthlyRevenue);
router.get('/admin/overview', protect, getOrderOverviewStats);
router.get('/admin/top-products', protect, getTopProducts);

// ========================================================
// 🏁 ROUTE ĐỊNH TUYẾN LOGISTICS VÀ KIỂM THỬ (LOGISTICS ENDPOINTS)
// ========================================================

// 13. TRUY VẤN LOGISTICS: Kết xuất mảng lộ trình bưu cục chặng giữa và chặng phát cuối từ DB lên bản đồ
router.get('/shipping/logs/:orderId', getOrderTrackingLogs);

// 14. GHI LOG LOGISTICS REALTIME: Tiếp nhận lệnh nhảy trạm từ Admin để lưu lịch sử quét trạm vào PostgreSQL
router.post('/shipping/tracking-logs/create-node', createOrderTrackingLogNode);

// 15. Endpoint test Postman đọc dữ liệu KML gốc toàn quốc
router.post('/test-kml', testReadKml);

// 16. TÍNH TỔNG TIỀN CHI TIÊU CỦA KHÁCH HÀNG
router.get('/internal/user-spent/:userId', getUserSpent);

export default router;