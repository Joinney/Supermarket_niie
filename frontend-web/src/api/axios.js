import axios from 'axios';

const createInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        withCredentials: true 
    });

    instance.interceptors.request.use((config) => {
        let token = localStorage.getItem("token");
        if (token) {
            token = token.replace(/^"|"$/g, '');
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401 || error.response?.status === 403) {
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

export const authApi = createInstance(
    isLocal ? 'http://localhost:5001/api' : 'https://authservice-sz4p.onrender.com/api'
);

export const productApi = createInstance(
    isLocal ? 'http://localhost:5002/api' : 'https://productservice-n87v.onrender.com/api'
);

// Đặt baseURL là /api, khi gọi fetchCart() dùng "/cart" là chuẩn nhất
export const cartApi = createInstance(
    isLocal ? 'http://localhost:5003/api' : 'https://cartservice-i6s1.onrender.com/api'
);

export default authApi;