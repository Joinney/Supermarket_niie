import axios from 'axios';

// 1. Hàm khởi tạo dùng chung để tránh viết lặp lại Interceptor
const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true 
    });

    // Interceptor: Tự động gắn token vào header
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => Promise.reject(error));

    // Interceptor: Xử lý lỗi 401/403 (Đăng xuất khi hết phiên)
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const { response: res } = error;
            if (res && (res.status === 401 || res.status === 403)) {
                const isAuthPage = window.location.pathname.includes('/login');
                const isGoogleProcessing = window.location.search.includes("token=");
                
                if (!isAuthPage && !isGoogleProcessing) {
                    localStorage.clear();
                    window.location.replace('/login');
                }
            }
            return Promise.reject(error);
        }
    );
    return instance;
};

// 2. Khởi tạo các instance
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const authApi = createApiInstance(
    isLocal ? 'http://localhost:5001/api' : 'https://authservice-sz4p.onrender.com/api'
);

export const productApi = createApiInstance(
    isLocal ? 'http://localhost:5002/api' : 'https://productservice-n87v.onrender.com/api'
);

// Export mặc định là authApi để tương thích với code cũ
export default authApi;