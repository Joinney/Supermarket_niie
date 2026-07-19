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
        // Ưu tiên adminToken của trang quản trị trước, nếu không có mới lấy token thường
        let token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    
        if (token) {
            token = token.replace(/^"|"$/g, ''); // Xóa dấu nháy kép thừa nếu có
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

            // Chặn đứng: Đang ở màn hình đăng nhập thì không can thiệp xóa session
            if (currentPath.includes('/login') || currentPath.includes('/signin')) {
                return Promise.reject(error);
            }

            // Xử lý bẫy lỗi 401 Unauthorized
            if (error.response?.status === 401) {
                const localRefreshToken = localStorage.getItem("refreshToken");
                
                if (localRefreshToken) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        console.warn(`⚠️ Đang tiến hành gia hạn mã truy cập ngầm cho mạng lưới dịch vụ...`);

                        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        const authUrl = isLocalHost ? 'http://localhost:5001/api/v1' : 'https://authservice-sz4p.onrender.com/api/v1';

                        axios.post(`${authUrl}/auth/refresh-token`, { refreshToken: localRefreshToken })
                            .then(refreshResponse => {
                                isRefreshing = false;
                                const newToken = refreshResponse.data.token;
                                
                                // Cập nhật lại vào cả 2 vùng nhớ tránh lệch chặng
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

                    // Đồng bộ xếp hàng: Các request 401 chạy sau sẽ đợi request đầu lấy token xong rồi chạy tiếp
                    const retryOriginalRequest = new Promise((resolve) => {
                        subscribeTokenRefresh((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(instance(originalRequest));
                        });
                    });
                    return retryOriginalRequest;
                } else {
                    // Không có cả refreshToken, dọn dẹp sạch sẽ kho nhớ để tránh kẹt trạng thái
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

// --- GIỮ NGUYÊN DANH SÁCH CÁC CỔNG INSTANCE CỦA BẠN ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const authApi = createInstance(isLocal ? 'http://localhost:5001/api/v1' : 'https://authservice-sz4p.onrender.com/api/v1');
export const productApi = createInstance(isLocal ? 'http://localhost:5002/api/v1' : 'https://productservice-n87v.onrender.com/api/v1');
export const cartApi = createInstance(isLocal ? 'http://localhost:5003/api/v1' : 'https://cartservice-i6s1.onrender.com/api/v1');
export const orderApi = createInstance(isLocal ? 'http://localhost:5005/api/v1' : 'https://orderservice-n0z1.onrender.com/api/v1');
export const paymentApi = createInstance(isLocal ? 'http://localhost:5004/api/v1' : 'https://payment-service-opea.onrender.com/api/v1');
export const warehouseApi = createInstance(isLocal ? 'http://localhost:5006/api/v1' : 'https://inventory-service-mjzr.onrender.com/api/v1');
export const promotionApi = createInstance(isLocal ? 'http://localhost:5007/api/v1/promotions' : 'https://promotion-service-r5zx.onrender.com/api/v1/promotions');
export const couponApi = createInstance(isLocal ? 'http://localhost:5007/api/v1/coupons' : 'https://promotion-service-r5zx.onrender.com/api/v1/coupons');

export default authApi;