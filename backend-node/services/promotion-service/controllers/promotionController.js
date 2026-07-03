import pool from '../configs/database.js';
import axios from 'axios';

// =========================================================================
// 🛠️ HELPER FUNCTIONS
// =========================================================================
const generateUniqueId = (prefix) => {
    const timeStr = Date.now().toString().slice(-6);
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${timeStr}${randomNum}`;
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

        const ma_khuyen_mai = generateUniqueId('FS_');

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
// [ADMIN] 2. THÊM SẢN PHẨM (BIẾN THỂ) VÀO CHƯƠNG TRÌNH
// =========================================================================
export const addItemsToFlashSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { ma_khuyen_mai } = req.params;
        const { items } = req.body; // Mảng: [{ ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách sản phẩm trống." });
        }

        await client.query('BEGIN');

        for (const item of items) {
            const { ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han } = item;
            
            // Dùng ON CONFLICT để nếu admin add trùng thì tự động cập nhật lại giá và số lượng
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
        // Do có ON DELETE CASCADE ở database, xóa ở bảng flash_sales sẽ tự xóa flash_sale_items
        const { rowCount } = await pool.query(`DELETE FROM public.flash_sales WHERE ma_khuyen_mai = $1`, [ma_khuyen_mai]);

        if (rowCount === 0) return res.status(404).json({ success: false, message: "Chương trình không tồn tại." });
        res.status(200).json({ success: true, message: "Đã xóa chương trình và các sản phẩm liên quan." });
    } catch (error) {
        console.error("❌ Lỗi deleteFlashSale:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống." });
    }
};

// =========================================================================
// [CLIENT] 5. LẤY FLASH SALE ĐANG CHẠY (GỌI AXIOS QUA PRODUCT SERVICE)
// =========================================================================
export const getActiveFlashSaleClient = async (req, res) => {
    try {
        // 1. Tìm chương trình Flash Sale đang trong thời gian hiệu lực và đang Bật
        const activePromoQuery = `
            SELECT * FROM public.flash_sales 
            WHERE thoi_gian_bat_dau <= NOW() AND thoi_gian_ket_thuc >= NOW() 
              AND trang_thai = true
            ORDER BY thoi_gian_ket_thuc ASC LIMIT 1;
        `;
        const { rows: promos } = await pool.query(activePromoQuery);

        if (promos.length === 0) {
            return res.status(200).json({ success: true, message: "Không có Flash Sale nào đang chạy.", data: null });
        }

        const currentPromo = promos[0];

        // 2. Lấy danh sách các SKU nằm trong chương trình này
        const itemsQuery = `
            SELECT ma_san_pham, ma_bien_the, gia_khuyen_mai, so_luong_gioi_han, da_ban 
            FROM public.flash_sale_items 
            WHERE ma_khuyen_mai = $1 AND trang_thai = true;
        `;
        const { rows: items } = await pool.query(itemsQuery, [currentPromo.ma_khuyen_mai]);

        if (items.length === 0) {
            return res.status(200).json({ success: true, data: { ...currentPromo, products: [] } });
        }

        // 3. GIAO TIẾP MICROSERVICES: Gọi Product Service để lấy tên, hình ảnh
        const variantIds = items.map(item => item.ma_bien_the);
        
        // ĐƯỜNG DẪN NÀY LÀ CỦA PRODUCT SERVICE (Bạn có thể đưa vào file .env sau)
        const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5007'; 
        
        const productRes = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/internal-variants`, {
            variantIds: variantIds
        });
        
        const productDetails = productRes.data; // Mảng dữ liệu từ database Product

        // 4. Ghép nối dữ liệu (Molding data) chuẩn form ProductCard.jsx yêu cầu
        const mergedProducts = items.map(item => {
            // Tìm data gốc tương ứng
            const pd = productDetails.find(p => p.ma_bien_the === item.ma_bien_the) || {};

            // Tính tồn kho thực tế của Flash Sale (Giới hạn trừ đi số đã bán)
            const tonKhoFlashSale = item.so_luong_gioi_han - item.da_ban;

            return {
                ma_san_pham: item.ma_san_pham,
                ten_san_pham: pd.ten_san_pham || "Sản phẩm đang cập nhật",
                hinh_anh_chinh: pd.hinh_anh_chinh || "", // Đảm bảo Product Service có trả về trường này
                
                // Trả về cấu trúc mảng chi_tiet_bien_the giống hệt API getAllProducts nhánh Client
                chi_tiet_bien_the: [
                    {
                        ma_bien_the: item.ma_bien_the,
                        ten_bien_the: pd.ten_bien_the || "Mặc định",
                        gia_ban: item.gia_khuyen_mai, // 🌟 ÉP GIÁ XUỐNG THÀNH GIÁ KHUYẾN MÃI
                        ton_kho: tonKhoFlashSale > 0 ? tonKhoFlashSale : 0, // 🌟 ÉP TỒN KHO THÀNH TỒN KHO SALE
                        sku: pd.sku || ""
                    }
                ],
                
                // Trường phục vụ UI thanh tiến trình "Đã bán"
                thong_tin_sale: {
                    da_ban: item.da_ban,
                    so_luong_gioi_han: item.so_luong_gioi_han,
                    phan_tram_da_ban: item.so_luong_gioi_han > 0 ? Math.round((item.da_ban / item.so_luong_gioi_han) * 100) : 0
                }
            };
        });

        // 5. Trả về kết quả cho Frontend
        res.status(200).json({
            success: true,
            data: {
                chuong_trinh: {
                    ma_khuyen_mai: currentPromo.ma_khuyen_mai,
                    ten_chuong_trinh: currentPromo.ten_chuong_trinh,
                    thoi_gian_ket_thuc: currentPromo.thoi_gian_ket_thuc
                },
                products: mergedProducts 
            }
        });

    } catch (error) {
        console.error("❌ Lỗi getActiveFlashSaleClient:", error.message);
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