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

// Lấy danh sách quốc gia động
router.get('/countries', getAllCountries);

// Tìm kiếm sản phẩm theo từ khóa
router.get('/search', searchProducts);

// Lấy cây danh mục (Cấu trúc Cha - Con) theo vùng miền
router.get('/categories', getAllCategories);

// Lấy danh sách sản phẩm thiếu hoặc chưa có mô tả
router.get('/without-descriptions', getProductsWithoutDescriptions);

// Tự động tạo mô tả hàng loạt bằng AI
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);

// Quét và làm mới các sản phẩm có mô tả trống bằng AI
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);


// =========================================================================
// 2. NHÓM ROUTE CHỨA PARAM ĐỘNG (DYNAMIC ROUTES) - ĐẶT Ở DƯỚI CÙNG
// =========================================================================

// Lấy danh sách sản phẩm dựa theo đường dẫn danh mục (Slug)
router.get('/category/:slug', getProductsByCategorySlug);

// Lấy tất cả sản phẩm hiển thị trên trang chủ
router.get('/', getAllProducts);

// Tạo mới một sản phẩm
router.post('/', createProduct);

// Lấy thông tin chi tiết kèm biến thể và media của một sản phẩm
router.get('/:id', getProductById);

export default router;