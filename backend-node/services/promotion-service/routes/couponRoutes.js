import express from 'express';
import { 
    createCoupon, 
    getAllCoupons, 
    getCouponById, 
    updateCoupon, 
    deleteCoupon, 
    toggleCouponStatus, 
    validateCoupon, 
    applyCoupon 
} from '../controllers/couponController.js';
import { protect as verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========================================================
// 🛡️ NHÓM API QUẢN TRỊ (Dành cho Admin)
// ========================================================

// 1. Tạo mã khuyến mãi mới 
router.post('/create', createCoupon);

// 2. Lấy danh sách toàn bộ mã
router.get('/', getAllCoupons);

// 3. Lấy chi tiết 1 mã (để xem lại / chỉnh sửa)
router.get('/:id', getCouponById);

// 4. Chỉnh sửa mã (Chỉ sửa được khi chưa có khách nào dùng)
router.put('/:id', updateCoupon);

// 5. Xóa mã vĩnh viễn
router.delete('/:id', deleteCoupon);

// 6. Bật/Tắt trạng thái (Phát hành/Tạm ngưng)
router.put('/toggle/:id', toggleCouponStatus);


// ========================================================
// 🛍️ NHÓM API CLIENT & HỆ THỐNG NỘI BỘ (Internal)
// ========================================================

// 7. Khách hàng kiểm tra mã trước khi đặt hàng (Validate) - ĐÃ ĐƯỢC BẢO VỆ ✅
router.post('/validate', verifyToken, validateCoupon);

// 8. Chốt mã & Trừ lượt (Apply) - Gọi ngầm từ Order Service khi đặt hàng thành công
router.post('/apply', applyCoupon);

export default router;