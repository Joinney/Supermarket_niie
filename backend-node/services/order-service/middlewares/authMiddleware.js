import jwt from 'jsonwebtoken';

/**
 * Middleware để xác thực JWT token từ Authorization header
 * Expected format: Authorization: Bearer <token>
 */
const protect = (req, res, next) => {
    try {
        // Lấy token từ Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp. Vui lòng đăng nhập.'
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || 'vdt_secret_2026'
        );

        // Gắn thông tin user vào request object
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Token không hợp lệ.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực: ' + error.message
        });
    }
};

export { protect };
