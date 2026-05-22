import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001/api'  // Nếu bạn đang ngồi trước máy code
        : 'https://authservice-sz4p.onrender.com/api', // Nếu đã deploy lên Render
    withCredentials: true 
});

/**
 * INTERCEPTOR CHO REQUEST: Gửi Token đi
 */
api.interceptors.request.use((config) => {
    // 1. Lấy token và kiểm tra tính hợp lệ cơ bản (tránh gửi chuỗi "null"/"undefined")
    const token = localStorage.getItem("token");
    
    if (token && token !== "null" && token !== "undefined") {
        config.headers.Authorization = `Bearer ${token}`; 
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * INTERCEPTOR CHO RESPONSE: Xử lý lỗi hệ thống
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response: res } = error;

        // Xử lý dứt điểm lỗi 401 (Unauthorized) và 403 (Forbidden)
        // Trong hệ thống của Demi, 403 thường do Token sai chữ ký (Invalid Signature) hoặc bị can thiệp
        if (res && (res.status === 401 || res.status === 403)) {
            
            // Kiểm tra tránh vòng lặp nếu đang ở trang login
            const isAuthPage = window.location.pathname === '/login' || 
                               window.location.pathname === '/auth-success';
            const isGoogleProcessing = window.location.search.includes("token=");

            if (!isAuthPage && !isGoogleProcessing) {
                console.error(`❌ Lỗi xác thực (${res.status}): Đang tiến hành đăng xuất...`);

                // 1. Xóa sạch dữ liệu trong LocalStorage ngay lập tức
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.clear(); // Xóa sạch mọi rác còn sót lại

                // 2. ÉP TẢI LẠI TRANG HOẶC CHUYỂN HƯỚNG
                // window.location.replace giúp xóa lịch sử chuyển hướng, tránh bấm Back quay lại lỗi
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);

export default api;