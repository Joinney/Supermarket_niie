import express from 'express';
import {
    getAllProducts,
    getProductById,
    getProductsByCategorySlug,
    searchProducts,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct
} from '../controllers/productController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Quản lý sản phẩm Demi Mart
 */

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm tìm được
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/products/batch-generate-descriptions:
 *   post:
 *     summary: Tạo mô tả sản phẩm hàng loạt bằng AI
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *                 default: vi
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);

/**
 * @swagger
 * /api/products/without-descriptions:
 *   get:
 *     summary: Lấy sản phẩm chưa có mô tả
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/without-descriptions', getProductsWithoutDescriptions);

/**
 * @swagger
 * /api/products/refresh-empty-descriptions:
 *   post:
 *     summary: Cập nhật mô tả cho sản phẩm cũ
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

/**
 * @swagger
 * /api/products/category/{slug}:
 *   get:
 *     summary: Lấy sản phẩm theo danh mục
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/category/:slug', getProductsByCategorySlug);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: VN
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten_san_pham
 *               - ma_danh_muc
 *             properties:
 *               ten_san_pham:
 *                 type: string
 *               ma_danh_muc:
 *                 type: integer
 *               gia_ban_le:
 *                 type: number
 *               mo_ta:
 *                 type: string
 *               ma_vung:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */
router.post('/', createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', getProductById);

export default router;

