import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/axios";

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

    // --- HÀM CẬP NHẬT USER (Dùng chung cho toàn app) ---
    const updateUser = useCallback((userData) => {
        if (!userData) {
            setUser(null);
            localStorage.removeItem("user");
        } else {
            setUser(prev => ({ ...prev, ...userData }));
            const currentSaved = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentSaved, ...userData }));
        }
    }, []);

    // --- HÀM LẤY PROFILE MỚI NHẤT TỪ SERVER ---
    const fetchFreshProfile = useCallback(async () => {
        try {
            const res = await api.get("/profile/hoso");
            if (res.data.success) {
                updateUser(res.data.data);
            }
        } catch (error) {
            console.error("❌ Lỗi Fetch Profile:", error);
            // Nếu lỗi 401/403 ở đây thì thường interceptor đã xử lý logout
        }
    }, [updateUser]);

    const checkAuth = useCallback(async () => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("token");
        const userFromUrl = params.get("user");

        try {
            // --- 1. XỬ LÝ GOOGLE AUTH (Nếu có params trên URL) ---
            if (tokenFromUrl && userFromUrl) {
                const userData = JSON.parse(decodeURIComponent(userFromUrl));
                
                localStorage.setItem("token", tokenFromUrl);
                api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
                
                updateUser(userData);

                // Lấy profile đầy đủ ngay lập tức
                await fetchFreshProfile();

                // Dọn dẹp URL sạch sẽ
                window.history.replaceState({}, document.title, window.location.pathname);
                setLoading(false);
                return;
            }

            // --- 2. GIỮ ĐĂNG NHẬP KHI F5 ---
            const token = localStorage.getItem("token");
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                // Gọi fetch để đồng bộ dữ liệu mới nhất (ví dụ avatar vừa đổi)
                await fetchFreshProfile();
            } else {
                updateUser(null);
            }
        } catch (e) {
            console.error("❌ Lỗi xác thực:", e);
        } finally {
            setLoading(false);
        }
    }, [fetchFreshProfile, updateUser]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (username, password) => {
        setAuthActionLoading(true);
        try {
            const res = await api.post("/auth/signin", { username, password });
            const { user: userData, token } = res.data;
            
            if (token) {
                localStorage.setItem("token", token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                updateUser(userData);
                await fetchFreshProfile(); // Đồng bộ profile đầy đủ
                return { success: true };
            }
            return { success: false, message: "Không nhận được token!" };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Lỗi đăng nhập!" };
        } finally {
            setAuthActionLoading(false);
        }
    };

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout").catch(() => {}); 
        } finally {
            updateUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("demi_cart"); // ✅ Xóa giỏ hàng local khi đăng xuất
            delete api.defaults.headers.common['Authorization'];
            window.location.href = "/login"; // Dùng href để reset toàn bộ state app cho sạch
        }
    }, [updateUser]);

    // Dùng useMemo để tránh re-render provider không cần thiết
    const authValue = useMemo(() => ({
        user, updateUser, fetchFreshProfile, login, logout, loading, authActionLoading
    }), [user, updateUser, fetchFreshProfile, logout, loading, authActionLoading]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};