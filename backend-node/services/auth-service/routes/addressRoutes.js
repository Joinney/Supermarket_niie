import express from 'express';
import { 
    getAddresses, 
    getAddressesByUserId, 
    getAddressById, // 🌟 Import controller chi tiết theo address_id
    addAddress, 
    updateAddress, 
    deleteAddress,
    getProvincesProxy,
    getDistrictsProxy,
    getWardsProxy 
} from '../controllers/addressController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Addresses
 *     description: API quản lý địa chỉ giao hàng và proxy danh mục địa chính (Demi Mart)
 */

// ========================================================
// 🔓 KHU VỰC API CÔNG KHAI (PUBLIC) - PHỤC VỤ FE & ADMIN VIEW
// ========================================================

router.get('/locations/provinces', getProvincesProxy);
router.get('/locations/districts', getDistrictsProxy);
router.get('/locations/wards', getWardsProxy);

/**
 * @swagger
 * /api/addresses/detail/{id}:
 *   get:
 *     summary: (Public / Admin) Lấy chi tiết 1 địa chỉ dựa trên address_id
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ (address_id)
 *     responses:
 *       200:
 *         description: Trả về thông tin địa chỉ thành công
 *       404:
 *         description: Không tìm thấy địa chỉ
 */
router.get('/detail/:id', getAddressById);


// ========================================================
// ⚙️ KHU VỰC API INTERNAL / ADMIN VIEW - TRUY VẤN THEO USER ID
// ========================================================

router.get('/internal/:userId', getAddressesByUserId);


// ========================================================
// 🔐 KHU VỰC API BẢO MẬT (PRIVATE) - YÊU CẦU ĐĂNG NHẬP (USER VIEW)
// ========================================================

router.get('/', authenticateToken, getAddresses); 
router.post('/', authenticateToken, addAddress);
router.put('/:id', authenticateToken, updateAddress);
router.delete('/:id', authenticateToken, deleteAddress);

export default router;