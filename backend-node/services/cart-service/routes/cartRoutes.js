import express from 'express';
import multer from 'multer'; 
import { 
    getCart, 
    addToCart, 
    removeFromCart, 
    mergeCart, 
    removeSelectedFromCart,
    uploadPaymentProof,
    getCartByUserId // 🌟 Import thêm hàm vừa tạo ở Mục 1
} from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';

const storage = multer.diskStorage({});
const uploadReceipt = multer({ storage }); 

const router = express.Router();

// ... các cấu hình Swagger giữ nguyên của bạn ...

// Route cũ của User
router.get('/', protect, getCart);

/**
 * @swagger
 * /api/cart/internal/{userId}:
 *   get:
 *     summary: (Admin) Lấy thông tin giỏ hàng của một khách hàng cụ thể dựa trên ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về danh sách items trong giỏ hàng thành công
 */
router.get('/internal/:userId', getCartByUserId); // 🌟 Thêm Route này để Admin Frontend gọi lấy dữ liệu công khai

router.post('/add', protect, addToCart);
router.delete('/remove/:productId', protect, removeFromCart);
router.post('/merge', protect, mergeCart);


router.post('/remove-selected', protect, removeSelectedFromCart);
router.post('/orders/:orderId/payment-proof', protect, uploadReceipt.single('receiptFile'), uploadPaymentProof);


export default router;