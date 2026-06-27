import express from 'express';
import upload from '../configs/cloudinary/cloudinary.js'; 

import {
    getInternalVariants,
    getAllProducts,
    getProductById,
    getProductsByCategorySlug,
    searchProducts,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct,
    toggleProductStatus,
    deleteProduct,
    getReviewsByProduct,          
    getRelatedProducts,         
    getVariantById,
    getAllAvailableAttributes,  
    createVariant,
    updateVariant,              
    deleteVariant,    
    deleteAllVariants,  
    restoreVariant,             
    createAttribute,            
    uploadImage,
    uploadVariantImage,
    migrateLegacyAttributes,
    setMainProductImage,
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================
router.post('/internal/variants', getInternalVariants);

// =========================================================================
// 🏢 1. NHÓM ROUTE TĨNH (STATIC ROUTES)
// =========================================================================
router.get('/search', searchProducts);
router.get('/without-descriptions', getProductsWithoutDescriptions);
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);
router.put('/media/set-main', setMainProductImage);

// Giao thức EAV: Lấy danh mục thuộc tính tổng thể hệ thống cho Form ma trận
router.get('/attributes/matrix', getAllAvailableAttributes);
// Giao thức EAV: Thêm mới nhóm thuộc tính trực tiếp khi nhấn tạo nhóm
router.post('/attributes', createAttribute);

// Tiếp nhận file upload từ local máy tính và lưu trữ lên Cloudinary
router.post('/upload', upload.single('image'), uploadImage);


// =========================================================================
// 🔄 2. NHÓM ROUTE BIẾN THỂ (VARIANTS)
// =========================================================================
router.get('/variants/:variantId', getVariantById); 
router.put('/variants/:variantId', updateVariant); 
router.delete('/variants/:variantId', deleteVariant); 
router.delete('/:id/variants-all', deleteAllVariants); 
router.post('/variants/:variantId/upload-image', upload.single('image'), uploadVariantImage);
router.put('/variants/:variantId/restore', restoreVariant);

// =========================================================================
// 🔄 3. NHÓM ROUTE ĐỘNG SẢN PHẨM & DANH MỤC
// =========================================================================
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id/toggle-status', toggleProductStatus);
router.delete('/:id', deleteProduct);

// Xử lý lưu Transaction khởi tạo biến thể mới đấu nối ma trận EAV
router.post('/:id/variants', createVariant);

// Các thông tin liên quan cụ thể của một sản phẩm
router.get('/:id/reviews', getReviewsByProduct); 
router.get('/:id/related', getRelatedProducts); 

// ⚠️ CATCH-ALL: Lấy chi tiết sản phẩm
router.get('/:id', getProductById);

export default router;