import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../../configs/database.js';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Quản lý hồ sơ, ảnh đại diện và bảo mật tài khoản (Demi Mart)
 */

/**
 * 1. CẤU HÌNH MULTER - QUẢN LÝ AVATAR
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép tải lên tệp hình ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB
});

/**
 * 2. MIDDLEWARE XÁC THỰC TOKEN (Multi-key Verification)
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Không tìm thấy Token xác thực!" });
    }

    const keysToTry = [
        process.env.JWT_ACCESS_SECRET,
        process.env.JWT_SECRET,
        "vdt_secret_2026" 
    ].filter(Boolean); 

    let decodedToken = null;
    let verifyError = null;

    for (const key of keysToTry) {
        try {
            decodedToken = jwt.verify(token, key);
            if (decodedToken) break; 
        } catch (err) {
            verifyError = err;
        }
    }

    if (!decodedToken) {
        console.error("❌ JWT Verify Failed:", verifyError?.message);
        return res.status(403).json({ 
            success: false, 
            message: "Token không hợp lệ hoặc đã hết hạn!" 
        });
    }

    req.user = { id: decodedToken.id || decodedToken.sub || decodedToken.user_id };
    next();
};

/**
 * @swagger
 * /api/profile/hoso:
 *   get:
 *     summary: Lấy thông tin hồ sơ cá nhân
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng thành công
 */
router.get('/hoso', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; 
        const query = `
            SELECT user_id, username, full_name, email, phone_number, gender, birthday, avatar_url, role, address 
            FROM users 
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Lỗi GET Profile:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy thông tin" });
    }
});

/**
 * @swagger
 * /api/profile/verify-password:
 *   post:
 *     summary: Xác thực mật khẩu hiện tại (Bước 1 đổi mật khẩu)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Mật khẩu chính xác
 */
router.post('/verify-password', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        const query = `SELECT password_hash FROM users WHERE user_id = $1`;
        const user = await pool.query(query, [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
        }

        res.json({ success: true, message: "Xác thực thành công!" });
    } catch (error) {
        console.error("Lỗi Verify Password:", error.message);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

/**
 * @swagger
 * /api/profile/upload-avatar:
 *   post:
 *     summary: Tải lên ảnh đại diện
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload ảnh thành công
 */
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Không có file nào được tải lên!" });
        }

        const userId = req.user.id;
        const avatarUrl = `/uploads/${req.file.filename}`; 

        const updateSql = `UPDATE users SET avatar_url = $1 WHERE user_id = $2 RETURNING avatar_url`;
        const result = await pool.query(updateSql, [avatarUrl, userId]);

        res.json({
            success: true,
            message: "Tải ảnh lên thành công!",
            avatarUrl: avatarUrl 
        });
    } catch (error) {
        console.error("Lỗi Upload Avatar:", error.message);
        res.status(500).json({ success: false, message: "Lỗi khi lưu ảnh" });
    }
});

/**
 * @swagger
 * /api/profile/hoso:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               gender:
 *                 type: string
 *               birthday:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/hoso', verifyToken, async (req, res) => {
    try {
        const { full_name, gender, birthday, phone_number, avatar_url, address, email } = req.body;
        const userId = req.user.id;

        const updateQuery = `
            UPDATE users 
            SET full_name = $1, gender = $2, birthday = $3, phone_number = $4, 
                avatar_url = $5, address = $6, email = $7, updated_at = NOW()
            WHERE user_id = $8
            RETURNING user_id, full_name, email, phone_number, avatar_url;
        `;

        const values = [full_name, gender, birthday, phone_number, avatar_url, address, email, userId];
        const result = await pool.query(updateQuery, values);

        res.status(200).json({ success: true, message: "Cập nhật thành công!", data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: "Email này đã được sử dụng!" });
        }
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

/**
 * @swagger
 * /api/profile/change-password:
 *   put:
 *     summary: Đặt mật khẩu mới
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [hashedPassword, userId]);

        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi đổi mật khẩu" });
    }
});

// QUAN TRỌNG: Dòng này phải ở cuối cùng
export default router;