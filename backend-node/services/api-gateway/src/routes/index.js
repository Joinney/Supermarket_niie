import express from 'express';
import { services } from '../config/services.config.js';
import { setupProxy } from '../middlewares/proxy.middleware.js';

const router = express.Router();

// ==========================================
// ĐỊNH TUYẾN TRỰC TIẾP (Khớp 100% với Frontend)
// ==========================================
router.use('/api/v1/auth', setupProxy(services.auth));
router.use('/api/v1/products', setupProxy(services.product));
router.use('/api/v1/categories', setupProxy(services.product)); // Categories chung cổng 5002
router.use('/api/v1/cart', setupProxy(services.cart));
router.use('/api/v1/payment', setupProxy(services.payment));
router.use('/api/v1/orders', setupProxy(services.order));
router.use('/api/v1/inventory', setupProxy(services.inventory));
router.use('/api/v1/promotions', setupProxy(services.promotion));
router.use('/api/v1/coupons', setupProxy(services.promotion)); // Coupons chung cổng 5007
router.use('/api/v1/ai', setupProxy(services.ai));
router.use('/api/v1/notifications', setupProxy(services.notification));

// Đón lõng những Route ngoại lệ xuất hiện trong log của bạn
router.use('/api/v1/nations', setupProxy(services.product));

// Xử lý luồng Socket.IO cho ứng dụng (Trỏ về Order Service)
router.use('/socket.io', setupProxy(services.order, true));

// ==========================================
// ĐÓN LÕNG CÁC ROUTE TỪ FRONTEND
// ==========================================

// 1. Nhóm Kho hàng (Trỏ về Inventory Service)
router.use('/api/v1/warehouses', setupProxy(services.inventory));
router.use('/api/v1/inventory-tickets', setupProxy(services.inventory));
router.use('/api/v1/lots', setupProxy(services.inventory));
router.use('/api/v1/transfers', setupProxy(services.inventory));

// 2. Nhóm Đơn hàng Admin (Trỏ về Order Service)
router.use('/api/v1/admin/all-orders', setupProxy(services.order));

// 3. Nhóm Hồ sơ & Địa chỉ (Trỏ về Auth/User Service)
router.use('/api/v1/addresses', setupProxy(services.auth));
router.use('/api/v1/profile', setupProxy(services.auth));

// 4. Trỏ API thống kê Admin về Order Service
router.use('/api/v1/admin/statistics', setupProxy(services.order));

// 5. Trỏ API chi tiết đơn hàng Admin về Order Service
router.use('/api/v1/admin/orders', setupProxy(services.order));
router.use('/api/v1/admin/user-orders', setupProxy(services.order));

// 6. Nhóm Thanh toán VNPay & PayPal (Trỏ về Payment Service)
router.use('/api/v1/create-transaction', setupProxy(services.payment));
router.use('/api/v1/paypal-capture', setupProxy(services.payment));
router.use('/api/v1/vnpay-return', setupProxy(services.payment));

// 7. Nhóm Vận chuyển & Tracking (Trỏ về Order Service)
// (Vì trong file orderRoutes.js bạn đã code sẵn các route bắt đầu bằng /shipping/)
router.use('/api/v1/shipping', setupProxy(services.order));

// 8. Bổ sung API Quy đổi đơn vị tính (Trỏ về Product Service)
router.use('/api/v1/unit-conversions', setupProxy(services.product));

// 9. Nhóm Đánh giá sản phẩm (Trỏ về Product Service)
router.use('/api/v1/reviews', setupProxy(services.product));

// Health Check
router.get('/health', (req, res) => {
    res.json({ success: true, message: "API Gateway của Demi Mart đang hoạt động mượt mà 🚀" });
});

export default router;