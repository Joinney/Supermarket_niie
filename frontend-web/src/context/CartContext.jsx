import { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
// 🌟 ĐỒNG BỘ: Sử dụng instance cartApi chuyên biệt từ file cấu hình interceptor chung của bạn
import { cartApi } from "../api/axios"; 
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const hasMerged = useRef(false);

    // ✅ HÀM ĐỊNH DẠNG VẬT PHẨM: Giữ lại toàn vẹn ma trận thuộc tính động từ PostgreSQL
    const formatItem = useCallback((item) => {
        if (!item) return null;

        // Phẳng hóa thuộc tính EAV từ PostgreSQL nếu có
        let flattenAttributes = item.thuoc_tinh || {};
        if (Array.isArray(item.thuoc_tinh_hop_nhat)) {
            flattenAttributes = {};
            item.thuoc_tinh_hop_nhat.forEach(a => {
                flattenAttributes[a.ten_thuoc_tinh] = a.gia_tri;
            });
        }

        // Giải quyết tận gốc lỗi không lấy được mã sản phẩm (productId)
        const resolvedProductId = item.productId || item.product_id || item.id || item.ma_san_pham || item.id_san_pham || "";

        return {
            // Đảm bảo cả hai trường này đều nhận giá trị chuẩn để Backend MongoDB không chê
            productId: resolvedProductId,
            id: resolvedProductId, 

            variantId: item.variantId || item.variant_id || item.ma_bien_the,
            name: item.name || item.ten_san_pham || "Sản phẩm",
            variantName: item.variantName || item.ten_bien_the || "",
            price: Number(item.price || item.gia_ban_le || item.gia_khuyen_mai || 0),
            quantity: Number(item.quantity || 1),
            image: item.image || item.duong_dan_url || item.hinh_anh_url || "",
            categorySlug: item.categorySlug || item.slug_danh_muc || "san-pham",
            countryCode: item.countryCode || item.country_code || "vn",
            
            thuoc_tinh_hop_nhat: item.thuoc_tinh_hop_nhat || [],
            thuoc_tinh: flattenAttributes,
            ten_don_vi: item.ten_don_vi || "Gói"
        };
    }, []);

    // ✅ 1. LẤY GIỎ HÀNG TỪ DATABASE (MongoDB + Gộp Postgres)
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
            // 🚀 TỐI ƯU: Gọi qua instance cartApi để tự động nhận diện domain động
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

    // ✅ 2. ĐỒNG BỘ GIỎ HÀNG TỪ LOCALSTORAGE LÊN SERVER KHI ĐĂNG NHẬP
    const mergeCart = useCallback(async () => {
        const token = localStorage.getItem("token");
        const local = JSON.parse(localStorage.getItem("demi_cart") || "[]");
        
        if (token && local.length > 0) {
            try {
                // 🚀 TỐI ƯU: Thay thế url cứng bằng endpoint tương đối của cartApi
                await cartApi.post("/cart/merge", { items: local });
                localStorage.removeItem("demi_cart");
            } catch (err) {
                console.error("❌ Lỗi merge giỏ hàng:", err.response?.data || err.message);
            }
        }
        await fetchCart();
    }, [fetchCart]);

    const clearLocalCart = useCallback(() => {
        localStorage.removeItem("demi_cart");
        hasMerged.current = false;
    }, []);

    // Kiểm soát trạng thái đăng nhập để kích hoạt luồng đồng bộ dữ liệu chuẩn
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

    // ✅ 3. THÊM SẢN PHẨM VÀO GIỎ HÀNG
    const addToCart = useCallback(async (product) => {
        const newItem = formatItem(product);
        if (!newItem || !newItem.variantId) {
            console.error("❌ variantId bị khuyết, không thể đóng gói payload!");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            // --- CHẾ ĐỘ CHƯA ĐĂNG NHẬP (LƯU LOCAL STORAGE) ---
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
            // --- CHẾ ĐỘ ĐÃ ĐĂNG NHẬP (LƯU MONGODB) ---
            try {
                setLoading(true); // Bật loading khóa UI tạm thời

                // 🚀 TỐI ƯU: Đẩy dữ liệu định danh lên MongoDB qua cartApi
                await cartApi.post("/cart/add", newItem);

                console.log("🚀 Đã ghi nhận vào MongoDB, đợi DB ổn định luồng liên dịch vụ...");

                // Vá khoảng delay nhỏ tránh lệch nhịp liên dịch vụ
                await new Promise((resolve) => setTimeout(resolve, 150));

                // Tiến hành fetch lại toàn bộ giỏ hàng full mảng thuộc tính động
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
                // 🚀 TỐI ƯU: Gọi hàm xóa của cartApi với chuỗi template string động sạch sẽ
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
                // 🚀 TỐI ƯU: Dọn sạch giỏ hàng trên DB qua cartApi
                await cartApi.delete('/cart/clear');
            } else {
                localStorage.removeItem("demi_cart");
            }
            setCart([]); 
            console.log("✅ Đã dọn sạch toàn bộ giỏ hàng!");
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
                // 🚀 TỐI ƯU: Gọi API dọn các item đã mua thông qua cartApi
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