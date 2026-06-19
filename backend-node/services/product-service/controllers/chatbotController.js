import pool from '../configs/database.js';
import axios from 'axios';

// Tập hợp các model chạy khỏe, ổn định nhất để hệ thống tự động xoay vòng phân tải
const AUTO_MODELS = [
    "DeepSeek-V4-Flash", 
    "glm-4.7", 
    "Qwen3.6-35B-A3B", 
    "step-3.5-flash"
];

export const getAIChatRecommendation = async (req, res) => {
    try {
        const { message } = req.body; // Loại bỏ hoàn toàn việc nhận biến "model" từ Frontend
        const countryCode = (req.query.country || 'VN').toUpperCase();

        if (!message || message.trim() === "") {
            return res.status(400).json({ success: false, message: "Tin nhắn không được để trống" });
        }

        // 1. Lấy danh sách 20 sản phẩm làm ngữ cảnh dữ liệu
        const query = `
            SELECT 
                sp.ma_san_pham AS id,
                sp.ten_san_pham AS name, 
                dm.ten_danh_muc AS category,
                dm.duong_dan_seo AS category_slug,
                LOWER($1) AS country_code,
                COALESCE(sp.mo_ta, 'Sản phẩm chất lượng từ Demi Mart.') AS description,
                COALESCE((SELECT MIN(gia_ban_le) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS price,
                (SELECT duong_dan_url FROM media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS image_url,
                COALESCE(
                    (SELECT SUM(tk.so_luong) 
                     FROM ton_kho_quoc_gia tk
                     JOIN bien_the_san_pham bt ON tk.ma_bien_the = bt.ma_bien_the
                     JOIN vung_mien vm ON tk.ma_vung = vm.ma_vung
                     WHERE bt.ma_san_pham = sp.ma_san_pham 
                       AND UPPER(vm.ma_quoc_gia) = UPPER($1)
                    ), 0
                ) AS stock
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.trang_thai = true
            LIMIT 20; 
        `;

        const { rows: productsData } = await pool.query(query, [countryCode]);

        if (productsData.length === 0) {
            return res.status(200).json({
                success: true,
                reply: "Hiện tại hệ thống cửa hàng Demi Mart đang cập nhật danh mục sản phẩm, bạn vui lòng quay lại sau nhé!",
                products: []
            });
        }

        // Tạo chuỗi ngữ cảnh sản phẩm phòng trường hợp nhảy vào mạch Direct API dự phòng
        const contextStr = productsData.map(p => 
            `[ID: ${p.id}] Tên: ${p.name}, Giá: ${p.price} VNĐ, Danh mục: ${p.category}, Tình trạng: ${p.stock > 0 ? 'Còn hàng' : 'Hết hàng'}`
        ).join('\n');

        const systemPrompt = `Bạn là chuyên gia ẩm thực kiêm trợ lý bán hàng AI của siêu thị Demi Mart.

QUY TẮC PHÂN CHIA NGỮ CẢNH PHẢN HỒI:
1. Trường hợp Khách hỏi mua sắm / tìm sản phẩm thông thường (Ví dụ: "có mì tôm không", "bên mình có nước ngọt không",...):
   - Bạn CHỈ trả lời ngắn gọn, lịch sự, xác nhận tình trạng hàng hóa hiện có trong kho.
   - KHÔNG viết hoa các đề mục lớn, KHÔNG tạo danh sách các bước nấu ăn.

2. Trường hợp Khách hỏi về công thức món ăn, cách chế biến, thành phần hoặc những gì bên trong món (Ví dụ: "cách làm bánh mì", "lẩu thái cần những gì", "muốn nấu mì ngon",...):
   - Bạn BẮT BUỘC triển khai câu trả lời theo đúng cấu trúc tiêu chuẩn để hiển thị lên Giao diện Modal:
     + Tiêu đề phân đoạn lớn bắt đầu bằng cụm từ chính xác: "Nguyên liệu có sẵn" hoặc "Cách làm" hoặc "Bước 1", "Bước 2"...
     + Liệt kê danh sách các bước thực hiện bằng định dạng số đầu dòng: 1., 2., 3.
     + Liệt kê thành phần phụ bằng dấu gạch đầu dòng (-) hoặc dấu (*).

QUY TẮC ĐÍNH KÈM THẺ SẢN PHẨM (ÁP DỤNG CHO CẢ 2 TRƯỜNG HỢP):
Ở cuối câu trả lời của bạn, phải đính kèm chính xác mã ID sản phẩm được nhắc đến để tư vấn theo định dạng: [RECOMMEND: id1, id2]. Nếu không có sản phẩm nào khớp, hãy ghi [RECOMMEND: NONE].

DANH SÁCH SẢN PHẨM TRONG KHO CỦA SHOP:
${contextStr}`;

        // Tráo ngẫu nhiên thứ tự mảng model để phân phối tải đều, tránh ép một model liên tục
        const shuffledModels = [...AUTO_MODELS].sort(() => 0.5 - Math.random());
        
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://ai-service-0zyu.onrender.com';
        let aiReply = "";
        let isSuccess = false;

        // =========================================================================
        // MẠCH 1: THỬ KẾT NỐI QUA TẦNG PYTHON AI MICROSERVICE (CÓ XOAY VÒNG MODEL)
        // =========================================================================
        for (const targetModel of shuffledModels) {
            try {
                const aiResponse = await axios.post(`${aiServiceUrl}/ai/recommend`, {
                    message: message,
                    products_data: productsData,
                    model: targetModel // Gửi model tự động xuống Python
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 12000 // Timeout tối ưu cho mỗi model ở tầng Python
                });

                if (aiResponse.data && aiResponse.data.reply) {
                    aiReply = aiResponse.data.reply;
                    isSuccess = true;
                    break; // Thành công thì ngắt vòng lặp ngay
                }
            } catch (pyError) {
                const errStatus = pyError.response ? pyError.response.status : "TIMEOUT/NETWORK";
                console.warn(`⚠️ Tầng Python với model [${targetModel}] báo lỗi [${errStatus}]. Đang thử model tiếp theo...`);
            }
        }

        // =========================================================================
        // MẠCH 2: DỰ PHÒNG THẲNG ĐẾN DIRECT API GATEWAY (KHI TẦNG PYTHON THẤT BẠI)
        // =========================================================================
        if (!isSuccess) {
            console.error("⚠️ Toàn bộ tầng Python gặp sự cố hoặc timeout. Kích hoạt Direct API Gateway xoay vòng...");
            
            const aiGatewayUrl = process.env.AI_GATEWAY_URL || 'https://api.iamhc.cn/v1/chat/completions';
            const aiGatewayKey = process.env.AI_GATEWAY_KEY;

            if (!aiGatewayKey) {
                console.error("❌ Thiếu cấu hình AI_GATEWAY_KEY trong file .env!");
                return res.status(500).json({ success: false, message: "Hệ thống trợ lý AI dự phòng chưa sẵn sàng cấu hình." });
            }

            // Tiếp tục xoay vòng danh sách mô hình trực tiếp qua API Gateway để cứu cánh
            for (const backupModel of shuffledModels) {
                try {
                    console.log(`🚀 Thử kết nối Direct API Gateway với model: ${backupModel}...`);
                    const deepSeekResponse = await axios.post(aiGatewayUrl, {
                        model: backupModel, 
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ],
                        temperature: 0.1
                    }, {
                        headers: {
                            'Authorization': `Bearer ${aiGatewayKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000 
                    });

                    if (deepSeekResponse.data && deepSeekResponse.data.choices) {
                        aiReply = deepSeekResponse.data.choices[0].message.content;
                        isSuccess = true;
                        break; // Thoát mạch dự phòng khi lấy được dữ liệu thành công
                    }
                } catch (gatewayError) {
                    const gateStatus = gatewayError.response ? gatewayError.response.status : "TIMEOUT";
                    console.error(`❌ Mạch Direct API với model [${backupModel}] thất bại [Mã lỗi: ${gateStatus}].`);
                }
            }
        }

        // 3. XỬ LÝ TRÍCH XUẤT AN TOÀN TRUYỀN THỐNG
        let finalProducts = [];
        if (isSuccess && aiReply && aiReply.trim() !== "") {
            try {
                const recommendRegex = /\[RECOMMEND:\s*([^\]]+)\]/;
                const match = aiReply.match(recommendRegex);

                if (match && match[1] && match[1].trim() !== 'NONE') {
                    const recommendedIds = match[1].split(',').map(id => id.trim().toLowerCase());
                    finalProducts = productsData.filter(p => p.id && recommendedIds.includes(String(p.id).toLowerCase()));
                    aiReply = aiReply.replace(recommendRegex, '').trim();
                } else {
                    finalProducts = productsData.filter(p => {
                        if (!p.name) return false;
                        const productNameLower = p.name.toLowerCase();
                        const strictKeywords = message.toLowerCase().split(' ').filter(w => 
                            w.length > 2 && !['mua', 'bên', 'mình', 'món', 'nào', 'giá', 'bao', 'nhiêu', 'không', 'bánh', 'kẹo', 'làm', 'cần', 'những', 'thì'].includes(w)
                        );
                        return strictKeywords.length > 0 && strictKeywords.every(keyword => productNameLower.includes(keyword));
                    });
                }
            } catch (extractError) {
                console.error("⚠️ Lỗi trích xuất thẻ sản phẩm:", extractError.message);
                finalProducts = [];
            }

            return res.status(200).json({
                success: true,
                reply: aiReply,
                products: finalProducts.slice(0, 3)
            });
        }

        // Trường hợp xấu nhất khi toàn bộ các model và endpoint đều dính rate limit cùng lúc
        return res.status(429).json({
            success: false,
            message: "Hệ thống trợ lý AI hiện đang bận do lượt truy cập quá tải. Bạn vui lòng thử lại sau vài giây nhé!"
        });

    } catch (error) {
        console.error("❌ Lỗi nghiêm trọng tại Gateway Controller:", error.message);
        return res.status(500).json({ success: false, message: "Hệ thống trợ lý AI liên thông trục trặc.", error: error.message });
    }
};