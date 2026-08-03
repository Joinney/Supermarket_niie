import pool from '../configs/database.js';
import axios from 'axios';

/**
 * 1. LẤY DANH SÁCH ĐỊA CHỈ CỦA USER ĐANG ĐĂNG NHẬP (USER VIEW)
 */
export const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT * FROM user_addresses 
            WHERE user_id::text = $1::text 
            ORDER BY is_default DESC, created_at DESC
        `;
        const result = await pool.query(query, [String(userId)]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Lỗi getAddresses:", error.message);
        return res.status(500).json({ success: false, error: "Không thể lấy danh sách địa chỉ" });
    }
};

/**
 * 🌟 1B. LẤY DANH SÁCH ĐỊA CHỈ THEO USER ID (DÀNH CHO ADMIN VIEW)
 */
export const getAddressesByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || userId === "undefined") {
            return res.status(200).json({ success: true, addresses: [], data: [] });
        }

        const query = `
            SELECT * FROM user_addresses 
            WHERE user_id::text = $1::text 
            ORDER BY is_default DESC, created_at DESC
        `;
        const result = await pool.query(query, [String(userId)]);

        return res.status(200).json({ 
            success: true, 
            addresses: result.rows,
            data: result.rows 
        });
    } catch (error) {
        console.error("Lỗi getAddressesByUserId:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Lỗi hệ thống khi Admin lấy danh sách địa chỉ của người dùng" 
        });
    }
};

/**
 * 🌟 1C. BỔ SUNG MỚI: LẤY CHI TIẾT 1 ĐỊA CHỈ THEO ADDRESS_ID (ADMIN / INTERNAL CALL)
 */
export const getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id || req.params.address_id;

        if (!addressId || addressId === "undefined" || addressId === "null") {
            return res.status(400).json({ success: false, message: "address_id không hợp lệ" });
        }

        const query = `SELECT * FROM user_addresses WHERE address_id = $1`;
        const result = await pool.query(query, [Number(addressId)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ trong CSDL" });
        }

        const addr = result.rows[0];

        // Tự động ghép chuỗi full_address để Frontend render ngay lập tức
        const full_address = [
            addr.detail_address,
            addr.ward_name,
            addr.district_name,
            addr.province_name
        ].filter(Boolean).join(", ");

        return res.status(200).json({ 
            success: true, 
            data: {
                ...addr,
                full_address
            }
        });
    } catch (error) {
        console.error("Lỗi getAddressById:", error.message);
        return res.status(500).json({ success: false, error: "Lỗi hệ thống khi lấy chi tiết địa chỉ" });
    }
};

/**
 * 2. THÊM ĐỊA CHỈ MỚI
 */
export const addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            receiver_name, receiver_phone, province_name, province_id, ProvinceID,
            district_name, district_id, DistrictID, ward_name, ward_id, ward_code, WardCode,
            detail_address, is_default, address_type,
            latitude, longitude
        } = req.body;

        const isDefaultBool = is_default === 1 || is_default === true;
        if (isDefaultBool) {
            await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id::text = $1::text', [String(userId)]);
        }

        const query = `
            INSERT INTO user_addresses (
                user_id, receiver_name, receiver_phone, province_name, province_id, 
                district_name, district_id, ward_name, ward_code, detail_address, is_default, address_type,
                latitude, longitude
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *
        `;

        const finalProvinceId = province_id || ProvinceID || 1;
        const finalDistrictId = district_id || DistrictID || 1;
        const finalWardCode = ward_code || ward_id || WardCode || '1';

        const values = [
            userId, receiver_name, receiver_phone, province_name, Number(finalProvinceId),    
            district_name, Number(finalDistrictId), ward_name, String(finalWardCode), 
            detail_address, isDefaultBool, address_type || 'home',
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null
        ];

        const result = await pool.query(query, values);
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Lỗi addAddress:", error.message);
        return res.status(500).json({ success: false, error: "Lỗi hệ thống khi thêm địa chỉ" });
    }
};

/**
 * 3. CẬP NHẬT ĐỊA CHỈ
 */
export const updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id || req.params.address_id;
        
        const { 
            receiver_name, receiver_phone, province_name, province_id, ProvinceID,
            district_name, district_id, DistrictID, ward_name, ward_id, ward_code, WardCode, 
            detail_address, is_default, address_type,
            latitude, longitude
        } = req.body;

        const isDefaultBool = is_default === 1 || is_default === true;

        if (isDefaultBool) {
            await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id::text = $1::text', [String(userId)]);
        }

        const query = `
            UPDATE user_addresses 
            SET receiver_name = $1, receiver_phone = $2, province_name = $3, province_id = $4, 
                district_name = $5, district_id = $6, ward_name = $7, ward_code = $8, 
                detail_address = $9, is_default = $10, 
                address_type = $11, latitude = $12, longitude = $13
            WHERE address_id = $14 AND user_id::text = $15::text RETURNING *
        `;

        const finalProvinceId = province_id || ProvinceID || 1;
        const finalDistrictId = district_id || DistrictID || 1;
        const finalWardCode = ward_code || ward_id || WardCode || '1';

        const values = [
            receiver_name, receiver_phone, province_name, Number(finalProvinceId), 
            district_name, Number(finalDistrictId), ward_name, String(finalWardCode), 
            detail_address, isDefaultBool, address_type || 'home', 
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null,
            addressId, String(userId)     
        ];

        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Lỗi updateAddress:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 4. XÓA ĐỊA CHỈ
 */
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id || req.params.address_id;
        const userId = req.user.id;
        const result = await pool.query(
            'DELETE FROM user_addresses WHERE address_id = $1 AND user_id::text = $2::text RETURNING *', 
            [addressId, String(userId)]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Xóa thất bại" });
        return res.status(200).json({ success: true, message: "Đã xóa địa chỉ khỏi hệ thống!" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ========================================================
// 🛡️ TRUNG TÂM API PROXY ĐỊA CHÍNH - GHN PRODUCTION
// ========================================================

const getGhnConfig = () => {
    const rawToken = process.env.GHN_TOKEN || '200ce97d-5b84-11f1-9370-d6d3721dfdc0';
    let baseUrl = 'https://online-gateway.ghn.vn/shiip/public-api/master-data';
    
    return {
        token: String(rawToken).trim(),
        baseUrl: baseUrl
    };
};

/**
 * 5. PROXY TỈNH THÀNH
 */
export const getProvincesProxy = async (req, res) => {
    try {
        const config = getGhnConfig();
        const response = await axios.get(`${config.baseUrl}/province`, {
            headers: { 
                'Token': config.token,
                'Content-Type': 'application/json'
            }
        });
        return res.status(200).json({ success: true, data: response.data.data });
    } catch (error) {
        console.error("🔥 Lỗi sập hàm getProvincesProxy:", error.response?.data || error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Lỗi kết nối từ Backend Demi Mart đến máy chủ GHN",
            details: error.message 
        });
    }
};

/**
 * 6. PROXY QUẬN HUYỆN
 */
export const getDistrictsProxy = async (req, res) => {
    try {
        const { province_id } = req.query;
        if (!province_id) return res.status(400).json({ success: false, error: "Thiếu province_id" });

        const config = getGhnConfig();
        const response = await axios.post(`${config.baseUrl}/district`, 
            { province_id: Number(province_id) },
            { headers: { 'Token': config.token, 'Content-Type': 'application/json' } }
        );
        return res.status(200).json({ success: true, data: response.data.data });
    } catch (error) {
        console.error("🔥 Lỗi sập hàm getDistrictsProxy:", error.response?.data || error.message);
        return res.status(500).json({ success: false, error: "Lỗi hệ thống khi bốc danh mục Quận/Huyện" });
    }
};

/**
 * 7. PROXY PHƯỜNG XÃ
 */
export const getWardsProxy = async (req, res) => {
    try {
        const { district_id } = req.query;
        if (!district_id) return res.status(400).json({ success: false, error: "Thiếu district_id" });

        const config = getGhnConfig();
        const response = await axios.post(`${config.baseUrl}/ward`, 
            { district_id: Number(district_id) },
            { headers: { 'Token': config.token, 'Content-Type': 'application/json' } }
        );
        return res.status(200).json({ success: true, data: response.data.data });
    } catch (error) {
        console.error("🔥 Lỗi sập hàm getWardsProxy:", error.response?.data || error.message);
        return res.status(500).json({ success: false, error: "Lỗi hệ thống khi bốc danh mục Phường/Xã" });
    }
};