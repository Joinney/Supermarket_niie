import pool from '../configs/database.js';
import axios from 'axios';

const AUTO_MODELS = [
    "DeepSeek-V4-Flash", 
    "glm-4.7", 
    "Qwen3.6-35B-A3B", 
    "step-3.5-flash"
];

export const getAIChatRecommendation = async (req, res) => {
    const { message } = req.body;
    const messageStr = message || "";
    const countryCode = (req.query.country || 'VN').toUpperCase();

    if (!message || message.trim() === "") {
        return res.status(400).json({ success: false, message: "Tin nhắn không được để trống" });
    }

    let productsData = [];

    try {
        const query = `
            SELECT 
                sp.ma_san_pham AS id,
                sp.ten_san_pham AS name, 
                'Sản phẩm tuyển chọn' AS category,
                'tat-ca' AS category_slug,
                LOWER($1) AS country_code,
                COALESCE(sp.mo_ta, 'Sản phẩm chất lượng từ Demi Mart.') AS description,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS price,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS image_url,
                100 AS stock 
            FROM public.san_pham sp
            WHERE sp.trang_thai = true OR sp.trang_thai IS NULL
            LIMIT 20; 
        `;
        const { rows } = await pool.query(query, [countryCode]);
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
        const shuffledModels = [...AUTO_MODELS].sort(() => 0.5 - Math.random());
        
        // Tự động chuyển dịch mạng nội bộ Docker nếu cấu hình .env giữ nguyên localhost
        const aiServiceUrl = process.env.AI_SERVICE_URL === 'http://localhost:8000' 
            ? 'http://ai-service:8000' 
            : (process.env.AI_SERVICE_URL || 'http://ai-service:8000');

        let aiReply = "";
        let isSuccess = false;

        for (const targetModel of shuffledModels) {
            try {
                // TĂNG TIMEOUT LÊN 30000ms ĐỂ CHỜ LUỒNG CÀO DỮ LIỆU TỰ ĐỘNG THÀNH CÔNG TRÊN PYTHON
                const aiResponse = await axios.post(`${aiServiceUrl}/ai/recommend`, {
                    message: message,
                    products_data: productsData,
                    model: targetModel 
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

                if (aiResponse.data && aiResponse.data.reply) {
                    aiReply = aiResponse.data.reply;
                    isSuccess = true;
                    break; 
                }
            } catch (e) {
                console.warn(`⚠️ Model ${targetModel} tại Python không phản hồi hoặc timeout, đang đổi model...`);
            }
        }

        if (isSuccess && aiReply) {
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
                finalProducts = productsData.slice(0, 3);
            }

            aiReply = aiReply.replace(recommendRegex, '').trim();
            const cleanTitle = cleanRecipeTitle(messageStr);

            return res.status(200).json({ 
                success: true, 
                reply: aiReply, 
                recipeTitle: cleanTitle, 
                products: finalProducts.slice(0, 3) 
            });
        }

        throw new Error("Không thể kết nối dịch vụ Python AI Service.");

    } catch (error) {
        console.warn("🚨 KÍCH HOẠT MẠCH LOCAL FALLBACK ENGINE TẠI NODE.JS CONTROLLER (MẠNG AI CLOUD SẬP)");
        
        let finalProducts = [];
        let aiReply = "";

        const cleanMessage = messageStr.toLowerCase();
        const tokens = cleanMessage.split(' ').filter(w => 
            w.length > 1 && !['mua', 'bên', 'mình', 'món', 'nào', 'giá', 'bao', 'nhiêu', 'không', 'bánh', 'kẹo', 'làm', 'cần', 'những', 'thì', 'có', 'tìm', 'cho', 'alo', 'hello', 'hi', 'các', 'sản', 'phẩm'].includes(w)
        );

        finalProducts = productsData.filter(p => {
            if (!p.name) return false;
            const nameLower = p.name.toLowerCase();
            return tokens.length > 0 && tokens.some(t => nameLower.includes(t));
        });

        const isRecipeQuery = /(cách\s+làm|nấu|công\s+thức|chế\s+biến|hướng\s+dẫn|làm\s+món|nguyên\s+liệu)/i.test(messageStr);

        if (isRecipeQuery) {
            aiReply = `Cách làm:\n1. Sơ chế sạch nguyên liệu tươi sống.\n2. Thực hiện nấu chín và điều chỉnh gia vị vừa ăn phù hợp khẩu vị cá nhân.`;
            if (finalProducts.length === 0) finalProducts = productsData.slice(0, 3);
        } else {
            if (finalProducts.length > 0) {
                aiReply = `Chào bạn! Siêu thị Demi Mart hiện tại đang có sẵn các mặt hàng thuộc nhóm sản phẩm bạn tìm kiếm dưới đây ạ, bạn xem qua nhé:`;
            } else {
                aiReply = `Chào bạn! Mình là trợ lý ảo của Demi Mart. Hệ thống đang bảo trì kết nối thông minh trong giây lát. Dưới đây là một số sản phẩm nổi bật đang có sẵn tại cửa hàng, bạn tham khảo qua nhé!`;
                finalProducts = productsData.slice(0, 3); 
            }
        }

        const cleanTitleFallback = cleanRecipeTitle(messageStr);

        return res.status(200).json({
            success: true,
            reply: aiReply,
            recipeTitle: cleanTitleFallback, 
            products: finalProducts.slice(0, 3)
        });
    }
};