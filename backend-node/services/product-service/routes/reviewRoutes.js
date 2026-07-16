import express from 'express';
import { getReviewsByProduct, createReview } from '../controllers/reviewController.js';

const router = express.Router();

// Lấy danh sách đánh giá của một sản phẩm
router.get('/products/:id/reviews', getReviewsByProduct);

// Tạo đánh giá mới (Tạm thời không cần kẹp middleware auth)
router.post('/reviews', createReview);

export default router;