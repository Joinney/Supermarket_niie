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
 * /api/cart:
 * get:
 * summary: Lấy giỏ hàng của người dùng hiện tại
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Trả về dữ liệu giỏ hàng thành công
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
 * type: object
 * description: Payload thêm sản phẩm (variantId, name, price, quantity, image)
 * responses:
 * 200:
 * description: Cập nhật giỏ hàng thành công
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
 * responses:
 * 200:
 * description: Xóa thành công
 */
router.delete('/remove/:productId', protect, removeFromCart);

/**
 * @swagger
 * /api/cart/merge:
 * post:
 * summary: Merge local cart into server cart
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Merged successfully
 */
router.post('/merge', protect, mergeCart);

/**
 * @swagger
 * /api/cart/remove-selected:
 * post:
 * summary: Xóa danh sách sản phẩm đã đặt hàng thành công
 * tags: [Cart]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * description: Object chứa mảng variant_ids để dọn dẹp giỏ hàng
 * responses:
 * 200:
 * description: Xóa các món đã chọn thành công
 */
router.post('/remove-selected', protect, removeSelectedFromCart);

export default router;