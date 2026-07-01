import express from 'express';
import { 
  getShippingFee, 
  placeOrder, 
  updateInternalOrderStatus, 
  getOrderStatistics, 
  getAllOrdersAdmin,
  getMyOrders,
  getOrderDetailAdmin
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { calculateShipping } from '../controllers/storeController.js';

const router = express.Router();

// Các tuyến đường xử lý Đơn hàng & Vận chuyển (POST)
router.post('/shipping-fee', protect, getShippingFee);
router.post('/place-order', protect, placeOrder);
router.post('/internal/update-status', updateInternalOrderStatus);
router.post('/shipping/calc', calculateShipping);

// Các tuyến đường truy vấn Dữ liệu (GET)
router.get('/admin/statistics', protect, getOrderStatistics);
router.get('/', getAllOrdersAdmin);
router.get('/my-orders', protect, getMyOrders); // Sử dụng thống nhất middleware 'protect'
router.get('/:id', getOrderDetailAdmin);

export default router;