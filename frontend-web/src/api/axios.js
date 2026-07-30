import axios from 'axios';

// Biến cờ kiểm soát hàng đợi tránh xung đột gọi trùng lặp refresh token ngầm
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
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

            if (currentPath.includes('/login') || currentPath.includes('/signin')) {
                return Promise.reject(error);
            }

            if (error.response?.status === 401) {
                const localRefreshToken = localStorage.getItem("refreshToken");
                
                if (localRefreshToken) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        console.warn(`⚠️ Đang tiến hành gia hạn mã truy cập ngầm cho mạng lưới dịch vụ...`);

                        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        
                        // 🌟 ĐÃ SỬA LẠI: Trỏ thẳng về Gateway 5000 giống hệt cấu hình bên dưới
                        const authUrl = isLocalHost ? 'http://localhost:5000/api/v1' : 'https://authservice-sz4p.onrender.com/api/v1';

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
                                console.error("❌ Phiên đăng nhập Admin đã hết hạn hoàn toàn trên hệ thống!");
                                localStorage.removeItem("adminToken");
                                localStorage.removeItem("token");
                                localStorage.removeItem("refreshToken");
                                localStorage.removeItem("user");
                                window.location.href = "/admin/login";
                            });
                    }

                    const retryOriginalRequest = new Promise((resolve) => {
                        subscribeTokenRefresh((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(instance(originalRequest));
                        });
                    });
                    return retryOriginalRequest;
                } else {
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }
            }

            return Promise.reject(error);
        }
    );
    return instance;
};

// =========================================================================
// QUY TỤ TOÀN BỘ REQUEST VỀ CỔNG GATEWAY (5000)
// =========================================================================
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const gateway = 'http://localhost:5000/api/v1';

export const authApi = createInstance(isLocal ? gateway : 'https://authservice-sz4p.onrender.com/api/v1');
export const productApi = createInstance(isLocal ? gateway : 'https://productservice-n87v.onrender.com/api/v1');
export const cartApi = createInstance(isLocal ? gateway : 'https://cartservice-i6s1.onrender.com/api/v1');
export const orderApi = createInstance(isLocal ? gateway : 'https://orderservice-n0z1.onrender.com/api/v1');
export const paymentApi = createInstance(isLocal ? gateway : 'https://payment-service-opea.onrender.com/api/v1');
export const warehouseApi = createInstance(isLocal ? gateway : 'https://inventory-service-mjzr.onrender.com/api/v1');

export const promotionApi = createInstance(isLocal ? `${gateway}/promotions` : 'https://promotion-service-r5zx.onrender.com/api/v1/promotions');
export const couponApi = createInstance(isLocal ? `${gateway}/coupons` : 'https://promotion-service-r5zx.onrender.com/api/v1/coupons');
 
export default authApi;