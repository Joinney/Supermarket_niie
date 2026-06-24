import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token = req.headers.authorization;
    
    console.log("DEBUG Backend: Authorization Header =", token);

    // Thêm .toLowerCase() để chấp nhận cả 'bearer ' viết thường và check có dấu cách phía sau
    if (token && token.toLowerCase().startsWith('bearer ')) {
        try {
            token = token.split(' ')[1];
            
            // Xác thực token bằng Secret Key từ biến môi trường
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Gán dữ liệu user đã giải mã (id, role,...) vào object request
            req.user = decoded;
            next();
        } catch (error) {
            console.log("DEBUG Backend: JWT Verify Error =", error.message);
            
            // Trả về thêm trường code cố định để Frontend dễ bắt điều kiện làm Refresh Token ngầm
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    code: 'TOKEN_EXPIRED', 
                    message: 'Token đã hết hạn, vui lòng tiến hành refresh hoặc đăng nhập lại.' 
                });
            }
            
            return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã bị thay đổi.' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập hoặc Token sai định dạng cơ bản.' });
    }
};