import express from 'express';
import { getShippingFee, placeOrder, updateInternalOrderStatus } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Không còn một dòng comment Swagger nào ở đây nữa, tránh bị Prettier phá lề
router.post('/shipping-fee', protect, getShippingFee);
router.post('/place-order', protect, placeOrder);

// 🌟 Tuyến đường đồng bộ Microservices nội bộ nhận từ payment-service
router.post('/internal/update-status', updateInternalOrderStatus);

export default router;