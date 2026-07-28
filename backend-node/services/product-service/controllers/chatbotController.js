import pool from '../configs/database.js';
import axios from 'axios';

const AUTO_MODELS = [
    "DeepSeek-V4-Flash", 
    "DeepSeek-V4-Pro", 
    "glm-5.1", 
    "glm-5.2",
    "kat-coder-pro-v2.5", 
    "Kimi-K2.6", 
    "MiniMax-M3", 
    "Qwen3.5-397B-A17B",
    "Qwen3.6-35B-A3B", 
    "sensenova-6.7-flash-lite", 
    "sensenova-u1-fast",
    "step-3.5-flash", 
    "step-3.5-flash-2603", 
    "step-3.7-flash", 
    "step-router-v1"
];

export const getAIChatRecommendation = async (req, res) => {
    // 🌟 Lấy thêm 'model' từ Frontend gửi lên
    const { message, model } = req.body;
    const messageStr = message || "";
    const countryCode = (req.query.country || 'VN').toUpperCase();

    if (!message || message.trim() === "") {
        return res.status(400).json({ success: false, message: "Tin nhắn không được để trống" });
    }

    let productsData = [];

    try {
        // 1. Tạo bộ từ khóa rác tiếng Việt cần loại bỏ
const stopWords = new Set(["tôi", "muốn", "mua", "có", "không", "hay", "cho", "vài", "món", "cần", "những", "gì", "bạn", "ơi", "tìm", "giúp", "làm", "cách", "nấu", "hướng", "dẫn"]);

// 2. Lọc từ khóa sạch
const rawKeywords = messageStr.toLowerCase().split(/\s+/).filter(w => w.length > 2);
const keywords = rawKeywords.filter(w => !stopWords.has(w));

let searchCondition = "";
let queryParams = [countryCode];

// 3. Xây dựng câu query động
if (keywords.length > 0) {
    const conditions = keywords.map((kw, index) => {
        queryParams.push(`%${kw}%`);
        return `(sp.ten_san_pham ILIKE $${index + 2} OR sp.mo_ta ILIKE $${index + 2})`;
    });
    // CHÚ Ý: Đổi 'OR' thành 'AND' nếu muốn kết quả siêu chuẩn xác (chỉ hiện khi thoả mãn mọi từ khoá)
    // Nhưng để tránh tịt ngòi, tạm thời dùng OR kết hợp giới hạn LIMIT 50
    searchCondition = `AND (${conditions.join(' OR ')})`;
}

        // Thay thế đoạn query cũ bằng đoạn này
const query = `
    SELECT 
        sp.ma_san_pham AS id,
        sp.ten_san_pham AS name, 
        'Sản phẩm tuyển chọn' AS category,
        'tat-ca' AS category_slug,
        LOWER($1) AS country_code,  /* 🌟 SỬA Ở ĐÂY: Trả lại $1 để khớp với queryParams */
        COALESCE(sp.mo_ta, 'Sản phẩm chất lượng từ Demi Mart.') AS description,
        (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS image_url,
        100 AS stock,
        v.variant_id,
        v.price,
        v.variant_name,
        v.attributes
    FROM public.san_pham sp
    -- Dùng LEFT JOIN LATERAL để lấy biến thể rẻ nhất và gom thuộc tính của biến thể đó
    LEFT JOIN LATERAL (
        SELECT 
            bt.ma_bien_the AS variant_id,
            bt.gia_ban_le AS price,
            bt.ten_bien_the AS variant_name,
            -- Gom các thuộc tính từ 3 bảng liên kết thành một mảng JSON
            COALESCE(
                (
                    SELECT json_agg(json_build_object('ten_thuoc_tinh', dt.ten_thuoc_tinh, 'gia_tri', gt.gia_tri))
                    FROM public.chi_tiet_bien_the_thuoc_tinh ct
                    JOIN public.gia_tri_thuoc_tinh gt ON ct.ma_gia_tri = gt.ma_gia_tri
                    JOIN public.danh_muc_thuoc_tinh dt ON gt.ma_thuoc_tinh = dt.ma_thuoc_tinh
                    WHERE ct.ma_bien_the = bt.ma_bien_the
                ), 
                '[]'::json
            ) AS attributes
        FROM public.bien_the_san_pham bt
        WHERE bt.ma_san_pham = sp.ma_san_pham
          AND (bt.trang_thai = true OR bt.trang_thai IS NULL)
          AND (bt.da_xoa = false OR bt.da_xoa IS NULL)
        ORDER BY bt.gia_ban_le ASC
        LIMIT 1
    ) v ON true
    WHERE (sp.trang_thai = true OR sp.trang_thai IS NULL) 
      AND (sp.da_xoa = false OR sp.da_xoa IS NULL)
    ${searchCondition}
    LIMIT 50;
`;
        
        const { rows } = await pool.query(query, queryParams);
        productsData = rows;
    } catch (dbError) {
        console.error("❌ Lỗi truy vấn Database lấy ngữ cảnh sản phẩm:", dbError.message);
    }

    if (!productsData || productsData.length === 0) {
        return res.status(200).json({
            success: true,
            reply: "Hiện tại hệ thống cửa hàng Demi Mart đang cập nhật danh mục sản phẩm, bạn vui lòng quay lại sau nhé!",
            products: []
        });
    }

    // Cơ chế Regex nâng cao làm sạch toàn bộ từ mồi lặp ở đầu chuỗi (Cách làm, cách nấu, cách,...)
    const cleanRecipeTitle = (rawText) => {
        return rawText
            .replace(/[\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^(cách\s+|làm\s+|nấu\s+|combo\s+nguyên\s+liệu:\s*)+/gi, '')
            .replace(/(cần|những|gì|vậy|shop)/gi, '')
            .replace(/\?/g, '')
            .trim();
    };

    try {
        // 🌟 LOGIC CHỌN MODEL THÔNG MINH
        // 1. Ưu tiên model do người dùng chọn (hoặc mặc định lấy cái đầu tiên trong list)
        const targetModel = model || AUTO_MODELS[0];
        // 2. Lọc bỏ model đã chọn ra khỏi danh sách dự phòng để không gọi lại 2 lần
        const fallbackModels = AUTO_MODELS.filter(m => m !== targetModel);
        // 3. Gộp lại thành mảng hoàn chỉnh: [Model_Ưu_Tiên, ...Các_Model_Dự_Phòng]
        const modelsToTry = [targetModel, ...fallbackModels].slice(0, 2);
        
        // Tự động chuyển dịch mạng nội bộ Docker nếu cấu hình .env giữ nguyên localhost
        const aiServiceUrl = process.env.AI_SERVICE_URL === 'http://localhost:8000' 
            ? 'http://ai-service:8000' 
            : (process.env.AI_SERVICE_URL || 'http://ai-service:8000');

        let aiReply = "";
        let isSuccess = false;
        let successfulModel = null;

        for (const currentModel of modelsToTry) {
            try {
                console.log(`🤖 Đang thử kết nối AI với model: ${currentModel}...`);
                
                // 🌟 TĂNG TIMEOUT LÊN 120000ms ĐỂ CHỜ LUỒNG CÀO DỮ LIỆU TỰ ĐỘNG THÀNH CÔNG TRÊN PYTHON
                const aiResponse = await axios.post(`${aiServiceUrl}/ai/recommend`, {
                    message: message,
                    products_data: productsData,
                    model: currentModel // Ép Python chạy model này
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });

                if (aiResponse.data && aiResponse.data.reply) {
                    aiReply = aiResponse.data.reply;
                    isSuccess = true;
                    successfulModel = currentModel;
                    break; 
                }
            } catch (e) {
                console.warn(`⚠️ Model ${currentModel} tại Python thất bại (Lỗi: ${e.message}). Tự động nhảy sang model dự phòng tiếp theo...`);
            }
        }

        if (isSuccess && aiReply) {
            console.log(`✅ AI phản hồi thành công bằng model: ${successfulModel}`);
            
            let finalProducts = [];
            const recommendRegex = /\[RECOMMEND:\s*([^\]]+)\]/;
            const match = aiReply.match(recommendRegex);

            if (match && match[1] && match[1].trim() !== 'NONE') {
                const recommendedIds = match[1].split(',').map(id => id.trim().toLowerCase());
                finalProducts = productsData.filter(p => p.id && recommendedIds.includes(String(p.id).toLowerCase()));
            } else {
                finalProducts = productsData.filter(p => {
                    if (!p.name) return false;
                    const productNameLower = p.name.toLowerCase();
                    const strictKeywords = message.toLowerCase().split(' ').filter(w => w.length > 2);
                    return strictKeywords.length > 0 && strictKeywords.every(keyword => productNameLower.includes(keyword));
                });
            }

            if (!finalProducts || finalProducts.length === 0) {
                // Kiểm tra xem đây có phải là câu hỏi nấu ăn không
                const isRecipeSearch = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)/i.test(messageStr);
                
                if (isRecipeSearch) {
                    // Nếu là hỏi công thức mà không có nguyên liệu chuẩn -> Để rỗng! (Tuyệt đối không lấy bừa)
                    finalProducts = []; 
                } else {
                    // Nếu là câu hỏi bình thường -> Có thể bốc 3 sản phẩm gợi ý
                    finalProducts = productsData.slice(0, 3);
                }
            }

            aiReply = aiReply.replace(recommendRegex, '').trim();
            const cleanTitle = cleanRecipeTitle(messageStr);

            return res.status(200).json({ 
                success: true, 
                reply: aiReply, 
                recipeTitle: cleanTitle, 
                usedModel: successfulModel, // Trả về cho Frontend biết đã dùng con AI nào
                products: finalProducts.slice(0, 3) 
            });
        }

        throw new Error("Tất cả các Model đều thất bại hoặc không thể kết nối dịch vụ Python AI Service.");

    } catch (error) {
        console.error("🔥 LỖI BACKEND CHATBOT:", error.message || error);

        console.warn("🚨 KÍCH HOẠT MẠCH LOCAL FALLBACK: GỌI LẤY RAW DATA TỪ PYTHON VÌ TOÀN BỘ AI SẬP");
        let aiReply = "";
        let finalProducts = [];
        const cleanMessage = messageStr.toLowerCase();
        
        try {
            // Gọi sang Python lấy công thức thô trực tiếp từ file JSON Cookpad (Không cần AI suy nghĩ)
            const aiServiceUrl = process.env.AI_SERVICE_URL === 'http://localhost:8000' 
                ? 'http://ai-service:8000' 
                : (process.env.AI_SERVICE_URL || 'http://ai-service:8000');
                
            const fallbackRes = await axios.post(`${aiServiceUrl}/ai/fallback`, {
                message: message,
                products_data: productsData
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
            
            aiReply = fallbackRes.data.reply;
            
            // Bóc tách ID Sản phẩm như bình thường
            const recommendRegex = /\[RECOMMEND:\s*([^\]]+)\]/;
            const match = aiReply.match(recommendRegex);

            if (match && match[1] && match[1].trim() !== 'NONE') {
                const recommendedIds = match[1].split(',').map(id => id.trim().toLowerCase());
                finalProducts = productsData.filter(p => p.id && recommendedIds.includes(String(p.id).toLowerCase()));
            } else {
                // 🌟 SỬA Ở ĐÂY: Kiểm tra nếu là câu hỏi công thức thì để rỗng, ngược lại bốc 3 món gợi ý
                const isRecipeSearch = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)/i.test(messageStr);
                finalProducts = isRecipeSearch ? [] : productsData.slice(0, 3);
            }
            aiReply = aiReply.replace(recommendRegex, '').trim();
            
        } catch (fallbackErr) {
            // Chốt chặn cuối cùng nếu Python tắt thở hoàn toàn
            const isRecipeQuery = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)/i.test(messageStr);
            if (isRecipeQuery) {
                aiReply = `Nguyên liệu có sẵn:\n- Các gói nguyên liệu đi kèm hiện có sẵn tại siêu thị.\n\nCách làm:\n1. Sơ chế sạch nguyên liệu tươi sống.\n2. Thực hiện nấu chín và điều chỉnh gia vị vừa ăn phù hợp khẩu vị cá nhân.`;
                // 🌟 SỬA Ở ĐÂY: Công thức thì KHÔNG bốc bừa sản phẩm
                finalProducts = []; 
            } else {
                aiReply = `Chào bạn! Mình là trợ lý ảo của Demi Mart. Hệ thống đang bảo trì kết nối thông minh, bạn tham khảo các mặt hàng này nhé!`;
                // 🌟 SỬA Ở ĐÂY: Câu hỏi thường thì có thể gợi ý 3 sản phẩm
                finalProducts = productsData.slice(0, 3); 
            }
        }
        
        return res.status(200).json({
            success: true,
            reply: aiReply,
            recipeTitle: cleanRecipeTitle(messageStr), 
            products: finalProducts.slice(0, 3)
        });
    }
};