import dotenv from 'dotenv';
dotenv.config();

export const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:5003',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:5005',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5006',
    promotion: process.env.PROMOTION_SERVICE_URL || 'http://localhost:5007',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8085'
};