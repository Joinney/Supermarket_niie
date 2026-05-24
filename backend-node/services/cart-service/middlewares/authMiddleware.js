import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token = req.headers.authorization;
    
    // DEBUG: In ra xem Backend nhận được gì
    console.log("DEBUG Backend: Authorization Header =", token);

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.log("DEBUG Backend: JWT Verify Error =", error.message);
            res.status(401).json({ message: 'Token không hợp lệ' });
        }
    } else {
        res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    }
};