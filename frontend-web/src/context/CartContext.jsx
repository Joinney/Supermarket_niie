import { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import { cartApi } from "../api/axios"; 
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const isMerging = useRef(false); // Cờ chặn gửi request song song

    // ✅ HÀM ĐỊNH DẠNG VẬT PHẨM
    const formatItem = useCallback((item) => {
        if (!item) return null;

        let flattenAttributes = item.thuoc_tinh || {};
        if (Array.isArray(item.thuoc_tinh_hop_nhat)) {
            flattenAttributes = {};
            item.thuoc_tinh_hop_nhat.forEach(a => {
                flattenAttributes[a.ten_thuoc_tinh] = a.gia_tri;
            });
        }

        const resolvedProductId = item.productId || item.product_id || item.id || item.ma_san_pham || item.id_san_pham || "";

        return {
            productId: resolvedProductId,
            id: resolvedProductId, 
            variantId: item.variantId || item.variant_id || item.ma_bien_the,
            sku: item.sku || item.ma_sku || item.variantId || item.variant_id || "", 
            name: item.name || item.ten_san_pham || "Sản phẩm",
            variantName: item.variantName || item.ten_bien_the || "",
            price: Number(item.price || item.gia_ban_le || item.gia_khuyen_mai || 0),
            quantity: Number(item.quantity || 1),
            stock: Number(item.stock ?? item.so_luong_ton ?? item.so_luong_thuc_te ?? 9999),
            image: item.image || item.duong_dan_url || item.hinh_anh_url || "",
            categorySlug: item.categorySlug || item.slug_danh_muc || "san-pham",
            countryCode: item.countryCode || item.country_code || "vn",
            thuoc_tinh_hop_nhat: item.thuoc_tinh_hop_nhat || [],
            thuoc_tinh: flattenAttributes,
            ten_don_vi: item.ten_don_vi || "Gói"
        };
    }, []);

    // ✅ 1. LẤY GIỎ HÀNG TỪ DATABASE HOẶC LOCALSTORAGE
    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
            setCart(local.map(formatItem));
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await cartApi.get("/cart");
            const backendItems = res.data?.items || res.data || [];
            setCart((Array.isArray(backendItems) ? backendItems : []).map(formatItem));
        } catch (err) {
            console.error("❌ Lỗi fetchCart từ Backend:", err.response?.data || err.message);
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, [formatItem]);

    // ✅ 2. ĐỒNG BỘ GIỎ HÀNG (SỬA LỖI RACE CONDITION)
    const mergeCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
        
        // Nếu không có token, không có đồ local hoặc đang trong tiến trình merge -> HỦY BỎ
        if (!token || local.length === 0 || isMerging.current) {
            await fetchCart();
            return;
        }

        isMerging.current = true; // Bật cờ khóa
        setLoading(true);

        try {
            // 🌟 CHẬN ĐỨNG TRÙNG LẶP: Xóa LocalStorage NGAY TRƯỚC KHI BẮN API
            localStorage.removeItem("demi_cart");

            const response = await cartApi.post("/cart/merge", { items: local });
            
            // Nếu Backend trả về giỏ hàng mới sau khi merge, set trực tiếp vào State
            const mergedItems = response.data?.items || response.data || [];
            if (Array.isArray(mergedItems) && mergedItems.length > 0) {
                setCart(mergedItems.map(formatItem));
            } else {
                await fetchCart();
            }
        } catch (err) {
            console.error("❌ Lỗi merge giỏ hàng:", err.response?.data || err.message);
            await fetchCart();
        } finally {
            isMerging.current = false; // Mở khóa
            setLoading(false);
        }
    }, [fetchCart, formatItem]);

    const clearLocalCart = useCallback(() => {
        localStorage.removeItem("demi_cart");
        isMerging.current = false;
    }, []);

    // 🌟 ĐỒNG BỘ LUỒNG USER
    useEffect(() => {
        if (user) {
            mergeCart();
        } else {
            isMerging.current = false;
            fetchCart();
        }
    }, [user]); // Chỉ cần lắng nghe `user` để tránh trigger vòng lặp vô tận

    // ✅ 3. THÊM SẢN PHẨM VÀO GIỎ HÀNG
    const addToCart = useCallback(async (product) => {
        const newItem = formatItem(product);
        if (!newItem || !newItem.variantId) {
            console.error("❌ variantId bị khuyết, không thể đóng gói payload!");
            return;
        }

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
            try {
                setLoading(true);
                await cartApi.post("/cart/add", newItem);
                await fetchCart();
            } catch (err) {
                console.error("❌ Lỗi lưu giỏ hàng vào MongoDB:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        }
    }, [formatItem, fetchCart]);

    // ✅ 4. XÓA MỘT BIẾN THỂ KHỎI GIỎ HÀNG
    const removeFromCart = useCallback(async (variantId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            const local = JSON.parse(localStorage.getItem("demi_cart") || "[]").filter(i => i.variantId !== variantId);
            localStorage.setItem("demi_cart", JSON.stringify(local));
            setCart(local.map(formatItem));
        } else {
            try {
                await cartApi.delete(`/cart/remove/${variantId}`);
                await fetchCart();
            } catch (err) {
                console.error("❌ Lỗi khi xóa item khỏi giỏ hàng:", err.response?.data || err.message);
            }
        }
    }, [fetchCart, formatItem]);

    // ✅ 5. DỌN SẠCH TOÀN BỘ GIỎ HÀNG
    const clearCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            if (token) {
                await cartApi.delete('/cart/clear');
            } else {
                localStorage.removeItem("demi_cart");
            }
            setCart([]); 
        } catch (err) {
            console.error("Lỗi xóa giỏ hàng:", err.response?.data || err.message);
        }
    }, []);

    // ✅ 6. LỌC BỎ CÁC BIẾN THỂ ĐÃ ĐẶT HÀNG THÀNH CÔNG
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
        } catch (err) {
            console.error("Lỗi khi loại bỏ sản phẩm đã mua:", err.response?.data || err.message);
            setCart(prev => prev.filter(item => !boughtVariantIds.includes(item.variantId || item.variant_id)));
        }
    }, [fetchCart, formatItem]);

    return (
        <CartContext.Provider value={{ 
            cart, loading, addToCart, removeFromCart, fetchCart, mergeCart, clearLocalCart, clearCart, clearPurchasedItems
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);