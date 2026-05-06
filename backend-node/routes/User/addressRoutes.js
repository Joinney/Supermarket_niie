import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../../configs/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Quản lý địa chỉ giao hàng của người dùng (Yêu cầu đăng nhập)
 */

/**
 * MIDDLEWARE XÁC THỰC TOKEN
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Không tìm thấy Token xác thực!" });
    }

    const secretKey = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
        }
        req.user = { id: decoded.id || decoded.sub || decoded.user_id };
        next();
    });
};

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ của người dùng hiện tại
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về mảng danh sách địa chỉ thành công
 *       401:
 *         description: Chưa đăng nhập (Thiếu Token)
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT * FROM user_addresses 
            WHERE user_id = $1 
            ORDER BY is_default DESC, created_at DESC`;
        const result = await pool.query(query, [userId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error fetching addresses:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server khi lấy danh sách địa chỉ" });
    }
});

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Thêm địa chỉ giao hàng mới
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver_name:
 *                 type: string
 *               receiver_phone:
 *                 type: string
 *               province_name:
 *                 type: string
 *               district_name:
 *                 type: string
 *               ward_name:
 *                 type: string
 *               detail_address:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *               address_type:
 *                 type: string
 *                 enum: [home, office]
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 */
router.post('/', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        if (!req.body.receiver_name) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin người nhận!" });
        }

        const { 
            receiver_name, receiver_phone, province_id, province_name, 
            district_id, district_name, ward_code, ward_name, 
            detail_address, is_default, address_type 
        } = req.body;

        await client.query('BEGIN');

        const defaultStatus = is_default === true || is_default === 1;

        if (defaultStatus) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }

        const insertQuery = `
            INSERT INTO user_addresses 
            (user_id, receiver_name, receiver_phone, province_id, province_name, 
             district_id, district_name, ward_code, ward_name, detail_address, is_default, address_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`;
        
        const result = await client.query(insertQuery, [
            userId, receiver_name, receiver_phone, 
            province_id || 0, province_name || '',
            district_id || 0, district_name || '', 
            ward_code || '', ward_name || '', 
            detail_address, defaultStatus, address_type || 'home'
        ]);

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error adding address:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Cập nhật thông tin địa chỉ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', verifyToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const addressId = req.params.id; 
        const userId = req.user.id;
        const { 
            receiver_name, receiver_phone, province_id, province_name, 
            district_id, district_name, ward_code, ward_name, 
            detail_address, is_default, address_type 
        } = req.body;

        await client.query('BEGIN');

        if (is_default) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }

        const updateQuery = `
            UPDATE user_addresses 
            SET receiver_name = $1, receiver_phone = $2, province_id = $3, province_name = $4, 
                district_id = $5, district_name = $6, ward_code = $7, ward_name = $8, 
                detail_address = $9, is_default = $10, address_type = $11, created_at = NOW()
            WHERE address_id = $12 AND user_id = $13
            RETURNING *`;
        
        const result = await client.query(updateQuery, [
            receiver_name, receiver_phone, province_id, province_name,
            district_id, district_name, ward_code, ward_name, detail_address, 
            is_default, address_type, 
            addressId, 
            userId
        ]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ của bạn!" });
        }

        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error updating address:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server khi cập nhật địa chỉ" });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Xóa một địa chỉ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM user_addresses WHERE address_id = $1 AND user_id = $2 RETURNING is_default', 
            [addressId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ!" });
        }

        if (result.rows[0].is_default) {
            await pool.query(`
                UPDATE user_addresses 
                SET is_default = true 
                WHERE address_id = (SELECT address_id FROM user_addresses WHERE user_id = $1 LIMIT 1)
            `, [userId]);
        }

        res.json({ success: true, message: "Đã xóa địa chỉ thành công!" });
    } catch (error) {
        console.error("Error deleting address:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server khi xóa địa chỉ" });
    }
});

export default router;