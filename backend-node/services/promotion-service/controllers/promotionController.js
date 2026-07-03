import pool from '../configs/database.js';
import axios from 'axios';

// =========================================================================
// 🛠️ HELPER FUNCTIONS (ĐÃ SỬA ĐỂ LẤY NGÀY BẮT ĐẦU)
// =========================================================================
const generateIdByDate = (prefix, dateString) => {
    // Chuyển chuỗi thời gian thành object Date
    const date = new Date(dateString);
    
    // Bóc tách Năm, Tháng, Ngày (đảm bảo luôn có 2 chữ số)
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Tạo thêm 4 số ngẫu nhiên ở đuôi để đề phòng bạn tạo 2 đợt Sale trong cùng 1 ngày
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    
    // Kết quả: FS_20260704_1835
    return `${prefix}${yyyy}${mm}${dd}_${randomNum}`;
};

// =========================================================================
// [ADMIN] 1. TẠO CHƯƠNG TRÌNH KHUYẾN MÃI MỚI
// =========================================================================
export const createFlashSale = async (req, res) => {
    try {
        const { ten_chuong_trinh, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc } = req.body;

        if (!ten_chuong_trinh || !thoi_gian_bat_dau || !thoi_gian_ket_thuc) {
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ tên và thời gian chương trình." });
        }

        const ma_khuyen_mai = generateIdByDate('FS_', thoi_gian_bat_dau);

        const query = `
            INSERT INTO public.flash_sales (ma_khuyen_mai, ten_chuong_trinh, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, ngay_tao)
            VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING *;
        `;
        const { rows } = await pool.query(query, [ma_khuyen_mai, ten_chuong_trinh, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc]);

        res.status(201).json({ success: true, message: "Tạo chương trình Flash Sale thành công!", data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi createFlashSale:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo khuyến mãi." });
    }
};

// =========================================================================
// [ADMIN] 2. THÊM SẢN PHẨM (BIẾN THỂ) VÀO CHƯƠNG TRÌNH (🌟 ĐÃ NÂNG CẤP CHỐNG TRÙNG)
// =========================================================================
export const addItemsToFlashSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { ma_khuyen_mai } = req.params;
        const { items } = req.body; // Mảng: [{ ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách sản phẩm trống." });
        }

        // BƯỚC 2.1: Lấy thời gian của chương trình Flash Sale hiện tại đang thao tác
        const currentPromoQuery = `SELECT thoi_gian_bat_dau, thoi_gian_ket_thuc FROM public.flash_sales WHERE ma_khuyen_mai = $1`;
        const currentPromoRes = await pool.query(currentPromoQuery, [ma_khuyen_mai]);
        
        if (currentPromoRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy chương trình khuyến mãi gốc." });
        }
        const { thoi_gian_bat_dau, thoi_gian_ket_thuc } = currentPromoRes.rows[0];

        // BƯỚC 2.2: KIỂM TRA XUNG ĐỘT (OVERLAP) THỜI GIAN VÀ SẢN PHẨM
        const variantIds = items.map(item => item.ma_bien_the);
        
        // Truy vấn tìm xem có biến thể nào đã nằm trong 1 chương trình khác đang bật và trùng thời gian không
        // Logic giao thời gian: (Bắt đầu A <= Kết thúc B) VÀ (Kết thúc A >= Bắt đầu B)
        const checkOverlapQuery = `
            SELECT fsi.ma_bien_the, fs.ten_chuong_trinh
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fsi.ma_khuyen_mai = fs.ma_khuyen_mai
            WHERE fsi.ma_bien_the = ANY($1)
              AND fsi.ma_khuyen_mai != $2  -- Bỏ qua chính chương trình đang cập nhật (để admin có thể sửa lại chính nó)
              AND fs.trang_thai = true
              AND (fs.thoi_gian_bat_dau <= $4 AND fs.thoi_gian_ket_thuc >= $3)
        `;
        const { rows: overlappedItems } = await pool.query(checkOverlapQuery, [variantIds, ma_khuyen_mai, thoi_gian_bat_dau, thoi_gian_ket_thuc]);

        if (overlappedItems.length > 0) {
            // Nếu có lỗi, gom các mã SKU lại báo cho Admin biết để gỡ ra
            const listLoi = [...new Set(overlappedItems.map(i => i.ma_bien_the))].join(", ");
            return res.status(400).json({ 
                success: false, 
                message: `CẢNH BÁO: Các biến thể [${listLoi}] đang tham gia đợt sale "${overlappedItems[0].ten_chuong_trinh}" trong cùng khoảng thời gian này. Vui lòng gỡ các sản phẩm đó ra.` 
            });
        }

        // BƯỚC 2.3: NẾU AN TOÀN, CHO PHÉP UPDATE VÀO DATABASE
        await client.query('BEGIN');

        for (const item of items) {
            const { ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han } = item;
            
            const query = `
                INSERT INTO public.flash_sale_items (ma_khuyen_mai, ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han, da_ban, trang_thai)
                VALUES ($1, $2, $3, $4, $5, 0, true)
                ON CONFLICT (ma_khuyen_mai, ma_bien_the) 
                DO UPDATE SET gia_khuyen_mai = EXCLUDED.gia_khuyen_mai, so_luong_gioi_han = EXCLUDED.so_luong_gioi_han;
            `;
            await client.query(query, [ma_khuyen_mai, ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han || 0]);
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `Đã cập nhật ${items.length} biến thể vào chương trình!` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Lỗi addItemsToFlashSale:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm sản phẩm." });
    } finally {
        client.release();
    }
};

