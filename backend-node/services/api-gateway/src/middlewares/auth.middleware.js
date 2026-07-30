import jwt from 'jsonwebtoken';

export const verifyTokenAtGateway = (req, res, next) => {
    // Logic kiểm tra token ở đây...
    // Tạm thời có thể next() đi tiếp
    next();
};