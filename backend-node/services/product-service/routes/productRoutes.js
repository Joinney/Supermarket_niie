import express from 'express';
import { 
    getAllProducts, 
    getProductById, 
    getProductsByCategorySlug, 
    searchProducts,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct,
    getAIChatRecommendation // <-- Hàm xử lý tư vấn sản phẩm từ AI
} from '../controllers/productController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Products
 * description: Quản lý danh sách, chi tiết sản phẩm và trợ lý ảo AI cho Demi Mart
 */

// =========================================================================
// 1. STATIC ROUTES - Đặt lên hàng đầu để tránh xung đột với route động /:id
// =========================================================================

/**
 * @swagger
 * /api/products/chat-recommend:
 * post:
 * summary: Trợ lý AI tư vấn và gợi ý sản phẩm Realtime
 * description: API nhận tin nhắn từ người dùng, tự động nạp danh sách sản phẩm trong kho làm ngữ cảnh và trả về câu trả lời tư vấn từ mô hình DeepSeek.
 * tags: [Products]
 * parameters:
 * - in: query
 * name: country
 * schema:
 * type: string
 * default: VN
 * description: Mã quốc gia để lọc tồn kho chính xác (ví dụ VN, US)
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - message
 * properties:
 * message:
 * type: string
 * description: Câu hỏi hoặc yêu cầu tìm kiếm của khách hàng
 * example: "Tôi muốn tìm món nào ăn liền vị tôm chua cay"
 * responses:
 * 200:
 * description: AI phân tích kho hàng và trả về lời tư vấn thành công
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * reply:
 * type: string
 * example: "Dựa vào kho hàng Demi Mart, bạn có thể chọn 'Mì ăn liền Hảo Hảo tôm chua cay' giá 4,500 VNĐ đang còn hàng nhé!"
 * 400:
 * description: Tin nhắn rỗng hoặc không hợp lệ
 * 500:
 * description: Lỗi hệ thống AI hoặc Database
 */
router.post('/chat-recommend', getAIChatRecommendation);

/**
 * @swagger
 * /api/products/search:
 * get:
 * summary: Tìm kiếm sản phẩm theo từ khóa
 * description: API tìm kiếm sản phẩm theo tên hoặc mô tả.
 * tags: [Products]
 * parameters:
 * - in: query
 * name: keyword
 * schema:
 * type: string
 * description: Từ khóa tìm kiếm
 * responses:
 * 200:
 * description: Trả về danh sách sản phẩm tìm được
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/products/batch-generate-descriptions:
 * post:
 * summary: Batch generate product descriptions via AI
 * description: Generate short descriptions for multiple products using OpenAI API and store in database
 * tags: [Products]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * productIds:
 * type: array
 * items:
 * type: string
 * example: ["prod-001", "prod-002", "prod-003"]
 * description: Array of product IDs (max 100 per request)
 * language:
 * type: string
 * enum: [vi, en, zh]
 * default: vi
 * description: Language for descriptions
 * responses:
 * 200:
 * description: Descriptions generated and stored successfully
 * 400:
 * description: Invalid input (missing or oversized productIds)
 * 500:
 * description: Server error during generation
 */
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);

/**
 * @swagger
 * /api/products/without-descriptions:
 * get:
 * summary: Get products without descriptions
 * description: Fetch products that need AI-generated descriptions for batch processing
 * tags: [Products]
 * parameters:
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 50
 * description: Number of results per page
 * - in: query
 * name: offset
 * schema:
 * type: integer
 * default: 0
 * description: Pagination offset
 * responses:
 * 200:
 * description: Trả về danh sách sản phẩm chưa có mô tả
 * 500:
 * description: Lỗi hệ thống
 */
router.get('/without-descriptions', getProductsWithoutDescriptions);

/**
 * @swagger
 * /api/products/refresh-empty-descriptions:
 * post:
 * summary: Refresh old products with empty descriptions using online research
 * description: Automatically generate descriptions for old products that are missing descriptions by researching online ads and product information.
 * tags: [Products]
 * requestBody:
 * required: false
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * limit:
 * type: integer
 * description: Maximum number of old products to refresh in one run
 * default: 50
 * useOnlineResearch:
 * type: boolean
 * description: Whether to search online ads and product listings before generating descriptions
 * default: true
 * responses:
 * 200:
 * description: Old product descriptions refreshed successfully
 * 500:
 * description: Server error during refresh
 */
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

/**
 * @swagger
 * /api/products/category/{slug}:
 * get:
 * summary: Lấy danh sách sản phẩm theo danh mục (slug)
 * description: API phục vụ cho trang CategoryPage để hiển thị lưới sản phẩm theo từng danh mục.
 * tags: [Products]
 * parameters:
 * - in: path
 * name: slug
 * required: true
 * schema:
 * type: string
 * description: Đường dẫn SEO (slug) của danh mục
 * responses:
 * 200:
 * description: Trả về danh sách sản phẩm thuộc danh mục
 * 500:
 * description: Lỗi hệ thống
 */
router.get('/category/:slug', getProductsByCategorySlug);

/**
 * @swagger
 * /api/products:
 * get:
 * summary: Lấy danh sách tất cả sản phẩm
 * description: API này dùng để lấy dữ liệu hiển thị cho trang Home.
 * tags: [Products]
 * responses:
 * 200:
 * description: Trả về mảng danh sách sản phẩm thành công
 * 500:
 * description: Lỗi hệ thống khi truy vấn database
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products:
 * post:
 * summary: Tạo sản phẩm mới (tự động tạo mô tả)
 * description: Tạo sản phẩm mới và tự động sinh mô tả ngắn từ AI
 * tags: [Products]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - ten_san_pham
 * - ma_danh_muc
 * properties:
 * ten_san_pham:
 * type: string
 * description: Tên sản phẩm
 * ma_danh_muc:
 * type: string
 * description: Mã danh mục
 * gia_ban_le:
 * type: number
 * description: Giá bán lẻ
 * mo_ta:
 * type: string
 * description: Mô tả chi tiết
 * ma_vung:
 * type: string
 * description: Mã vùng miền
 * responses:
 * 201:
 * description: Sản phẩm được tạo thành công, mô tả sẽ được sinh tự động
 * content:
 * application/json:
 * schema:
 * type: object
 * 400:
 * description: Dữ liệu không hợp lệ
 * 500:
 * description: Lỗi hệ thống
 */
router.post('/', createProduct);

// =========================================================================
// 2. DYNAMIC ROUTES - Đặt xuống dưới cùng để không bắt nhầm chuỗi của route khác
// =========================================================================

/**
 * @swagger
 * /api/products/{id}:
 * get:
 * summary: Lấy chi tiết một sản phẩm theo ID
 * description: API phục vụ cho trang ProductDetail để hiển thị thông tin cụ thể.
 * tags: [Products]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: ID của sản phẩm cần lấy
 * responses:
 * 200:
 * description: Trả về thông tin chi tiết của sản phẩm
 * 404:
 * description: Không tìm thấy sản phẩm với ID cung cấp
 */
router.get('/:id', getProductById);

export default router;