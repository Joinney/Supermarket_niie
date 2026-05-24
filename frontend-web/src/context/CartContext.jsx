import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { cartApi } from "../api/axios";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Sử dụng AuthContext để biết chính xác khi nào user đăng nhập/đăng xuất
    const { user } = useContext(AuthContext);

    const formatItem = (item) => ({
        variantId: item.variantId || item.ma_bien_the,
        name: item.name || item.ten_san_pham || "Sản phẩm",
        price: Number(item.price || item.gia_ban_le || 0),
        quantity: Number(item.quantity || 1),
        image: item.image || item.duong_dan_url || "",
        id: item.id || item.ma_san_pham,
        categorySlug: item.categorySlug || item.slug_danh_muc,
        countryCode: item.countryCode || item.country_code
    });

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const res = await cartApi.get("/cart");
                setCart((res.data?.items || []).map(formatItem));
            } else {
                const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
                setCart(local.map(formatItem));
            }
        } catch (err) {
            console.error("Lỗi fetchCart:", err);
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Hàm Hợp nhất giỏ hàng (Khi đăng nhập: merge local + server)
    const mergeCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
        
        if (token && local.length > 0) {
            try {
                console.log("📦 Merging local cart with server...", local);
                // Gửi giỏ hàng local lên server để merge
                await cartApi.post("/cart/merge", { items: local });
                // Xóa giỏ hàng local sau khi merge thành công
                localStorage.removeItem("demi_cart");
                console.log("✅ Local cart merged and cleared");
            } catch (err) {
                console.error("❌ Lỗi merge:", err);
            } finally {
                // Luôn fetch lại từ server để có data mới nhất sau merge
                await fetchCart();
            }
        } else if (token && local.length === 0) {
            // Đã đăng nhập nhưng không có giỏ hàng local
            await fetchCart();
        }
    }, [fetchCart]);

    // 3. Hàm xóa giỏ hàng local (Khi đăng xuất)
    const clearLocalCart = useCallback(() => {
        localStorage.removeItem("demi_cart");
        console.log("🗑️ Local cart cleared on logout");
    }, []);

    // 4. Theo dõi thay đổi trạng thái user để merge hoặc fetch cart
    useEffect(() => {
        if (user) {
            // Có user (đã đăng nhập) -> thực hiện merge cart (hàm mergeCart đã tự lo fetchCart bên trong)
            mergeCart();
        } else {
            // Không có user -> chưa đăng nhập -> tải local cart
            fetchCart();
        }
    }, [user, mergeCart, fetchCart]);

    // 5. Hàm thêm sản phẩm
    const addToCart = useCallback(async (product) => {
        const newItem = formatItem(product);
        const token = localStorage.getItem("token");

        if (!token) {
            // Chưa đăng nhập: Lưu vào localStorage (demi_cart)
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
            const idx = local.findIndex(i => i.variantId === newItem.variantId);
            if (idx > -1) {
                local[idx].quantity += newItem.quantity;
            } else {
                local.push(newItem);
            }
            localStorage.setItem("demi_cart", JSON.stringify(local));
            setCart(local.map(formatItem));
            console.log("📦 Added to local cart (not logged in):", newItem);
        } else {
            // Đã đăng nhập: Lưu lên server
            const res = await cartApi.post("/cart/add", newItem);
            setCart((res.data?.items || []).map(formatItem));
            console.log("📦 Added to server cart (logged in):", newItem);
        }
    }, []);

    // 6. Hàm xóa sản phẩm
    const removeFromCart = useCallback(async (variantId) => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            // Chưa đăng nhập: Xóa từ localStorage
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]").filter(i => i.variantId !== variantId);
            localStorage.setItem("demi_cart", JSON.stringify(local));
            setCart(local.map(formatItem));
            console.log("🗑️ Removed from local cart");
        } else {
            // Đã đăng nhập: Xóa từ server
            await cartApi.delete(`/cart/remove/${variantId}`);
            await fetchCart();
            console.log("🗑️ Removed from server cart");
        }
    }, [fetchCart]);

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, fetchCart, mergeCart, clearLocalCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);