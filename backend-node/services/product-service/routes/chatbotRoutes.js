import express from 'express';
import { getAIChatRecommendation } from '../controllers/chatbotController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Chatbot AI
 * description: Hệ thống trợ lý ảo thông minh RAG, hỗ trợ tư vấn và gợi ý sản phẩm realtime cho Demi Mart
 */

/**
 * @swagger
 * /api/chatbot/chat-recommend:
 * post:
 * summary: Trợ lý AI tư vấn và gợi ý sản phẩm Realtime
 * description: API nhận tin nhắn từ người dùng, tự động nạp danh sách sản phẩm trong kho làm ngữ cảnh và trả về câu trả lời tư vấn từ mô hình DeepSeek.
 * tags:
 * - Chatbot AI
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

export default router;