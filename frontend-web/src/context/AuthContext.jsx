import { createContext, useState, useEffect, useCallback, useMemo } from "react";
// Đảm bảo trỏ đúng file instance Axios có chứa authApi mà bạn đã sửa ở các bước trước
import authApi from "../api/axios"; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (savedUser && token) {
            try { return JSON.parse(savedUser); } catch (e) { return null; }
        }
        return null;
    });

    const [loading, setLoading] = useState(true);
    const [authActionLoading, setAuthActionLoading] = useState(false);

    // --- HÀM CẬP NHẬT USER (Đồng bộ State và Bộ nhớ đệm) ---
    const updateUser = useCallback((userData) => {
        if (!userData) {
            setUser(null);
            localStorage.removeItem("user");
        } else {
            setUser(prev => {
                const updated = { ...prev, ...userData };
                localStorage.setItem("user", JSON.stringify(updated));
                return updated;
            });
        }
    }, []);

    // --- HÀM LẤY PROFILE MỚI NHẤT TỪ SERVER ---
    const fetchFreshProfile = useCallback(async () => {
        try {
            const res = await authApi.get("/profile/hoso");
            if (res.data && res.data.success) {
                updateUser(res.data.data);
                return res.data.data;
            }
        } catch (error) {
            console.error("❌ Lỗi Fetch Profile:", error.response?.data?.message || error.message);
            return null;
        }
    }, [updateUser]);

    // --- HÀM KIỂM TRA PHIÊN KHUẨN BÁO (F5 HOẶC GOOGLE CALLBACK) ---
    const checkAuth = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("token");
        const userFromUrl = params.get("user");
        const refreshTokenFromUrl = params.get("refreshToken");

        try {
            // --- 1. XỬ LÝ GOOGLE AUTH CALLBACK ---
            if (tokenFromUrl && userFromUrl) {
                const userData = JSON.parse(decodeURIComponent(userFromUrl));
                
                localStorage.setItem("token", tokenFromUrl);
                if (refreshTokenFromUrl) {
                    localStorage.setItem("refreshToken", refreshTokenFromUrl);
                }
                
                authApi.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
                updateUser(userData);

                // Dọn sạch URL băm bảo mật
                window.history.replaceState({}, document.title, window.location.pathname);
                setLoading(false);
                
                // Lấy thông tin chi tiết ngầm sau khi giao diện đã dựng xong
                fetchFreshProfile();
                return;
            }

            // --- 2. GIỮ ĐĂNG NHẬP KHI F5 TRANG ---
            const token = localStorage.getItem("token");
            if (token) {
                authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setLoading(false); // Cho hiện giao diện ngay để tránh nghẽn
                fetchFreshProfile(); // Đồng bộ dữ liệu mới nhất ngầm sau
            } else {
                updateUser(null);
                setLoading(false);
            }
        } catch (e) {
            console.error("❌ Lỗi khởi tạo phiên xác thực:", e);
            setLoading(false);
        }
    }, [fetchFreshProfile, updateUser]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // --- HÀM ĐĂNG NHẬP (LOGIN) THỦ CÔNG ---
    const login = async (username, password) => {
        setAuthActionLoading(true);
        try {
            console.log("🔐 [AUTH] Bắt đầu kích hoạt tiến trình đăng nhập...");
            const res = await authApi.post("/auth/signin", { username, password });
            const { user: userData, token, refreshToken: refreshTok } = res.data;
            
            if (token) {
                // 🎯 ĐỒNG BỘ LƯU TRỮ VÀO BỘ NHỚ TRƯỚC KHI SET STATE ĐỂ TRÁNH BỊ TRANZITION TRANG LÀM GÃY PHIÊN
                localStorage.setItem("token", token);
                if (refreshTok) {
                    localStorage.setItem("refreshToken", refreshTok);
                }
                authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Cập nhật state cục bộ để hoàn tất thủ tục
                updateUser(userData);
                
                console.log("✅ [AUTH] Lưu thông tin phiên đăng nhập thành công!");
                return { success: true };
            }
            return { success: false, message: "Server không phản hồi mã Token truy cập!" };
        } catch (error) {
            console.error("❌ [AUTH] Lỗi Đăng nhập thất bại:", error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || "Mật khẩu sai hoặc tài khoản không tồn tại!" };
        } finally {
            setAuthActionLoading(false);
        }
    };

    // --- HÀM ĐĂNG XUẤT (LOGOUT) ---
    const logout = useCallback(async () => {
        try {
            await authApi.post("/auth/logout").catch(() => {}); 
        } finally {
            updateUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("demi_cart"); 
            delete authApi.defaults.headers.common['Authorization'];
            window.location.href = "/login"; // Làm sạch hoàn toàn trạng thái ứng dụng
        }
    }, [updateUser]);

    const authValue = useMemo(() => ({
        user, updateUser, fetchFreshProfile, login, logout, loading, authActionLoading
    }), [user, updateUser, fetchFreshProfile, logout, loading, authActionLoading]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};