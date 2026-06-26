import express from 'express';
import { getShippingFee, placeOrder, updateInternalOrderStatus, getOrderStatistics, getAllOrdersAdmin } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Không còn một dòng comment Swagger nào ở đây nữa, tránh bị Prettier phá lề
router.post('/shipping-fee', protect, getShippingFee);
router.post('/place-order', protect, placeOrder);
router.post('/internal/update-status', updateInternalOrderStatus);
router.get('/admin/statistics', protect, getOrderStatistics);

router.get('/', getAllOrdersAdmin);

export default router;