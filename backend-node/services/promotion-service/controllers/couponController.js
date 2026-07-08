import pool from '../configs/database.js';
import axios from 'axios';

// 🌐 Địa chỉ kết nối sang Order Service (Cổng 5005)
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5005';

// ========================================================
// 1. TẠO MÃ KHUYẾN MÃI (Đã thêm Giới hạn người dùng)
// ========================================================
export const createCoupon = async (req, res) => {
    try {
        const { 
            code, description, discount_amount, 
            min_order_value, min_lifetime_spent, usage_limit, user_usage_limit, start_date, end_date 
        } = req.body;

        const query = `
            INSERT INTO public.coupons (
                code, description, discount_type, discount_value, max_discount_amount, 
                min_order_value, min_lifetime_spent, usage_limit, user_usage_limit, start_date, end_date
            ) VALUES ($1, $2, 'fixed_amount', $3, NULL, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [
            String(code).toUpperCase(), description, discount_amount, 
            min_order_value || 0, min_lifetime_spent || 0, 
            usage_limit, user_usage_limit || 1, start_date, end_date
        ];

        const { rows } = await pool.query(query, values);
        res.status(201).json({ success: true, message: "Tạo mã khuyến mãi thành công!", data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi tạo Coupon:", error.message);
        if (error.code === '23505') { 
            return res.status(400).json({ success: false, message: "Mã code này đã tồn tại trong hệ thống!" });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tạo mã giảm giá." });
    }
};

// ========================================================
// 2. LẤY DANH SÁCH MÃ
// ========================================================
export const getAllCoupons = async (req, res) => {
    try {
        const query = `SELECT * FROM public.coupons ORDER BY created_at DESC;`;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách Coupon:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải danh sách mã." });
    }
};

// ========================================================
// 3. KIỂM TRA MÃ TRƯỚC KHI ĐẶT HÀNG
// ========================================================
export const validateCoupon = async (req, res) => {
    console.log("DEBUG BODY:", req.body);
    console.log("DEBUG USER:", req.user);
    const { code, order_amount } = req.body;
    const userId = req.user?.id; 
    const amount = Number(order_amount);

    if (!code || isNaN(amount) || !userId) {
        return res.status(400).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ!" });
    }

    try {
        // 3.1. Tìm mã Coupon
        const couponRes = await pool.query(`SELECT * FROM public.coupons WHERE code = $1`, [String(code).toUpperCase()]);
        if (couponRes.rows.length === 0) return res.status(404).json({ success: false, message: "Mã khuyến mãi không tồn tại!" });
        const coupon = couponRes.rows[0];

        // 3.2. Kiểm tra điều kiện chung
        const now = new Date();
        if (!coupon.is_active) return res.status(400).json({ success: false, message: "Mã khuyến mãi đã bị vô hiệu hóa!" });
        if (now < new Date(coupon.start_date)) return res.status(400).json({ success: false, message: "Chưa tới thời gian sử dụng mã này!" });
        if (now > new Date(coupon.end_date)) return res.status(400).json({ success: false, message: "Mã khuyến mãi đã hết hạn!" });
        if (coupon.used_count >= coupon.usage_limit) return res.status(400).json({ success: false, message: "Mã khuyến mãi đã hết lượt sử dụng!" });
        if (amount < Number(coupon.min_order_value)) return res.status(400).json({ success: false, message: `Đơn hàng phải từ ${Number(coupon.min_order_value).toLocaleString('vi-VN')}đ để áp dụng mã này!` });

        // 3.3. 🌟 KIỂM TRA LƯỢT DÙNG CỦA USER DỰA TRÊN CẤU HÌNH ĐỘNG
        const historyRes = await pool.query(`SELECT usage_count FROM public.coupon_history WHERE user_id = $1 AND coupon_id = $2`, [userId, coupon.id]);
        if (historyRes.rows.length > 0 && historyRes.rows[0].usage_count >= coupon.user_usage_limit) {
            return res.status(400).json({ success: false, message: `Bạn đã sử dụng mã này tối đa ${coupon.user_usage_limit} lần rồi!` });
        }

        // 3.4. KIỂM TRA ĐIỀU KIỆN VIP
        const minLifetimeSpent = Number(coupon.min_lifetime_spent);
        if (minLifetimeSpent > 0) {
            try {
                const orderSvcRes = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/user-spent/${userId}`);
                const totalSpent = Number(orderSvcRes.data?.total_spent || 0);
                
                if (totalSpent < minLifetimeSpent) {
                    return res.status(403).json({ 
                        success: false, 
                        message: `Mã này chỉ dành cho khách hàng có tổng chi tiêu từ ${minLifetimeSpent.toLocaleString('vi-VN')}đ trở lên!` 
                    });
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: "Lỗi đối soát điều kiện VIP, vui lòng thử lại sau!" });
            }
        }

        // 3.5. Tính số tiền được giảm
        let discountApplied = Number(coupon.discount_value);
        if (discountApplied > amount) discountApplied = amount;

        return res.status(200).json({
            success: true,
            message: "Áp dụng mã thành công!",
            data: {
                coupon_id: coupon.id,
                code: coupon.code,
                discount_amount: Math.round(discountApplied)
            }
        });

    } catch (error) {
        console.error("❌ Lỗi Validate Coupon:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi kiểm tra mã khuyến mãi." });
    }
    
};

