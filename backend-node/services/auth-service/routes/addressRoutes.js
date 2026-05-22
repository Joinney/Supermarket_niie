import express from 'express';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Addresses
 * description: API quản lý địa chỉ giao hàng của người dùng
 */

/**
 * @swagger
 * /api/addresses:
 * get:
 * summary: Lấy danh sách địa chỉ của user
 * tags: [Addresses]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Lấy danh sách thành công
 * 500:
 * description: Lỗi server
 */
router.get('/', authenticateToken, getAddresses); 

/**
 * @swagger
 * /api/addresses:
 * post:
 * summary: Thêm địa chỉ mới
 * tags: [Addresses]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * receiver_name:
 * type: string
 * example: "Toàn Võ Duy"
 * receiver_phone:
 * type: string
 * example: "1233454365"
 * province_name:
 * type: string
 * example: "Hồ Chí Minh"
 * province_id:
 * type: integer
 * example: 202
 * district_name:
 * type: string
 * example: "Quận 1"
 * district_id:
 * type: integer
 * example: 1442
 * ward_name:
 * type: string
 * example: "Phường Bến Nghé"
 * ward_code:
 * type: integer
 * example: 20101
 * detail_address:
 * type: string
 * example: "123 Đường ABC"
 * is_default:
 * type: boolean
 * example: true
 * address_type:
 * type: string
 * example: "home"
 * responses:
 * 201:
 * description: Đã lưu địa chỉ thành công
 * 400:
 * description: Dữ liệu gửi lên không hợp lệ
 * 500:
 * description: Lỗi server
 */
router.post('/', authenticateToken, addAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 * put:
 * summary: Cập nhật địa chỉ
 * tags: [Addresses]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID của địa chỉ cần cập nhật
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * receiver_name:
 * type: string
 * example: "Toàn Võ Duy"
 * receiver_phone:
 * type: string
 * example: "0987654321"
 * province_name:
 * type: string
 * example: "Hà Nội"
 * province_id:
 * type: integer
 * example: 201
 * district_name:
 * type: string
 * example: "Quận Đống Đa"
 * district_id:
 * type: integer
 * example: 1443
 * ward_name:
 * type: string
 * example: "Phường Ô Chợ Dừa"
 * ward_code:
 * type: integer
 * example: 20102
 * detail_address:
 * type: string
 * example: "456 Đường XYZ"
 * is_default:
 * type: boolean
 * example: false
 * address_type:
 * type: string
 * example: "company"
 * responses:
 * 200:
 * description: Đã cập nhật địa chỉ thành công
 * 404:
 * description: Không tìm thấy địa chỉ
 * 500:
 * description: Lỗi server
 */
router.put('/:id', authenticateToken, updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 * delete:
 * summary: Xóa địa chỉ
 * tags: [Addresses]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID của địa chỉ cần xóa
 * responses:
 * 200:
 * description: Đã xóa địa chỉ thành công
 * 404:
 * description: Không tìm thấy địa chỉ
 * 500:
 * description: Lỗi server
 */
router.delete('/:id', authenticateToken, deleteAddress);

export default router;