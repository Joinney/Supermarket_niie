import express from 'express';
import {
    getInternalVariants,
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
    getReviewsByProduct,
    getRelatedProducts,
    getAllCountries
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================

/**
 * @swagger
 * /api/products/internal/variants:
 *   post:
 *     summary: Lấy thông tin chi tiết biến thể phục vụ Cart Service và Order Service
 *     tags:
 *       - Internal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - MBT_VN_092_1
 *                   - MBT_VN_089_1
 *     responses:
 *       200:
 *         description: Trả về danh sách thông tin biến thể
 *       400:
 *         description: Thiếu danh sách mã biến thể
 */
router.post('/internal/variants', getInternalVariants);

// =========================================================================
// 🏢 1. NHÓM ROUTE TĨNH (STATIC ROUTES)
// =========================================================================

/**
 * @swagger
 * /api/products/countries:
 *   get:
 *     summary: Lấy danh sách quốc gia và cấu hình tiền tệ
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Thành công
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
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Mã quốc gia (VN, US, CN)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm phù hợp
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Lấy cây danh mục sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Mã quốc gia
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/categories', getAllCategories);

/**
 * @swagger
 * /api/products/categories/search:
 *   get:
 *     summary: Tìm kiếm danh mục bằng từ khóa
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Mã quốc gia
 *     responses:
 *       200:
 *         description: Danh sách danh mục phù hợp
 */
router.get('/categories/search', searchCategories);

/**
 * @swagger
 * /api/products/without-descriptions:
 *   get:
 *     summary: Lấy danh sách sản phẩm chưa có mô tả
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
 *         description: Danh sách sản phẩm thiếu mô tả
 */
router.get('/without-descriptions', getProductsWithoutDescriptions);

/**
 * @swagger
 * /api/products/batch-generate-descriptions:
 *   post:
 *     summary: Sinh mô tả hàng loạt bằng AI
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
 *         description: Hoàn tất sinh mô tả
 */
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);

/**
 * @swagger
 * /api/products/refresh-empty-descriptions:
 *   post:
 *     summary: Làm mới các mô tả đang trống bằng AI
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
 *         description: Cập nhật thành công
 */
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

// =========================================================================
// 🔄 2. NHÓM ROUTE ĐỘNG (DYNAMIC ROUTES)
// =========================================================================

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
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/category/:slug', getProductsByCategorySlug);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
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
 *         description: Danh sách sản phẩm
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo mới sản phẩm
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
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Lấy danh sách đánh giá của sản phẩm (bao gồm User Info từ Microservice)
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về summary và danh sách đánh giá
 */
router.get('/:id/reviews', getReviewsByProduct);

/**
 * @swagger
 * /api/products/{id}/related:
 *   get:
 *     summary: Lấy danh sách sản phẩm liên quan cùng danh mục
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm liên quan
 */
router.get('/:id/related', getRelatedProducts);

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
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', getProductById);

export default router;