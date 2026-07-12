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
  createOrderTrackingLogNode, // 🌟 THÊM MỚI: Import hàm controller xử lý tạo node
  calculateShipping 
} from '../controllers/orderController.js';
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


// ========================================================
// 🔒 ROUTE ĐỒNG BỘ NỘI BỘ (INTERNAL SERVICE ENDPOINTS)
// ========================================================

// 6. Tiếp nhận đồng bộ trạng thái thanh toán từ Payment-Service (Gọi nội bộ Docker)
router.post('/internal/update-status', updateInternalOrderStatus);


// ========================================================
// 📊 ROUTE DÀNH CHO QUẢN TRỊ VIÊN (ADMIN ENDPOINTS)
// ========================================================

// 7. Thống kê số liệu đơn hàng cho Admin Dashboard (Tổng doanh thu, đơn trong ngày...)
router.get('/admin/statistics', protect, getOrderStatistics); 

// 8. Lấy danh sách toàn bộ đơn hàng phân trang, tìm kiếm và lọc cho Admin (Tích hợp bóc vết trạm hiện tại)
router.get('/admin/all-orders', protect, getAllOrdersAdmin); 

// 9. Lấy chi tiết 1 đơn hàng kèm danh sách sản phẩm và thông tin khách hàng (Auth-Service)
router.get('/admin/orders/:id', protect, getOrderDetailAdmin); 

// 10. Hủy đơn hàng đang chờ xử lý và kích hoạt hoàn lại số lượng vào kho sản phẩm
router.put('/admin/orders/:ma_don_hang/cancel', protect, cancelOrder); 

// 9.1 Lấy danh sách đơn hàng theo user id (Admin) - để trang quản trị xem lịch sử đơn của 1 khách
router.get('/admin/user-orders/:userId', protect, getOrdersByUserAdmin);


// ========================================================
// 🏁 ROUTE ĐỊNH TUYẾN LOGISTICS VÀ KIỂM THỬ (LOGISTICS ENDPOINTS)
// ========================================================

// 11. TRUY VẤN LOGISTICS: Kết xuất mảng lộ trình bưu cục chặng giữa và chặng phát cuối từ DB lên bản đồ
router.get('/shipping/logs/:orderId', getOrderTrackingLogs);

// 12. GHI LOG LOGISTICS REALTIME: Tiếp nhận lệnh nhảy trạm từ Admin để lưu lịch sử quét trạm vào PostgreSQL
// 🛠️ ĐÃ FIX LỖI 404: Khai báo endpoint POST để Front-end gửi dữ liệu lên thành công
router.post('/shipping/tracking-logs/create-node', createOrderTrackingLogNode);

// 13. Endpoint test Postman đọc dữ liệu KML gốc toàn quốc
router.post('/test-kml', testReadKml);

export default router;