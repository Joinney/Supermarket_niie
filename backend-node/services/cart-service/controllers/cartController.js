import Cart from '../models/Cart.js';

// =========================================================================
// 1. LẤY CHI TIẾT GIỎ HÀNG CỦA NGƯỜI DÙNG
// =========================================================================
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.status(200).json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG (Hỗ trợ lưu động Route quốc tế từ PostgreSQL)
// =========================================================================
export const addToCart = async (req, res) => {
  const { 
    variantId, 
    name, 
    price, 
    quantity, 
    image, 
    productId, 
    countryCode, 
    categorySlug 
  } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });
    
    const idx = cart.items.findIndex(i => i.variantId === variantId);
    if (idx > -1) {
      // Nếu đã tồn tại biến thể, cộng dồn số lượng chênh lệch từ Frontend (+1 hoặc -1)
      cart.items[idx].quantity += Number(quantity);
      
      // Cập nhật lại thông tin mới nhất nếu có thay đổi từ DB
      if (price) cart.items[idx].price = price;
      if (image) cart.items[idx].image = image;
    } else {
      // Thêm mới item kèm theo các metadata route của sản phẩm
      cart.items.push({ 
        variantId, 
        name, 
        price, 
        quantity, 
        image, 
        productId, 
        countryCode, 
        categorySlug 
      });
    }
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 3. XÓA MỘT BIẾN THỂ KHỎI GIỎ HÀNG (Qua Params)
// =========================================================================
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params; // Ở đây productId đóng vai trò là variantId cần xóa
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
// 4. ĐỒNG BỘ/MERGE GIỎ HÀNG TỪ LOCALSTORAGE LÊN DATABASE KHI LOGIN
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
      } else {
        cart.items.push(newItem);
      }
    });
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================================
// 5. 🚀 XÓA CHỌN LỌC CÁC BIẾN THỂ ĐÃ THANH TOÁN THÀNH CÔNG KHỎI MONGODB
// =========================================================================
export const removeSelectedFromCart = async (req, res) => {
  try {
    const { variant_ids } = req.body;

    if (!variant_ids || !Array.isArray(variant_ids) || variant_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Mảng variant_ids trống hoặc không hợp lệ!" });
    }

    // Dùng $pull kết hợp $or để quét triệt để cả camelCase và snake_case trong Sub-document của MongoDB
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
      message: "Đã dọn dẹp các sản phẩm đã thanh toán khỏi Database MongoDB thành công!",
      cart 
    });
  } catch (error) {
    console.error("🔥 Lỗi tại removeSelectedFromCart Backend:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};