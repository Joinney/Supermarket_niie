import express from 'express';
import upload from '../configs/cloudinary/cloudinary.js'; 
import 
{ 
    getReviewsByProduct, 
    createReview, 
    checkReviewStatus 
} 
from '../controllers/reviewController.js';

const router = express.Router();

router.get('/products/:id/reviews', getReviewsByProduct);

router.post('/reviews', upload.array('media', 5), createReview);

router.get('/orders/:orderId/check-review', checkReviewStatus);
export default router;