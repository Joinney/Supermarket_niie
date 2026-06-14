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
        return config;
    });

    // --- INTERCEPTOR RESPONSE: Xử lý kết quả và chặn đứng lỗi đá văng ---
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            const currentPath = window.location.pathname;

            // 🎯 ĐÁNH CHẶN: Nếu đang đứng ở trang login/signin hoặc vừa bấm nút Đăng nhập thành công,
            // dứt khoát KHÔNG ĐƯỢC PHÉP chạy hàm xóa token (localStorage.clear).
            if (currentPath.includes('/login') || currentPath.includes('/signin')) {
                return Promise.reject(error);
            }

            // Nếu dính lỗi 401 (Hết hạn token hoặc lỗi xác thực ngầm ở các service phụ)
            if (error.response?.status === 401) {
                console.warn(`⚠️ Phát hiện lỗi 401 tại API: ${baseURL}. Đang xử lý đổi Token ngầm...`);

                // Kiểm tra xem có refreshToken dự phòng trong localStorage để cứu phiên không
                const localRefreshToken = localStorage.getItem("refreshToken");
                
                if (localRefreshToken && !originalRequest._retry) {
                    originalRequest._retry = true; // Đánh dấu đã thử lại một lần
                    try {
                        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                        const authUrl = isLocalHost ? 'http://localhost:5001/api' : 'https://authservice-sz4p.onrender.com/api';
                        
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
                        // Xóa sạch dữ liệu lỗi thời để Header không bị kẹt tài khoản
                        localStorage.removeItem("token");
                        localStorage.removeItem("refreshToken");
                        localStorage.removeItem("user");
                    }
                } else if (!localRefreshToken && (baseURL.includes('authservice') || baseURL.includes('5001'))) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }

                // 🎯 THAY ĐỔI QUAN TRỌNG: Nếu các service khác (Cart, Product) báo lỗi 401 do mất database local,
                // chỉ ghi nhận log chứ không tự ý xóa sạch token và đá Demi ra ngoài nữa.
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

// --- GIỮ NGUYÊN CẤU HÌNH ĐƯỜNG DẪN ĐIỀU HƯỚNG CỦA BẠN ---
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

export const orderApi = createInstance(
    isLocal ? 'http://localhost:5005/api' : 'https://orderservice-url.onrender.com/api'
);

export default authApi;