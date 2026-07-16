import pool from '../configs/database.js';

// =========================================================================
// 1. LẤY DANH SÁCH ĐÁNH GIÁ SẢN PHẨM (CHUYỂN TỪ PRODUCT CONTROLLER SANG)
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

        // Xử lý thông tin user (Nên gọi sang Auth-Service nếu hệ thống lớn)
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
// 2. TẠO ĐÁNH GIÁ MỚI (KIỂM TRA CHẶT CHẼ LOGIC MA_DON_HANG)
// =========================================================================
export const createReview = async (req, res) => {
    const userId = req.body.user_id || 1;
    
    const { ma_san_pham, ma_bien_the, ma_don_hang, so_sao, noi_dung, media_urls } = req.body;

    if (!ma_san_pham || !ma_don_hang || !so_sao) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin đánh giá bắt buộc (Mã sản phẩm, mã đơn hàng, số sao)." });
    }

    if (so_sao < 1 || so_sao > 5) {
        return res.status(400).json({ success: false, message: "Số sao phải từ 1 đến 5." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // KIỂM TRA 1: Khách hàng đã đánh giá sản phẩm này trong đơn hàng này chưa?
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

        // LƯU ĐÁNH GIÁ
        const insertReviewQuery = `
            INSERT INTO public.danh_gia_san_pham 
            (ma_san_pham, ma_bien_the, ma_don_hang, user_id, so_sao, noi_dung, country_code, trang_thai, ngay_tao, ngay_cap_nhat) 
            VALUES ($1, $2, $3, $4, $5, $6, 'vn', true, NOW(), NOW())
            RETURNING ma_danh_gia;
        `;
        const { rows: newReview } = await client.query(insertReviewQuery, [
            ma_san_pham, ma_bien_the || null, ma_don_hang, userId, so_sao, noi_dung || null
        ]);

        const maDanhGia = newReview[0].ma_danh_gia;

        // LƯU MEDIA (ẢNH/VIDEO) NẾU CÓ
        if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
            const insertMediaQuery = `
                INSERT INTO public.media_danh_gia 
                (ma_danh_gia, duong_dan_url, loai_media, trang_thai, ngay_tao) 
                VALUES ($1, $2, 'image', true, NOW())
            `;
            // Dùng vòng lặp lưu từng ảnh
            for (const url of media_urls) {
                if (url.trim() !== "") {
                    await client.query(insertMediaQuery, [maDanhGia, url]);
                }
            }
        }

        await client.query('COMMIT');
        
        res.status(201).json({ 
            success: true, 
            message: "Cảm ơn bạn đã gửi đánh giá!" 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Lỗi API createReview:", error.message);
        res.status(500).json({ success: false, message: "Hệ thống gặp sự cố khi lưu đánh giá." });
    } finally {
        client.release();
    }
};