// =========================================================================
// [ADMIN] 3. SỬA CHƯƠNG TRÌNH HOẶC TẮT/BẬT TRẠNG THÁI
// =========================================================================
export const updateFlashSale = async (req, res) => {
    try {
        const { ma_khuyen_mai } = req.params;
        const { ten_chuong_trinh, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai } = req.body;

        const query = `
            UPDATE public.flash_sales 
            SET ten_chuong_trinh = COALESCE($1, ten_chuong_trinh),
                thoi_gian_bat_dau = COALESCE($2, thoi_gian_bat_dau),
                thoi_gian_ket_thuc = COALESCE($3, thoi_gian_ket_thuc),
                trang_thai = COALESCE($4, trang_thai),
                ngay_cap_nhat = NOW()
            WHERE ma_khuyen_mai = $5 RETURNING *;
        `;
        const { rows } = await pool.query(query, [ten_chuong_trinh, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai, ma_khuyen_mai]);

        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy chương trình." });
        res.status(200).json({ success: true, message: "Cập nhật thành công!", data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi updateFlashSale:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống." });
    }
};

// =========================================================================
// [ADMIN] 4. XÓA CHƯƠNG TRÌNH KHUYẾN MÃI
// =========================================================================
export const deleteFlashSale = async (req, res) => {
    try {
        const { ma_khuyen_mai } = req.params;
        const { rowCount } = await pool.query(`DELETE FROM public.flash_sales WHERE ma_khuyen_mai = $1`, [ma_khuyen_mai]);

        if (rowCount === 0) return res.status(404).json({ success: false, message: "Chương trình không tồn tại." });
        res.status(200).json({ success: true, message: "Đã xóa chương trình và các sản phẩm liên quan." });
    } catch (error) {
        console.error("❌ Lỗi deleteFlashSale:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống." });
    }
};

// =========================================================================
// [CLIENT] 5. LẤY DANH SÁCH FLASH SALE (ĐANG CHẠY & SẮP DIỄN RA)
// =========================================================================
export const getActiveFlashSaleClient = async (req, res) => {
    try {
        // 1. Lấy danh sách chương trình đang chạy và sắp diễn ra
        const promoQuery = `
            SELECT * FROM public.flash_sales 
            WHERE thoi_gian_ket_thuc >= NOW() 
              AND trang_thai = true
            ORDER BY 
                CASE 
                    WHEN thoi_gian_bat_dau <= NOW() AND thoi_gian_ket_thuc >= NOW() THEN 1 
                    ELSE 2 
                END,
                thoi_gian_bat_dau ASC 
            LIMIT 10;
        `;
        const { rows: promos } = await pool.query(promoQuery);

        if (promos.length === 0) {
            return res.status(200).json({ success: true, message: "Không có Flash Sale nào.", data: [] });
        }

        // 2. Lấy tất cả item của các chương trình trên
        const promoIds = promos.map(p => p.ma_khuyen_mai);
        const itemsQuery = `
            SELECT * FROM public.flash_sale_items 
            WHERE ma_khuyen_mai = ANY($1) AND trang_thai = true;
        `;
        const { rows: allItems } = await pool.query(itemsQuery, [promoIds]);

        // 3. Gọi sang Product Service (ĐÃ BỌC TRY...CATCH RIÊNG ĐỂ CHỐNG SẬP)
        const variantIds = [...new Set(allItems.map(item => item.ma_bien_the))];
        const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
        
        let productDetails = [];
        try {
            // Nếu call thành công thì lấy data
            const productRes = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/internal-variants`, {
                variantIds: variantIds
            });
            productDetails = productRes.data.data || productRes.data || [];
        } catch (axiosErr) {
            // NẾU PRODUCT SERVICE CHƯA CÓ API NÀY, CHỈ BÁO LỖI VÀNG VÀ BỎ QUA, KHÔNG LÀM SẬP API
            console.warn(`⚠️ Cảnh báo: Không thể lấy chi tiết sản phẩm từ Product Service (Mã lỗi: ${axiosErr.response?.status}). Sẽ dùng dữ liệu mặc định.`);
        }

        // 4. Ghép nối dữ liệu
        const resultData = promos.map(promo => {
            const itemsInPromo = allItems.filter(i => i.ma_khuyen_mai === promo.ma_khuyen_mai);
            
            const products = itemsInPromo.map(item => {
                // Nếu call api product lỗi, pd sẽ rỗng và dùng dữ liệu fallback an toàn
                const pd = productDetails.find(p => p.ma_bien_the === item.ma_bien_the) || {};
                const tonKhoFlashSale = item.so_luong_gioi_han - item.da_ban;

                return {
                    ma_san_pham: item.ma_san_pham,
                    ten_san_pham: pd.ten_san_pham || "Đang tải tên sản phẩm...",
                    hinh_anh_chinh: pd.hinh_anh_chinh || "",
                    chi_tiet_bien_the: [{
                        ma_bien_the: item.ma_bien_the,
                        ten_bien_the: pd.ten_bien_the || "Mặc định",
                        gia_ban: item.gia_khuyen_mai,
                        ton_kho: tonKhoFlashSale > 0 ? tonKhoFlashSale : 0,
                        sku: pd.sku || ""
                    }],
                    thong_tin_sale: {
                        da_ban: item.da_ban,
                        so_luong_gioi_han: item.so_luong_gioi_han,
                        phan_tram_da_ban: item.so_luong_gioi_han > 0 ? Math.round((item.da_ban / item.so_luong_gioi_han) * 100) : 0
                    }
                };
            });

            return {
                chuong_trinh: {
                    ma_khuyen_mai: promo.ma_khuyen_mai,
                    ten_chuong_trinh: promo.ten_chuong_trinh,
                    thoi_gian_bat_dau: promo.thoi_gian_bat_dau,
                    thoi_gian_ket_thuc: promo.thoi_gian_ket_thuc
                },
                products: products
            };
        });

        res.status(200).json({ success: true, data: resultData });
    } catch (error) {
        // Lỗi này giờ chỉ nhảy vào nếu Database Promotion bị sập
        console.error("❌ Lỗi getActiveFlashSaleClient (Fatal):", error.message);
        res.status(500).json({ success: false, message: "Lỗi đồng bộ dữ liệu Khuyến mãi." });
    }
};

// =========================================================================
// [ADMIN] 6. LẤY DANH SÁCH TẤT CẢ FLASH SALE
// =========================================================================
export const getAllFlashSalesAdmin = async (req, res) => {
    try {
        const query = `
            SELECT f.*, 
                   COALESCE(COUNT(fi.ma_bien_the), 0) AS tong_san_pham
            FROM public.flash_sales f
            LEFT JOIN public.flash_sale_items fi ON f.ma_khuyen_mai = fi.ma_khuyen_mai
            GROUP BY f.ma_khuyen_mai
            ORDER BY f.ngay_tao DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("❌ Lỗi getAllFlashSalesAdmin:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách." });
    }
};

// =========================================================================
// [ADMIN] 7. LẤY CHI TIẾT 1 FLASH SALE ĐỂ CHỈNH SỬA
// =========================================================================
export const getFlashSaleByIdAdmin = async (req, res) => {
    try {
        const { ma_khuyen_mai } = req.params;

        // Lấy thông tin chung
        const promoRes = await pool.query('SELECT * FROM public.flash_sales WHERE ma_khuyen_mai = $1', [ma_khuyen_mai]);
        if (promoRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình này.' });
        }

        // Lấy danh sách sản phẩm (items)
        const itemsRes = await pool.query('SELECT * FROM public.flash_sale_items WHERE ma_khuyen_mai = $1', [ma_khuyen_mai]);

        res.status(200).json({
            success: true,
            data: {
                chuong_trinh: promoRes.rows[0],
                products: itemsRes.rows // Trả về toàn bộ items thuộc chiến dịch này
            }
        });
    } catch (error) {
        console.error("❌ Lỗi getFlashSaleByIdAdmin:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy chi tiết." });
    }
};