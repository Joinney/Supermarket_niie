import axios from 'axios';

const createInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true 
    });

    // --- INTERCEPTOR REQUEST: Gửi kèm token lên nếu có ---
    instance.interceptors.request.use((config) => {
        let token = localStorage.getItem("token");
        if (token) {
            token = token.replace(/^"|"$/g, '');
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 🚀 KHẮC PHỤC LỖI "typer.test is not a function" TẠI ĐÂY:
        if (config.data && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    // --- INTERCEPTOR RESPONSE: Xử lý kết quả và chặn đứng lỗi đá văng ---
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const currentPath = window.location.pathname;

            // 🎯 ĐÁNH CHẶN: Nếu đang đứng ở trang login/signin, KHÔNG ĐƯỢC xóa token
            if (currentPath.includes('/login') || currentPath.includes('/signin')) {
                return Promise.reject(error);
            }

            // Nếu dính lỗi 401 (Hết hạn token)
            if (error.response?.status === 401) {
                console.warn(`⚠️ Phát hiện lỗi 401 tại API: ${baseURL}. Đang xử lý đổi Token ngầm...`);

                const localRefreshToken = localStorage.getItem("refreshToken");
                
                if (localRefreshToken && !originalRequest._retry) {
                    originalRequest._retry = true; 
                    try {
                        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        
                        // 🌟 ĐÃ SỬA: Cập nhật đường dẫn Refresh Token ngầm lên chuẩn v1
                        const authUrl = isLocalHost ? 'http://localhost:5001/api/v1' : 'https://authservice-sz4p.onrender.com/api/v1';
                        
                        // Gọi ngầm sang auth-service để xin cấp lại accessToken mới
                        const refreshResponse = await axios.post(`${authUrl}/auth/refresh-token`, { refreshToken: localRefreshToken });
                        const newToken = refreshResponse.data.token;
                        
                        // Cập nhật lại token mới vào bộ nhớ
                        localStorage.setItem("token", newToken);
                        
                        // Gán token mới vào header và thực thi lại request cũ
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return instance(originalRequest);
                    } catch (refreshError) {
                        console.error("❌ Đổi Token ngầm thất bại. Phiên làm việc đã hết hạn hoàn toàn!");
                        localStorage.removeItem("token");
                        localStorage.removeItem("refreshToken");
                        localStorage.removeItem("user");
                    }
                } else if (!localRefreshToken && (baseURL.includes('authservice') || baseURL.includes('5001'))) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }

                console.log("Giữ lại phiên làm việc, không tự động Logout do lỗi data trống.");
            }

            // Nếu dính lỗi 403 (Bị từ chối quyền truy cập)
            if (error.response?.status === 403) {
                console.warn(`⚠️ Lỗi 403 (Forbidden) tại API: ${baseURL}. Tạm thời bỏ qua không clear token.`);
            }

            return Promise.reject(error);
        }
    );
    return instance;
};

// --- CẤU HÌNH ĐƯỜNG DẪN ĐIỀU HƯỚNG THEO CHUẨN VERSIONING V1 ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Auth Service
export const authApi = createInstance(
    isLocal ? 'http://localhost:5001/api/v1' : 'https://authservice-sz4p.onrender.com/api/v1'
);

// Product Service
export const productApi = createInstance(
    isLocal ? 'http://localhost:5002/api/v1' : 'https://productservice-n87v.onrender.com/api/v1'
);

// Cart Service
export const cartApi = createInstance(
    isLocal ? 'http://localhost:5003/api/v1' : 'https://cartservice-i6s1.onrender.com/api/v1'
);

// Order Service
export const orderApi = createInstance(
    isLocal ? 'http://localhost:5005/api' : 'https://orderservice-n0z1.onrender.com/api'
);
    
// Payment Service (Ruby)
export const paymentApi = createInstance(
    isLocal ? 'http://localhost:5004/api/v1' : 'https://payment-service-opea.onrender.com/api/v1'
);

// Warehouse Service (Go)
export const warehouseApi = createInstance(
    isLocal ? 'http://localhost:5006/api/v1' : 'https://inventory-service-mjzr.onrender.com/api/v1'
);

// Promotion Service (Giữ nguyên hậu tố /promotions để không làm sập các component cũ)
export const promotionApi = createInstance(
    isLocal ? 'http://localhost:5007/api/v1/promotions' : 'https://promotion-service-r5zx.onrender.com/api/v1/promotions'
);

// (Tùy chọn) Khai báo thêm couponApi nếu Frontend của bạn cần xài riêng
export const couponApi = createInstance(
    isLocal ? 'http://localhost:5007/api/v1/coupons' : 'https://promotion-service-r5zx.onrender.com/api/v1/coupons'
);

export default authApi;