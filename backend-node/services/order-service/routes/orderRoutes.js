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
  getPostOffices,
  testReadKml,
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

// 4. Tiếp nhận đặt hàng (Hỗ trợ Microservices trừ kho & đồng bộ thanh toán)
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

// 8. Lấy danh sách toàn bộ đơn hàng phân trang, tìm kiếm và lọc cho Admin
router.get('/admin/all-orders', protect, getAllOrdersAdmin); 

// 9. Lấy chi tiết 1 đơn hàng kèm danh sách sản phẩm và thông tin khách hàng (Auth-Service)
router.get('/admin/orders/:id', protect, getOrderDetailAdmin); 

// 10. Hủy đơn hàng đang chờ xử lý và kích hoạt hoàn lại số lượng vào kho sản phẩm
router.put('/admin/orders/:ma_don_hang/cancel', protect, cancelOrder); 


// ========================================================
// 🔍 ROUTE KIỂM THỬ VÀ ĐỊNH TUYẾN LOGISTICS (LOGISTICS ENDPOINTS)
// ========================================================

// 11. 🌟 ĐÃ VÁ LỖI 404: Khớp nối 100% với Postman và API định tuyến chặng cuối chặng trục của Frontend
router.post('/test-kml', testReadKml);

export default router;