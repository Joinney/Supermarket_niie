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
  getUserTotalSpent,
  getUserOrdersInternal,
  getCustomerStatsInternal
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { calculateShipping } from '../controllers/storeController.js';

const router = express.Router();

// ========================================================
// 1. CÁC TUYẾN ĐƯỜNG XỬ LÝ (POST / PUT)
// ========================================================
router.post('/shipping-fee', protect, getShippingFee);
router.post('/place-order', protect, placeOrder);
router.post('/internal/update-status', updateInternalOrderStatus); // API gọi nội bộ giữa các Service, thường không cần protect user
router.post('/shipping/calc', calculateShipping);

// ========================================================
// 2. CÁC TUYẾN ĐƯỜNG TRUY VẤN DỮ LIỆU (GET)
// ========================================================
router.get('/admin/statistics', protect, getOrderStatistics);

// protect bảo mật dữ liệu đơn hàng cho Admin
router.get('/', protect, getAllOrdersAdmin); 

router.get('/my-orders', protect, getMyOrders); 

router.get('/:id', protect, getOrderDetailAdmin);

router.put('/cancel/:ma_don_hang', protect, cancelOrder); 

// ========================================================
// 3. CÁC TUYẾN ĐƯỜNG NỘI BỘ (INTERNAL SERVER-TO-SERVER)
// ========================================================
router.get('/internal/user-spent/:userId', getUserTotalSpent);
router.get('/internal/user-orders/:userId', getUserOrdersInternal);
router.get('/internal/customer-stats', getCustomerStatsInternal);
export default router;