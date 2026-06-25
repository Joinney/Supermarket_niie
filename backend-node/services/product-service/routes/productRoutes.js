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
    getAllCountries,
    getVariantById,
    getAllAvailableAttributes, // 🌟 Đã thêm hàm import bốc ma trận EAV từ Controller
    createVariant             // 🌟 Đã thêm hàm import xử lý lưu Transaction EAV
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================
router.post('/internal/variants', getInternalVariants);

// =========================================================================
// 🏢 1. NHÓM ROUTE TĨNH (STATIC ROUTES)
// =========================================================================
router.get('/countries', getAllCountries);
router.get('/search', searchProducts);
router.get('/categories', getAllCategories);
router.get('/categories/search', searchCategories);
router.get('/without-descriptions', getProductsWithoutDescriptions);
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

// 🌟 THÊM ENDPOINT STATIC: Lấy ma trận thuộc tính động cho form tạo biến thể
// Lưu ý: Đặt phía trên nhóm route động chứa tham số :id chung để tránh bị Express map sai luồng
router.get('/attributes/matrix', getAllAvailableAttributes);

// =========================================================================
// 🔄 2. NHÓM ROUTE ĐỘNG (DYNAMIC ROUTES)
// =========================================================================
router.get('/variants/:variantId', getVariantById); 
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/', getAllProducts);
router.post('/', createProduct);

// 🌟 THÊM ENDPOINT DYNAMIC: Xử lý lưu Transaction biến thể mới kèm ma trận EAV
router.post('/:id/variants', createVariant);

router.get('/:id', getProductById);

export default router;