// ========================================================
// 4. CHỐT MÃ VÀ TRỪ LƯỢT (GHI VÀO DATABASE NGAY LẬP TỨC)
// ========================================================
export const applyCoupon = async (req, res) => {
    const { code, user_id, ma_don_hang, discount_applied } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 

        // 🛡️ BƯỚC 1: CẬP NHẬT TỔNG SỐ LƯỢT ĐÃ DÙNG CỦA MÃ (used_count + 1)
        const updateCouponQuery = `
            UPDATE public.coupons 
            SET used_count = used_count + 1 
            WHERE code = $1 AND is_active = true AND used_count < usage_limit 
            RETURNING id, used_count, usage_limit, user_usage_limit;
        `;
        const updateRes = await client.query(updateCouponQuery, [String(code).toUpperCase()]);

        if (updateRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "Mã khuyến mãi đã hết lượt hoặc không khả dụng!" });
        }

        const coupon = updateRes.rows[0];

        // 🚨 TỰ ĐỘNG TẮT ĐÈN: Nếu số lượt dùng vừa chạm tới ngưỡng phát hành, lập tức vô hiệu hóa mã
        if (coupon.used_count >= coupon.usage_limit) {
            await client.query(`UPDATE public.coupons SET is_active = false WHERE id = $1`, [coupon.id]);
        }

        // 🛡️ BƯỚC 2: CẬP NHẬT SỐ LƯỢT DÙNG CỦA RIÊNG KHÁCH HÀNG ĐÓ
        const upsertHistoryQuery = `
            INSERT INTO public.coupon_history (coupon_id, user_id, ma_don_hang, discount_applied, usage_count) 
            VALUES ($1, $2, $3, $4, 1)
            ON CONFLICT (coupon_id, user_id) 
            DO UPDATE SET 
                usage_count = coupon_history.usage_count + 1
            WHERE coupon_history.usage_count < $5
            RETURNING usage_count;
        `;
        const historyRes = await client.query(upsertHistoryQuery, [coupon.id, user_id, ma_don_hang, discount_applied, coupon.user_usage_limit]);

        if (historyRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `Bạn đã dùng mã này tối đa ${coupon.user_usage_limit} lần!` });
        }

        await client.query('COMMIT'); 
        res.status(200).json({ success: true, message: "Chốt mã và trừ lượt thành công!" });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error("❌ Lỗi hệ thống Apply Coupon:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi chốt mã." });
    } finally {
        client.release(); 
    }
};

// ========================================================
// 5. XEM CHI TIẾT 1 MÃ
// ========================================================
export const getCouponById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM public.coupons WHERE id = $1`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy mã khuyến mãi này!" });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải chi tiết mã." });
    }
};

// ========================================================
// 6. BẬT/TẮT TRẠNG THÁI MÃ 
// ========================================================
export const toggleCouponStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body; 

    if (typeof is_active !== 'boolean') return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ!" });

    try {
        const query = `UPDATE public.coupons SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, code, is_active;`;
        const { rows } = await pool.query(query, [is_active, id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy mã để cập nhật!" });
        res.status(200).json({ success: true, message: is_active ? "Đã PHÁT HÀNH mã cho khách sử dụng!" : "Đã TẠM NGƯNG mã thành công!", data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi trạng thái." });
    }
};

// ========================================================
// 7. CHỈNH SỬA MÃ (Đã cập nhật Giới hạn người dùng)
// ========================================================
export const updateCoupon = async (req, res) => {
    const { id } = req.params;
    const { 
        code, description, discount_amount, 
        min_order_value, min_lifetime_spent, usage_limit, user_usage_limit, start_date, end_date 
    } = req.body;

    try {
        const checkQuery = `SELECT used_count FROM public.coupons WHERE id = $1`;
        const checkRes = await pool.query(checkQuery, [id]);
        
        if (checkRes.rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy mã!" });
        if (checkRes.rows[0].used_count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Mã này đã có khách hàng sử dụng, bạn không thể thay đổi giá trị được nữa! Hãy xóa hoặc tắt nó đi và tạo mã mới." 
            });
        }

        const query = `
            UPDATE public.coupons SET 
                code = $1, description = $2, discount_type = 'fixed_amount', discount_value = $3, 
                min_order_value = $4, min_lifetime_spent = $5, usage_limit = $6, user_usage_limit = $7, start_date = $8, end_date = $9, updated_at = NOW()
            WHERE id = $10
            RETURNING *;
        `;
        const values = [
            String(code).toUpperCase(), description, discount_amount, 
            min_order_value || 0, min_lifetime_spent || 0, 
            usage_limit, user_usage_limit || 1, start_date, end_date, id
        ];

        const { rows } = await pool.query(query, values);
        res.status(200).json({ success: true, message: "Cập nhật mã khuyến mãi thành công!", data: rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ success: false, message: "Mã code này bị trùng với một mã khác!" });
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi sửa mã." });
    }
};

// ========================================================
// 8. XÓA MÃ KHUYẾN MÃI
// ========================================================
export const deleteCoupon = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `DELETE FROM public.coupons WHERE id = $1 RETURNING code;`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy mã để xóa!" });
        res.status(200).json({ success: true, message: `Đã xóa vĩnh viễn mã ${rows[0].code}!` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa mã khuyến mãi." });
    }
};