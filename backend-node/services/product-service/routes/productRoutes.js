import express from 'express';
import {
    getAllProducts,
    getAllCategories,
    getProductById,
    getProductsByCategorySlug,
    searchProducts,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct,
    getAllCountries
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 1. NHÓM ROUTE TĨNH (STATIC ROUTES) - LUÔN LUÔN ĐẶT TRÊN ĐẦU
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
 *         description: Từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Mã quốc gia (VD: VN, US)
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
 *         description: Mã quốc gia để lọc danh mục
 *     responses:
 *       200:
 *         description: Trả về dữ liệu cây danh mục thành công
 */
router.get('/categories', getAllCategories);

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
// 2. NHÓM ROUTE CHỨA PARAM ĐỘNG (DYNAMIC ROUTES) - ĐẶT Ở DƯỚI CÙNG
// =========================================================================

/**
 * @swagger
 * /api/products/category/{slug}:
 *   get:
 *     summary: Lấy danh sách sản phẩm dựa theo đường dẫn danh mục (Slug)
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
 *     summary: Lấy thông tin chi tiết kèm biến thể và media của một sản phẩm
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

export default router;

