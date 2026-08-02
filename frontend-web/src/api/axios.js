import axios from 'axios';

// Biến cờ kiểm soát hàng đợi tránh xung đột gọi trùng lặp refresh token ngầm
let isRefreshing = false;
let refreshSubscribers = [];

// Đăng ký các request bị 401 chờ Token mới
const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

// Khi có Token mới: Thực thi lại toàn bộ request trong hàng đợi
const onRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(null, token));
    refreshSubscribers = [];
};

// Khi Refresh Token thất bại: Giải phóng hàng đợi và báo lỗi
const onRefreshFailed = (error) => {
    refreshSubscribers.forEach((cb) => cb(error, null));
    refreshSubscribers = [];
};

const createInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true 
    });

    // --- INTERCEPTOR REQUEST: Tự động đồng bộ mã Token mới nhất ---
    instance.interceptors.request.use((config) => {
        let token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    
        if (token) {
            token = token.replace(/^"|"$/g, ''); 
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    // --- INTERCEPTOR RESPONSE: Chống sập chéo khi Promise.all chạy đồng thời ---
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const currentPath = window.location.pathname;

            // 1. Nếu đang ở các trang Login -> Không kích hoạt Refresh Token
            if (currentPath.includes('/login') || currentPath.includes('/signin')) {
                return Promise.reject(error);
            }

            // 2. Xử lý lỗi 401 (Unauthorized)
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true; // Đánh dấu tránh lặp vô tận
                const localRefreshToken = localStorage.getItem("refreshToken");
                
                if (localRefreshToken) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        console.warn(`⚠️ Đang tiến hành gia hạn mã truy cập ngầm qua Gateway...`);

                        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        // Đã cập nhật authUrl theo Gateway chính thức trên Render
                        const authUrl = isLocalHost 
                            ? 'http://localhost:5000/api/v1' 
                            : 'https://api-gateway-vuyo.onrender.com/api/v1';

                        axios.post(`${authUrl}/auth/refresh-token`, { refreshToken: localRefreshToken })
                            .then(refreshResponse => {
                                isRefreshing = false;
                                const newToken = refreshResponse.data.token;
                                
                                if (localStorage.getItem("adminToken")) {
                                    localStorage.setItem("adminToken", newToken);
                                }
                                localStorage.setItem("token", newToken);
                                
                                onRefreshed(newToken);
                            })
                            .catch(refreshError => {
                                isRefreshing = false;
                                console.error("❌ Phiên đăng nhập đã hết hạn hoàn toàn trên hệ thống!");
                                onRefreshFailed(refreshError);
                                
                                // Xóa sạch thông tin phiên cũ
                                localStorage.removeItem("adminToken");
                                localStorage.removeItem("token");
                                localStorage.removeItem("refreshToken");
                                localStorage.removeItem("user");

                                // Redirect thông minh theo Role
                                if (currentPath.startsWith('/admin')) {
                                    window.location.href = "/admin/login";
                                } else {
                                    window.location.href = "/login";
                                }
                            });
                    }

                    // Đưa request bị lỗi vào hàng đợi chờ Token mới
                    return new Promise((resolve, reject) => {
                        subscribeTokenRefresh((err, token) => {
                            if (err) {
                                return reject(err);
                            }
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(instance(originalRequest));
                        });
                    });
                } else {
                    localStorage.clear();
                }
            }

            return Promise.reject(error);
        }
    );
    return instance;
};

// =========================================================================
// QUY TỤ TOÀN BỘ REQUEST VỀ CỔNG GATEWAY
// =========================================================================
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Chỉ để baseURL là domain Gateway (hoặc kèm /api/v1 tùy theo route gateway của bạn)
const gateway = isLocal 
    ? 'http://localhost:5000' 
    : 'https://api-gateway-vuyo.onrender.com';

export const authApi = createInstance(`${gateway}/api/v1`);
export const productApi = createInstance(`${gateway}/api/v1`);
export const cartApi = createInstance(`${gateway}/api/v1`);
export const orderApi = createInstance(`${gateway}/api/v1`);
export const paymentApi = createInstance(`${gateway}/api/v1`);
export const warehouseApi = createInstance(`${gateway}/api/v1`);

export const promotionApi = createInstance(`${gateway}/api/v1/promotions`);
export const couponApi = createInstance(`${gateway}/api/v1/coupons`);

export default authApi;