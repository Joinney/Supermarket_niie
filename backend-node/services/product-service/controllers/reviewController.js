import pool from '../configs/database.js';

// =========================================================================
// 1. LẤY DANH SÁCH ĐÁNH GIÁ SẢN PHẨM 
// =========================================================================
export const getReviewsByProduct = async (req, res) => {
    const { id } = req.params; // ma_san_pham
    try {
        const query = `
            SELECT 
                dg.ma_danh_gia, dg.user_id, dg.so_sao, dg.noi_dung, dg.ngay_tao,
                dg.phan_hoi_nguoi_ban, dg.ngay_phan_hoi, dg.luot_huu_ich,
                bt.ten_bien_the,
                COALESCE(
                    (SELECT json_agg(json_build_object('url', md.duong_dan_url, 'type', md.loai_media, 'duration', md.thoi_luong_video))
                     FROM public.media_danh_gia md WHERE md.ma_danh_gia = dg.ma_danh_gia),
                    '[]'
                ) as media
            FROM public.danh_gia_san_pham dg
            LEFT JOIN public.bien_the_san_pham bt ON dg.ma_bien_the = bt.ma_bien_the
            WHERE dg.ma_san_pham = $1 AND dg.trang_thai = true
            ORDER BY dg.ngay_tao DESC;
        `;
        const { rows: reviews } = await pool.query(query, [id]);

        if (reviews.length === 0) {
            return res.status(200).json({ summary: { avgRating: 0, total: 0 }, reviews: [] });
        }

        const totalReviews = reviews.length;
        const avgRating = (reviews.reduce((sum, r) => sum + r.so_sao, 0) / totalReviews).toFixed(1);
        const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, hasMedia: 0, hasComment: 0 };
        
        reviews.forEach(r => {
            if (starCounts[r.so_sao] !== undefined) starCounts[r.so_sao]++;
            if (r.media.length > 0) starCounts.hasMedia++;
            if (r.noi_dung && r.noi_dung.trim() !== '') starCounts.hasComment++;
        });

        const userIds = [...new Set(reviews.map(r => r.user_id))];
        const userInfoMap = {};
        userIds.forEach(uid => {
            userInfoMap[uid] = {
                username: uid === 1 ? 'tukhanjluu' : `khachhang_${uid}`,
                avatar_url: `https://ui-avatars.com/api/?name=User${uid}&background=f1f5f9&color=94a3b8`
            };
        });

        const finalReviews = reviews.map(r => ({
            ...r,
            user: userInfoMap[r.user_id] || { username: 'Người dùng ẩn danh', avatar_url: null }
        }));

        res.status(200).json({
            summary: { avgRating, total: totalReviews, ...starCounts },
            reviews: finalReviews
        });
    } catch (error) {
        console.error("❌ Lỗi API getReviewsByProduct:", error.message);
        res.status(500).json({ error: "Lỗi lấy dữ liệu đánh giá." });
    }
};

