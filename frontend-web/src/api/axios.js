import axios from 'axios';

// 1. Tự động lấy URL từ biến môi trường (đã set trong tab Environment của Render)
// Nếu chạy local, nó tự fallback về localhost để bạn không phải sửa code
const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5001';
const PRODUCT_URL = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:5002';

// 2. Hàm tạo Instance (Giúp tái sử dụng logic Interceptor)
const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true
    });

    // Interceptor: Gửi Token đi an toàn
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => Promise.reject(error));

    // Interceptor: Xử lý lỗi xác thực (401/403)
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const { response: res } = error;
            if (res && (res.status === 401 || res.status === 403)) {
                // Kiểm tra tránh vòng lặp đăng nhập
                const isAuthPage = window.location.pathname.includes('/login');
                const isGoogleProcessing = window.location.search.includes("token=");

                if (!isAuthPage && !isGoogleProcessing) {
                    console.error(`❌ Lỗi (${res.status}): Đăng xuất...`);
                    localStorage.clear();
                    window.location.replace('/login');
                }
            }
            return Promise.reject(error);
        }
    );
    return instance;
};

// 3. Export các API riêng biệt
export const authApi = createApiInstance(AUTH_URL);
export const productApi = createApiInstance(PRODUCT_URL);