import axios from 'axios';

// Hàm helper để tạo instance (giúp tái sử dụng logic Interceptor)
const createInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true 
    });

    // Interceptor: Tự động gắn Token
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Interceptor: Xử lý lỗi 401/403
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                if (!window.location.pathname.includes('/login')) {
                    localStorage.clear();
                    window.location.replace('/login');
                }
            }
            return Promise.reject(error);
        }
    );
    return instance;
};

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 1. Export Auth Instance
export const authApi = createInstance(
    isLocal ? 'http://localhost:5001/api' : 'https://authservice-sz4p.onrender.com/api'
);

// 2. Export Product Instance (Của riêng sản phẩm)
export const productApi = createInstance(
    isLocal ? 'http://localhost:5002/api' : 'https://productservice-n87v.onrender.com/api'
);

// Export mặc định để các file cũ không bị lỗi khi import
export default authApi;