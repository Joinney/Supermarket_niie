import express from 'express';
import { getShippingFee, placeOrder, vnpayReturn } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Nhập Token JWT theo định dạng "Bearer <token>"
 */

/**
 * @swagger
 * /orders/shipping-fee:
 *   post:
 *     summary: Tính toán phí vận chuyển từ API Giao Hàng Nhanh (GHN)
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_district_id
 *               - to_ward_code
 *             properties:
 *               to_district_id:
 *                 type: integer
 *                 example: 1454
 *                 description: Mã quận/huyện GHN
 *               to_ward_code:
 *                 type: string
 *                 example: "21211"
 *                 description: Mã phường/xã GHN
 *               weight:
 *                 type: integer
 *                 example: 1000
 *                 description: Trọng lượng (gram)
 *     responses:
 *       200:
 *         description: Trả về danh sách gói cước vận chuyển
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       cost:
 *                         type: integer
 *                       days:
 *                         type: string
 *                       logo:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 */
router.post('/shipping-fee', protect, getShippingFee);

/**
 * @swagger
 * /orders/place-order:
 *   post:
 *     summary: Xử lý đặt hàng (Lưu Transaction vào PostgreSQL)
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - thong_tin_giao_hang
 *               - danh_sach_san_pham
 *               - tong_thanh_toan
 *             properties:
 *               thong_tin_giao_hang:
 *                 type: object
 *                 properties:
 *                   ten_nguoi_nhan:
 *                     type: string
 *                     example: "Kelvin Vo"
 *                   so_dien_thoai:
 *                     type: string
 *                     example: "0901234567"
 *                   dia_chi_day_du:
 *                     type: string
 *                   to_district_id:
 *                     type: integer
 *                   to_ward_code:
 *                     type: string
 *                   weight:
 *                     type: integer
 *               danh_sach_san_pham:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variant_id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: integer
 *               tong_tien_hang:
 *                 type: integer
 *               phi_van_chuyen:
 *                 type: integer
 *               so_tien_giam_gia:
 *                 type: integer
 *               tong_thanh_toan:
 *                 type: integer
 *               phuong_thuc_thanh_toan:
 *                 type: string
 *                 example: "COD"
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/place-order', protect, placeOrder);

/**
 * @swagger
 * /orders/vnpay-callback:
 *   get:
 *     summary: Tiếp nhận phản hồi kết quả giao dịch từ VNPay
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi kết quả (00 là thành công)
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Chuỗi mã hóa bảo toàn dữ liệu
 *     responses:
 *       200:
 *         description: Xử lý đối soát thành công
 *       400:
 *         description: Chuỗi chữ ký không hợp lệ
 */
router.get('/vnpay-callback', vnpayReturn);

export default router;