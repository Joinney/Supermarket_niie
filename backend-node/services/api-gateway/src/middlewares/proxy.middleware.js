import { createProxyMiddleware } from 'http-proxy-middleware';

export const setupProxy = (targetUrl, isWs = false) => {
    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        ws: isWs,
        pathRewrite: (path, req) => req.originalUrl,
        timeout: 5000,      // Giảm xuống 5s ở Local để báo lỗi ngay nếu Service ngắt
        proxyTimeout: 5000,
        // 🚀 CỐT LÕI: Fix lỗi treo request POST/PUT khi bị Express parse JSON
        onProxyReq: (proxyReq, req, res) => {
            if (req.body && Object.keys(req.body).length && !proxyReq.headersSent) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res) => {
            console.error(`[Gateway Error] Lỗi kết nối tới ${targetUrl}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    success: false,
                    message: `Dịch vụ tại ${targetUrl} không phản hồi hoặc chưa bật ở Local!`
                });
            }
        }
    });
};