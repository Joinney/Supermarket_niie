import express from 'express';
import { 
    getCart, 
    addToCart, 
    removeFromCart, 
    mergeCart, 
    removeSelectedFromCart 
} from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 * securitySchemes:
 * bearerAuth:
 * type: http
 * scheme: bearer
 * bearerFormat: JWT
 * schemas:
 * CartItem:
 * type: object
 * required:
 * - variantId
 * - productId
 * - name
 * - price
 * - quantity
 * properties:
 * variantId:
 * type: string
 * description: Mã biến thể cụ thể từ PostgreSQL (Khóa chính trong giỏ hàng NoSQL)
 * example: "CZ-DCS-C350"
 * productId:
 * type: string
 * description: Mã sản phẩm cha phục vụ điều hướng chuyển trang
 * example: "MSP8932606180142"
 * name:
 * type: string
 * description: Tên sản phẩm chính gốc
 * example: "Trà Đóng Chai Cozy"
 * variantName:
 * type: string
 * description: Nhãn phân loại chi tiết được chọn
 * example: "Trà Cozy Đào Cam Sả - Chai 350ml"
 * price:
 * type: number
 * description: Giá bán lẻ của biến thể tại thời điểm thêm vào giỏ
 * example: 10000
 * quantity:
 * type: number
 * description: Số lượng sản phẩm muốn đặt
 * example: 1
 * image:
 * type: string
 * description: URL hình ảnh chính của biến thể sản phẩm
 * example: "https://res.cloudinary.com/demimart/image/upload/cozy_peach.jpg"
 * categorySlug:
 * type: string
 * description: Slug danh mục dùng cho định tuyến quốc tế ở FE
 * example: "tra-dong-chai"
 * countryCode:
 * type: string
 * description: Mã quốc gia quản lý kho bãi
 * example: "vn"
 */

/**
 * @swagger
 * /api/cart:
 * get:
 * summary: Lấy giỏ hàng của người dùng hiện tại
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Trả về dữ liệu giỏ hàng thành công
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * userId:
 * type: string
 * example: "user_123"
 * items:
 * type: array
 * items:
 * $ref: '#/components/schemas/CartItem'
 */
router.get('/', protect, getCart);

/**
 * @swagger
 * /api/cart/add:
 * post:
 * summary: Thêm sản phẩm vào giỏ hàng
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/CartItem'
 * responses:
 * 200:
 * description: Cập nhật giỏ hàng thành công
 * 500:
 * description: Lỗi hệ thống hoặc lỗi phân rã dữ liệu
 */
router.post('/add', protect, addToCart);

/**
 * @swagger
 * /api/cart/remove/{productId}:
 * delete:
 * summary: Xóa sản phẩm khỏi giỏ hàng
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: productId
 * required: true
 * schema:
 * type: string
 * description: Truyền mã variantId cần xóa khỏi giỏ hàng
 * example: "CZ-DCS-C350"
 * responses:
 * 200:
 * description: Xóa sản phẩm khỏi giỏ hàng thành công
 */
router.delete('/remove/:productId', protect, removeFromCart);

/**
 * @swagger
 * /api/cart/merge:
 * post:
 * summary: Đồng bộ giỏ hàng từ LocalStorage lên Server khi đăng nhập
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * items:
 * type: array
 * items:
 * $ref: '#/components/schemas/CartItem'
 * responses:
 * 200:
 * description: Merged successfully
 */
router.post('/merge', protect, mergeCart);

/**
 * @swagger
 * /api/cart/remove-selected:
 * post:
 * summary: Xóa danh sách sản phẩm đã đặt hàng thành công khỏi MongoDB
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - variant_ids
 * properties:
 * variant_ids:
 * type: array
 * items:
 * type: string
 * example: ["CZ-DCS-C350"]
 * responses:
 * 200:
 * description: Xóa các món đã chọn thành công
 */
router.post('/remove-selected', protect, removeSelectedFromCart);

export default router;