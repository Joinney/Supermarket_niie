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
    getReviewsByProduct,        // 🌟 Bổ sung: Lấy đánh giá sản phẩm
    getRelatedProducts,        // 🌟 Bổ sung: Lấy sản phẩm liên quan
    getVariantById,
    getAllAvailableAttributes,  // Lấy ma trận thuộc tính khả dụng
    createVariant,
    updateVariant,              // 🌟 ĐỒNG BỘ: Đã import hàm cập nhật biến thể EAV
    deleteVariant,             // 🌟 Bổ sung: Xóa mềm biến thể EAV
    createAttribute,            // 🌟 Bổ sung: Tạo nhóm thuộc tính mới trực tiếp
    uploadImage                 // 🌟 Bổ sung: Upload ảnh Cloudinary
} from '../controllers/productController.js';
import upload from '../configs/cloudinary/cloudinary.js'; // 🌟 Import Multer Storage mà Demi vừa cung cấp

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================
router.post('/internal/variants', getInternalVariants);

// =========================================================================
// 🏢 1. NHÓM ROUTE TĨNH (STATIC ROUTES) - Đặt lên hàng đầu tránh xung đột params
// =========================================================================
router.get('/countries', getAllCountries);
router.get('/search', searchProducts);
router.get('/categories', getAllCategories);
router.get('/categories/search', searchCategories);
router.get('/without-descriptions', getProductsWithoutDescriptions);
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

// Giao thức EAV: Lấy danh mục thuộc tính tổng thể hệ thống cho Form ma trận
router.get('/attributes/matrix', getAllAvailableAttributes);

// Giao thức EAV: Thêm mới nhóm thuộc tính trực tiếp khi nhấn tạo nhóm
router.post('/attributes', createAttribute);

// 🌟 ROUTE MỚI: Tiếp nhận file upload từ local máy tính và lưu trữ lên Cloudinary thông qua storage
router.post('/upload', upload.single('image'), uploadImage);

// =========================================================================
// 🔄 2. NHÓM ROUTE BIẾN THỂ (VARIANTS) - Đặt trước /:id để tránh trùng khớp "id = variants"
// =========================================================================
router.get('/variants/:variantId', getVariantById); 
router.put('/variants/:variantId', updateVariant);    // 🌟 ĐỒNG BỘ: Route PUT cập nhật thông tin và ma trận EAV của biến thể
router.delete('/variants/:variantId', deleteVariant); // Route xử lý Xóa mềm

// =========================================================================
// 🔄 3. NHÓM ROUTE ĐỘNG SẢN PHẨM & DANH MỤC (DYNAMIC ROUTES)
// =========================================================================
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/', getAllProducts);
router.post('/', createProduct);

// Xử lý lưu Transaction khởi tạo biến thể mới đấu nối ma trận EAV
router.post('/:id/variants', createVariant);

// Các thông tin liên quan cụ thể của một sản phẩm
router.get('/:id/reviews', getReviewsByProduct);      // Route lấy đánh giá sản phẩm
router.get('/:id/related', getRelatedProducts);      // Route lấy sản phẩm liên quan
router.get('/:id', getProductById);

export default router;