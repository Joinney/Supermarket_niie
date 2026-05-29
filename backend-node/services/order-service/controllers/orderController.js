const Order = require('../models/orderModel');

exports.placeOrder = async (req, res) => {
  try {
    // Lấy userId từ middleware xác thực (thường là req.user.id)
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });
    }

    // Gọi model để lưu vào DB
    const order = await Order.create(userId, req.body);
    
    res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      message: "Đặt hàng thành công" 
    });
  } catch (err) {
    console.error("Order Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi đặt hàng" });
  }
};