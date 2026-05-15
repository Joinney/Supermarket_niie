// routes/addressRoutes.js
import express from 'express';
import { getAddresses, addAddress } from '../controllers/addressController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Demi nhớ để '/' chứ đừng để '/api/addresses' ở đây nữa nhé
router.get('/', authenticateToken, getAddresses); 
router.post('/', authenticateToken, addAddress);

export default router;