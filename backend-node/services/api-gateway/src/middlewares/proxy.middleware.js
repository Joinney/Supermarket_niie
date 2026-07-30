import { createProxyMiddleware } from 'http-proxy-middleware';

export const setupProxy = (targetUrl, isWs = false) => {
    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        ws: isWs,
        // 🌟 BÍ QUYẾT: Ép proxy gửi đi nguyên bản đường dẫn gốc (vd: /api/v1/auth/signin)
        pathRewrite: (path, req) => req.originalUrl,
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error(`[Gateway Error] Lỗi kết nối tới ${targetUrl}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    success: false,
                    message: "Dịch vụ hiện không khả dụng (Service Unavailable)"
                });
            }
        }
    });
};