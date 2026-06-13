import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token = req.headers.authorization;
    
    console.log("DEBUG Backend: Authorization Header =", token);

    // Thêm .toLowerCase() để chấp nhận cả 'bearer' viết thường và check có dấu cách phía sau
    if (token && token.toLowerCase().startsWith('bearer ')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            req.user = decoded;
            next();
        } catch (error) {
            console.log("DEBUG Backend: JWT Verify Error =", error.message);
            
            // Trả về thêm trường expired để Frontend dễ bắt điều kiện làm Refresh Token
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    code: 'TOKEN_EXPIRED', 
                    message: 'Token đã hết hạn, vui lòng refresh hoặc đăng nhập lại' 
                });
            }
            
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }
    } else {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc Token sai định dạng' });
    }
};