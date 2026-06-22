import express from 'express';
import { getInternalVariants } from '../controllers/productController.js';

import {
    getAllProducts,
    getAllCategories,
    getProductById,
    getProductsByCategorySlug,
    searchProducts,
    searchCategories,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct,
    getAllCountries
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 1. NHÓM ROUTE TĨNH (STATIC ROUTES)
// =========================================================================

/**
 * @swagger
 * /api/products/countries:
 *   get:
 *     summary: Lấy danh sách quốc gia động kèm cấu hình tiền tệ
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Trả về danh sách quốc gia thành công
 */
router.get('/countries', getAllCountries);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo từ khóa
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: "Từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: "Mã quốc gia (VD: VN, US)"
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm phù hợp
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Lấy cây danh mục (Cấu trúc Cha - Con) theo quốc gia
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: "Mã quốc gia để lọc danh mục"
 *     responses:
 *       200:
 *         description: Trả về dữ liệu cây danh mục thành công
 */
router.get('/categories', getAllCategories);

/**
 * @swagger
 * /api/products/categories/search:
 *   get:
 *     summary: Tìm kiếm danh mục (Cha và Con) bằng từ khóa (Gõ 1-2 ký tự)
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: "Từ khóa tìm kiếm (VD: b, bá)"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: "Mã quốc gia (VD: VN, US)"
 *     responses:
 *       200:
 *         description: Trả về danh sách danh mục phù hợp
 */
router.get('/categories/search', searchCategories);

/**
 * @swagger
 * /api/products/without-descriptions:
 *   get:
 *     summary: Lấy danh sách sản phẩm thiếu hoặc chưa có mô tả
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
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm cần cập nhật mô tả
 */
router.get('/without-descriptions', getProductsWithoutDescriptions);

/**
 * @swagger
 * /api/products/batch-generate-descriptions:
 *   post:
 *     summary: Tự động tạo mô tả hàng loạt bằng AI
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
 *               useOnlineResearch:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hoàn tất quá trình tạo mô tả
 */
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);

/**
 * @swagger
 * /api/products/refresh-empty-descriptions:
 *   post:
 *     summary: Quét và làm mới các sản phẩm có mô tả trống bằng AI
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *               useOnlineResearch:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật mô tả thành công
 */
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

// =========================================================================
// 2. NHÓM ROUTE ĐỘNG (DYNAMIC ROUTES)
// =========================================================================

/**
 * @swagger
 * /api/products/category/{slug}:
 *   get:
 *     summary: Lấy danh sách sản phẩm theo slug danh mục
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 */
router.get('/category/:slug', getProductsByCategorySlug);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy tất cả sản phẩm hiển thị trên trang chủ
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
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm trang chủ
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo mới một sản phẩm
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_san_pham:
 *                 type: string
 *               ma_dm_con:
 *                 type: string
 *               mo_ta:
 *                 type: string
 *               ma_quoc_gia:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */
router.post('/', createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', getProductById);

router.post('/products/internal/variants', getInternalVariants);
export default router;