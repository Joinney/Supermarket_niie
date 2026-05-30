import { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import { cartApi } from "../api/axios";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const hasMerged = useRef(false);

    const formatItem = (item) => ({
        variantId: item.variantId || item.variant_id || item.ma_bien_the,
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

    const mergeCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
        
        if (token && local.length > 0) {
            try {
                await cartApi.post("/cart/merge", { items: local });
                localStorage.removeItem("demi_cart");
            } catch (err) {
                console.error("❌ Lỗi merge:", err.response?.data || err.message);
            }
        }
        await fetchCart();
    }, [fetchCart]);

    const clearLocalCart = useCallback(() => {
        localStorage.removeItem("demi_cart");
        hasMerged.current = false;
    }, []);

    useEffect(() => {
        if (user) {
            if (!hasMerged.current) {
                hasMerged.current = true;
                mergeCart();
            }
        } else {
            hasMerged.current = false;
            fetchCart();
        }
    }, [user, mergeCart, fetchCart]);

    const addToCart = useCallback(async (product) => {
        const newItem = formatItem(product);
        const token = localStorage.getItem("token");

        if (!token) {
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
            const idx = local.findIndex(i => i.variantId === newItem.variantId);
            if (idx > -1) {
                local[idx].quantity += newItem.quantity;
            } else {
                local.push(newItem);
            }
            localStorage.setItem("demi_cart", JSON.stringify(local));
            setCart(local.map(formatItem));
        } else {
            const res = await cartApi.post("/cart/add", newItem);
            setCart((res.data?.items || []).map(formatItem));
        }
    }, []);

    const removeFromCart = useCallback(async (variantId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]").filter(i => i.variantId !== variantId);
            localStorage.setItem("demi_cart", JSON.stringify(local));
            setCart(local.map(formatItem));
        } else {
            await cartApi.delete(`/cart/remove/${variantId}`);
            await fetchCart();
        }
    }, [fetchCart]);

    const clearCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            if (token) {
                await cartApi.delete('/cart/clear');
            } else {
                localStorage.removeItem("demi_cart");
            }
            setCart([]); 
            console.log("✅ Đã dọn sạch toàn bộ giỏ hàng!");
        } catch (err) {
            console.error("Lỗi xóa giỏ hàng:", err);
        }
    }, []);

    const clearPurchasedItems = useCallback(async (boughtVariantIds) => {
        if (!boughtVariantIds || boughtVariantIds.length === 0) return;
        
        const token = localStorage.getItem("token");
        try {
            if (token) {
                await cartApi.post('/cart/remove-selected', { variant_ids: boughtVariantIds });
                await fetchCart();
            } else {
                const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
                const remainingItems = local.filter(item => !boughtVariantIds.includes(item.variantId || item.variant_id));
                localStorage.setItem("demi_cart", JSON.stringify(remainingItems));
                setCart(remainingItems.map(formatItem));
            }
            console.log("✅ Đã lọc bỏ các sản phẩm đã mua khỏi giỏ hàng!");
        } catch (err) {
            console.error("Lỗi khi loại bỏ sản phẩm đã mua:", err);
            setCart(prev => prev.filter(item => !boughtVariantIds.includes(item.variantId || item.variant_id)));
        }
    }, [fetchCart]);

    return (
        <CartContext.Provider value={{ 
            cart, loading, addToCart, removeFromCart, fetchCart, mergeCart, clearLocalCart, clearCart, clearPurchasedItems
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);