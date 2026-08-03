import Cart from '../models/Cart.js';
import axios from 'axios';

// =========================================================================
// 1. LẤY CHI TIẾT GIỎ HÀNG KÈM THEO DANH SÁCH MẢNG THUỘC TÍNH EAV CHUẨN
// =========================================================================
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({ userId: req.user.id, items: [] });
    }

    const detailedItemsPromises = cart.items.map(async (item) => {
      const itemObj = item.toObject();
      
      try {
        const response = await axios.get(`http://localhost:5002/api/v1/products/variants/${item.variantId}`);
        
        if (response.data) {
          const vData = response.data;
          
          return {
            ...itemObj,
            productId: vData.ma_san_pham || itemObj.productId || "",
            sku: vData.sku || itemObj.sku || item.variantId, 
            price: Number(vData.gia_ban_le) || itemObj.price || 0, 
            
            // 🌟 ĐÃ BỔ SUNG STOCK: Luôn ưu tiên lấy tồn kho thực tế nóng hổi từ Product Service
            stock: Number(vData.so_luong_ton ?? itemObj.stock ?? 9999),

            variantName: vData.ten_bien_the || itemObj.variantName || "",
            image: vData.hinh_anh_url || vData.duong_dan_url || itemObj.image || "",
            thuoc_tinh_hop_nhat: vData.thuoc_tinh_hop_nhat?.length > 0 ? vData.thuoc_tinh_hop_nhat : (itemObj.thuoc_tinh_hop_nhat || []),
            ten_don_vi: vData.ten_don_vi || itemObj.ten_don_vi || "Gói"
          };
        }
      } catch (apiError) {
        console.warn(`⚠️ [Inter-Service Connection Refused] Mã biến thể: ${item.variantId}`);
      }
      
      return { ...itemObj, thuoc_tinh_hop_nhat: itemObj.thuoc_tinh_hop_nhat || [], ten_don_vi: itemObj.ten_don_vi || "Gói" };
    });

    const finalItems = await Promise.all(detailedItemsPromises);

    res.status(200).json({
      userId: cart.userId,
      items: finalItems
    });

  } catch (error) {
    console.error("🔥 Lỗi tại getCart Backend:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG (LƯU TRỰC TIẾP EAV VÀO MONGO)
// =========================================================================
export const addToCart = async (req, res) => {
  const { 
    variantId, 
    sku, 
    name, 
    variantName, 
    price, 
    quantity, 
    image, 
    productId, 
    countryCode, 
    categorySlug,
    ten_don_vi,          
    thuoc_tinh_hop_nhat,
    stock // 🌟 ĐÃ BỔ SUNG STOCK: Hứng dữ liệu tồn kho từ Frontend gửi lên
  } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });
    
    const idx = cart.items.findIndex(i => i.variantId === variantId);
    if (idx > -1) {
      cart.items[idx].quantity += Number(quantity);
      if (sku) cart.items[idx].sku = sku; 
      if (price) cart.items[idx].price = price;
      if (image) cart.items[idx].image = image;
      if (variantName) cart.items[idx].variantName = variantName;
      if (ten_don_vi) cart.items[idx].ten_don_vi = ten_don_vi;
      if (thuoc_tinh_hop_nhat) cart.items[idx].thuoc_tinh_hop_nhat = thuoc_tinh_hop_nhat;
      // 🌟 ĐÃ BỔ SUNG STOCK: Cập nhật lại tồn kho nếu đã có trong giỏ
      if (stock !== undefined) cart.items[idx].stock = stock;
    } else {
      cart.items.push({ 
        variantId, 
        sku: sku || '', 
        name, 
        variantName: variantName || '', 
        price, 
        quantity, 
        image, 
        productId, 
        countryCode, 
        categorySlug,
        ten_don_vi: ten_don_vi || 'Gói',               
        thuoc_tinh_hop_nhat: thuoc_tinh_hop_nhat || [],
        stock: stock || 9999 // 🌟 ĐÃ BỔ SUNG STOCK: Lưu tồn kho lúc thêm mới
      });
    }
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 3. ĐỒNG BỘ/MERGE GIỎ HÀNG TỪ LOCALSTORAGE VÀO DATABASE
// =========================================================================
export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    items.forEach(newItem => {
      const existing = cart.items.find(i => i.variantId === newItem.variantId);
      if (existing) {
        existing.quantity = Number(existing.quantity) + Number(newItem.quantity);
        if (newItem.sku) existing.sku = newItem.sku; 
        if (newItem.variantName) existing.variantName = newItem.variantName;
        if (newItem.ten_don_vi) existing.ten_don_vi = newItem.ten_don_vi;
        if (newItem.thuoc_tinh_hop_nhat) existing.thuoc_tinh_hop_nhat = newItem.thuoc_tinh_hop_nhat;
        // 🌟 ĐÃ BỔ SUNG STOCK
        if (newItem.stock !== undefined) existing.stock = newItem.stock;
      } else {
        cart.items.push({
          variantId: newItem.variantId,
          sku: newItem.sku || '', 
          productId: newItem.productId || '',
          name: newItem.name,
          variantName: newItem.variantName || '', 
          image: newItem.image || '',
          price: newItem.price,
          quantity: newItem.quantity,
          categorySlug: newItem.categorySlug || 'san-pham',
          countryCode: newItem.countryCode || 'vn',
          ten_don_vi: newItem.ten_don_vi || 'Gói',                
          thuoc_tinh_hop_nhat: newItem.thuoc_tinh_hop_nhat || [],
          stock: newItem.stock || 9999 // 🌟 ĐÃ BỔ SUNG STOCK
        });
      }
    });
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 4. XÓA MỘT BIẾN THỂ KHỎI GIỎ HÀNG
// =========================================================================
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params; 
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    
    cart.items = cart.items.filter(item => item.variantId !== productId);
    await cart.save();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 5. XÓA CHỌN LỌC CÁC BIẾN THỂ ĐÃ THANH TOÁN
// =========================================================================
export const removeSelectedFromCart = async (req, res) => {
  try {
    const { variant_ids } = req.body;

    if (!variant_ids || !Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Mảng variant_ids trống hoặc không hợp lệ!" });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $pull: { 
          items: { 
            $or: [
              { variantId: { $in: variant_ids } },
              { variant_id: { $in: variant_ids } }
            ]
          } 
        } 
      },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng của người dùng!" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Đã dọn dẹp các sản phẩm đã thanh toán thành công!",
      cart 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 6. UPLOAD ẢNH MINH CHỨNG THANH TOÁN
// =========================================================================
export const uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn hình ảnh minh chứng giao dịch." });
    }
    const proofUrl = req.file.path;
    res.status(200).json({ 
      success: true, 
      message: "Tải lên ảnh minh chứng thành công! Đang chờ Admin xác nhận.", 
      paymentProofUrl: proofUrl 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải ảnh." });
  }
};

// =========================================================================
// 7. LẤY GIỎ HÀNG THEO USER ID (DANH CHO TRANG QUẢN TRỊ ADMIN VIEW)
// =========================================================================
export const getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId: userId });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({ userId: userId, items: [] });
    }

    const detailedItemsPromises = cart.items.map(async (item) => {
      const itemObj = item.toObject();
      
      try {
        const response = await axios.get(`http://localhost:5002/api/v1/products/variants/${item.variantId}`);
        if (response.data) {
          const vData = response.data;
          return {
            ...itemObj,
            productId: vData.ma_san_pham || itemObj.productId || "",
            sku: vData.sku || itemObj.sku || item.variantId,
            price: Number(vData.gia_ban_le) || itemObj.price || 0, 

            // 🌟 ĐÃ BỔ SUNG STOCK:
            stock: Number(vData.so_luong_ton ?? itemObj.stock ?? 9999),

            variantName: vData.ten_bien_the || itemObj.variantName || "",
            image: vData.hinh_anh_url || vData.duong_dan_url || itemObj.image || "",
            thuoc_tinh_hop_nhat: vData.thuoc_tinh_hop_nhat?.length > 0 ? vData.thuoc_tinh_hop_nhat : (itemObj.thuoc_tinh_hop_nhat || []),
            ten_don_vi: vData.ten_don_vi || itemObj.ten_don_vi || "Gói"
          };
        }
      } catch (apiError) {
        console.warn(`⚠️ [Admin View - Connection Refused] Mã biến thể: ${item.variantId}`);
      }
      
      return { ...itemObj, thuoc_tinh_hop_nhat: itemObj.thuoc_tinh_hop_nhat || [], ten_don_vi: itemObj.ten_don_vi || "Gói" };
    });

    const finalItems = await Promise.all(detailedItemsPromises);

    res.status(200).json({
      userId: cart.userId,
      items: finalItems
    });

  } catch (error) {
    console.error("🔥 Lỗi tại getCartByUserId Backend:", error.message);
    res.status(500).json({ message: error.message });
  }
};