// =========================================================================
// 2. TẠO ĐÁNH GIÁ MỚI (HỖ TRỢ FORM-DATA MULTIPART CHUẨN DOCKER & CLOUDINARY)
// =========================================================================
export const createReview = async (req, res) => {
    try {
        // Ưu tiên lấy ID từ Middleware xác thực (nếu có), nếu không lấy từ body hoặc mặc định bằng 1
        const userId = req.user?.id || req.body.user_id || 1; 
        
        const { ma_san_pham, ma_bien_the, ma_don_hang, so_sao, noi_dung } = req.body;

        if (!ma_san_pham || !ma_don_hang || !so_sao) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu thông tin đánh giá bắt buộc (Mã sản phẩm, mã đơn hàng, số sao)." 
            });
        }

        if (so_sao < 1 || so_sao > 5) {
            return res.status(400).json({ success: false, message: "Số sao phải từ 1 đến 5." });
        }

        // Xử lý loại bỏ các chuỗi nhiễu của FormData để cột mã biến thể không bị dính giá trị rác
        const validMaBienThe = (ma_bien_the && ma_bien_the !== 'undefined' && ma_bien_the !== 'null' && ma_bien_the.trim() !== '') ? ma_bien_the : null;
        
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // KIỂM TRA: Người dùng đã thực hiện đánh giá sản phẩm này trong đơn hàng này chưa?
            const checkQuery = `
                SELECT ma_danh_gia 
                FROM public.danh_gia_san_pham 
                WHERE user_id = $1 AND ma_don_hang = $2 AND ma_san_pham = $3
            `;
            const { rows: existingReview } = await client.query(checkQuery, [userId, ma_don_hang, ma_san_pham]);

            if (existingReview.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ success: false, message: "Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi!" });
            }

            // BƯỚC A: Thêm dòng đánh giá chữ vào bảng danh_gia_san_pham
            const insertReviewQuery = `
                INSERT INTO public.danh_gia_san_pham 
                (ma_san_pham, ma_bien_the, ma_don_hang, user_id, so_sao, noi_dung, country_code, trang_thai, ngay_tao, ngay_cap_nhat) 
                VALUES ($1, $2, $3, $4, $5, $6, 'vn', true, NOW(), NOW())
                RETURNING ma_danh_gia;
            `;
            const { rows: newReview } = await client.query(insertReviewQuery, [
                ma_san_pham, 
                validMaBienThe,
                ma_don_hang, 
                userId, 
                so_sao, 
                noi_dung || null
            ]);

            const maDanhGia = newReview[0].ma_danh_gia;

            // BƯỚC B: Trích xuất mảng tệp tin đa phương tiện được đính kèm từ req.files (đã tải lên Cloudinary qua Middleware)
            const files = req.files || [];

            if (files.length > 0) {
                const insertMediaQuery = `
                    INSERT INTO public.media_danh_gia 
                    (ma_danh_gia, duong_dan_url, loai_media, trang_thai, ngay_tao) 
                    VALUES ($1, $2, $3, true, NOW())
                `;
                
                for (const file of files) {
                    // Nhận diện định dạng tệp tin dựa trên trường MimeType (image/jpeg, image/png hoặc video/mp4)
                    const loaiMedia = file.mimetype && file.mimetype.includes('video') ? 'video' : 'image';
                    const cloudUrl = file.path; // URL tuyệt đối do Cloudinary trả về từ tầng Middleware cấu hình

                    await client.query(insertMediaQuery, [maDanhGia, cloudUrl, loaiMedia]);
                }
            }

            await client.query('COMMIT');
            
            try {
                // Logic: Đánh giá chữ = 200 Xu, có kèm Ảnh/Video = 500 Xu
                const bonusPoints = files.length > 0 ? 500 : 200;
                const promotionUrl = process.env.PROMOTION_SERVICE_URL || 'http://promotion-service:5003';
                const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8085';

                // 1. Gọi API cộng xu
                await axios.post(`${promotionUrl}/api/v1/loyalty/earn`, {
                    customerId: Number(userId),
                    points: bonusPoints,
                    source: 'REVIEW',
                    referenceId: String(maDanhGia),
                    description: files.length > 0 ? 'Đánh giá sản phẩm có tâm (kèm media)' : 'Đánh giá sản phẩm'
                });

                // 2. Bắn thông báo cho user
                await axios.post(`${notificationUrl}/api/v1/notifications/send`, {
                    userId: String(userId),
                    channel: "websocket",
                    title: "🎁 Nhận thưởng đánh giá",
                    description: `Cảm ơn bạn đã đánh giá! Bạn vừa nhận được ${bonusPoints} Xu vào ví Demi Pay.`,
                    type: "system"
                });
            } catch (pointError) {
                // Bọc try catch riêng biệt để lỡ Service Khuyến mãi sập, người dùng vẫn đăng bài đánh giá thành công!
                console.warn("⚠️ Không thể cộng xu lúc này (Promotion Service lỗi):", pointError.message);
            }

            res.status(201).json({ 
                success: true, 
                message: "Cảm ơn bạn đã gửi đánh giá và nhận xu thưởng thành công!" 
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error; 
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("❌ Lỗi API createReview:", error.message);
        res.status(500).json({ success: false, message: "Hệ thống gặp sự cố khi lưu đánh giá." });
    }
};


// =========================================================================
// 3. Kiểm tra đánh giá
// =========================================================================
export const checkReviewStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id || 1; // Ưu tiên ID từ token

        const query = `
            SELECT ma_danh_gia 
            FROM public.danh_gia_san_pham 
            WHERE ma_don_hang = $1 AND user_id = $2
            LIMIT 1;
        `;
        const { rows } = await pool.query(query, [String(orderId), userId]);

        // Trả về true nếu đã đánh giá, false nếu chưa
        res.status(200).json({ success: true, hasReviewed: rows.length > 0 });
    } catch (error) {
        console.error("Lỗi API checkReviewStatus:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};