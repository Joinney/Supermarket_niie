import express from 'express';
import { getAllProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Quản lý danh sách và chi tiết sản phẩm cho Demi Mart
 */

/**
 * @swagger
 * /api/products/all-products:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm
 *     description: API này dùng để lấy dữ liệu hiển thị cho trang Home.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Trả về mảng danh sách sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ma_san_pham:
 *                     type: string
 *                   ten_san_pham:
 *                     type: string
 *                   gia_ban:
 *                     type: number
 *       500:
 *         description: Lỗi hệ thống khi truy vấn database
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết một sản phẩm theo ID
 *     description: API phục vụ cho trang ProductDetail để hiển thị thông tin cụ thể.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Trả về thông tin chi tiết của sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm với ID cung cấp
 */
router.get('/:id', getProductById);

export default router;