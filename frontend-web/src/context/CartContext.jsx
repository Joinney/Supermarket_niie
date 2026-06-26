import { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import axios from "axios"; // Đấu nối trực tiếp để kiểm soát Header Authorization
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

        // 🚀 BẮT TRIỆT ĐỂ: Giải quyết tận gốc lỗi không lấy được mã sản phẩm (productId)
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
            // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn
            const res = await axios.get("http://localhost:5003/api/cart", {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                withCredentials: true
            });
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
                // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn
                await axios.post(
                    "http://localhost:5003/api/cart/merge", 
                    { items: local },
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        withCredentials: true
                    }
                );
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

    // ✅ 3. THÊM SẢN PHẨM VÀO GIỎ HÀNG (Sửa liên kết HTTP Post + Vá CORS)
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

                // 1. Đẩy dữ liệu định danh lên MongoDB
                // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn với withCredentials
                await axios.post(
                    "http://localhost:5003/api/cart/add", 
                    newItem, 
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        withCredentials: true
                    }
                );

                console.log("🚀 Đã ghi nhận vào MongoDB, đợi DB ổn định luồng liên dịch vụ...");

                // 2. Vá khoảng delay nhỏ tránh lệch nhịp liên dịch vụ
                await new Promise((resolve) => setTimeout(resolve, 150));

                // 3. Tiến hành fetch lại toàn bộ giỏ hàng full mảng thuộc tính động
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
                // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn
                await axios.delete(`http://localhost:5003/api/cart/remove/${variantId}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                });
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
                // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn
                await axios.delete('http://localhost:5003/api/cart/clear', {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                });
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
                // ✅ ĐÃ SỬA: Thêm cấu hình CORS an toàn
                await axios.post(
                    'http://localhost:5003/api/cart/remove-selected', 
                    { variant_ids: boughtVariantIds },
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        withCredentials: true
                    }
                );
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