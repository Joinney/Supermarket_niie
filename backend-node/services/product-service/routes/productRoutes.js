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
    updateProduct,         
    getVariantById,
    getAllAvailableAttributes,  
    createVariant,
    createSimpleVariant,
    updateVariant,              
    deleteVariant,    
    deleteAllVariants,  
    hardDeleteVariant,
    restoreVariant,             
    createAttribute,            
    uploadImage,
    uploadVariantImage,
    migrateLegacyAttributes,
    setMainProductImage,
    addProductMedia,
    updateInternalStock,
    deductStockInternal,
    generateSafeSku,
    restoreStockInternal
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================
router.post('/internal/variants', getInternalVariants);

// 🌟 ĐÃ CẬP NHẬT: Tiếp nhận tín hiệu đồng bộ lượng 'TỒN KHO ĐỔI RA' từ Warehouse-Service gửi sang
// Đường dẫn này khớp chuẩn với cấu trúc định tuyến tổng thể của Demi Mart
router.patch('/internal/update-stock', updateInternalStock);

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
router.post('/variants/simple', createSimpleVariant);
router.post('/:id/variants', createVariant);
router.delete('/variants/:variantId/hard', hardDeleteVariant);

// =========================================================================
// 🔄 3. NHÓM ROUTE ĐỘNG SẢN PHẨM & DANH MỤC
// =========================================================================
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.put('/:id/toggle-status', toggleProductStatus);
router.delete('/:id', deleteProduct);

// Các thông tin liên quan cụ thể của một sản phẩm
router.get('/:id/reviews', getReviewsByProduct); 
router.get('/:id/related', getRelatedProducts); 

//xử lý mã thông minh
router.post('/generate-sku', generateSafeSku);

// Lấy chi tiết sản phẩm
router.get('/:id', getProductById);
router.post('/:id/media', addProductMedia);

// xử lý tồn kho nội bộ (internal stock) cho từng biến thể sản phẩm
router.post('/internal/deduct-stock', deductStockInternal);
router.post('/internal/restore-stock', restoreStockInternal);

export default router;