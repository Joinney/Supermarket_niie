import * as Order from '../models/orderModel.js';
import axios from 'axios';
import db from '../configs/database.js';

// ========================================================
// 📦 HELPER 1: TÍNH TOÁN CƯỚC PHÍ GIAO HÀNG ĐỘNG QUA API GHN
// ========================================================
const calculateGhnShippingCost = async (toDistrictId, toWardCode, weightGrams = 1000) => {
  try {
    const token = String(process.env.GHN_TOKEN || '200ce97d-5b84-11f1-9370-d6d3721dfdc0').replace(/[\r\n]/g, '').trim();
    const shopId = Number(process.env.GHN_SHOP_ID?.replace(/[\r\n]/g, '').trim() || 6463350);

    const ghnPayload = {
      "from_district_id": 1454, 
      "to_district_id": Number(toDistrictId),
      "to_ward_code": String(toWardCode),
      "weight": Number(weightGrams || 1000),
      "length": 15,
      "width": 15,
      "height": 15,
      "service_id": 53320, 
      "insurance_value": 0,
      "coupon": null
    };

    let ghnResponse;
    try {
      ghnResponse = await axios.post(
        'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
        ghnPayload,
        { headers: { 'Content-Type': 'application/json', 'Token': token, 'ShopId': shopId } }
      );
    } catch (apiErr) {
      if (apiErr.response?.data?.code_message === "AVAILABLE_SERVICE_NOT_FOUND" || apiErr.response?.status === 400) {
        ghnPayload.service_id = 53321; 
        ghnResponse = await axios.post(
          'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
          ghnPayload,
          { headers: { 'Content-Type': 'application/json', 'Token': token, 'ShopId': shopId } }
        );
      } else {
        throw apiErr;
      }
    }

    if (ghnResponse.data && ghnResponse.data.code === 200) {
      const finalCost = ghnResponse.data.data.total || ghnResponse.data.data.service_fee;
      return { success: true, cost: finalCost, name: ghnPayload.service_id === 53320 ? 'Giao Hàng Nhanh (Hỏa Tốc)' : 'Giao Hàng Nhanh (Chuẩn)' };
    }
    return { success: false, message: 'GHN không phản hồi cước phí hợp lệ' };
  } catch (error) {
    console.error("🔥 Lỗi GHN:", error.message);
    return { success: true, cost: 35000, name: 'Giao Hàng Nhanh (Dự phòng)' };
  }
};

// ========================================================
// 🛃 CONTROLLER INTERFACE
// ========================================================

// 1. Tính cước phí giao nhận vận chuyển phục vụ Frontend Checkout
const getShippingFee = async (req, res) => {
  try {
    const { to_district_id, to_ward_code, weight } = req.body;
    if (!to_district_id || !to_ward_code) return res.status(400).json({ success: false, message: "Thiếu thông tin địa điểm" });

    const shippingResult = await calculateGhnShippingCost(to_district_id, to_ward_code, weight);
    if (shippingResult.success) {
      return res.status(200).json({ success: true, data: [{ id: 'ghn-standard', name: shippingResult.name, cost: shippingResult.cost, days: 'Nhận sau 2-3 ngày', logo: '' }] });
    }
    res.status(400).json({ success: false, message: shippingResult.message });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống tính cước" });
  }
};

// 2. Tiếp nhận đặt hàng và lưu phi chuẩn hóa thông tin sản phẩm (Ki kiến trúc Microservices)
const placeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

    const { 
      to_district_id, 
      to_ward_code, 
      tong_tien_hang, 
      danh_sach_san_pham,
      phuong_thuc_thanh_toan,
      thong_tin_giao_hang 
    } = req.body;
    
    if (!to_district_id || !to_ward_code || !danh_sach_san_pham || !Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ hoặc bị thiếu!" });
    }

    // 🚀 BƯỚC A: GỌI SANG PRODUCT-SERVICE QUA ENDPOINT NỘI BỘ ĐỂ LẤY THÔNG TIN SNAPSHOT
    const variantIds = danh_sach_san_pham.map(item => String(item.variant_id));
    let internalProducts = [];

    try {
      const productServiceRes = await axios.post('http://localhost:5002/api/products/internal/variants', {
        variant_ids: variantIds
      });
      if (productServiceRes.data && productServiceRes.data.success) {
        internalProducts = productServiceRes.data.data;
      } else {
        throw new Error("Product Service phản hồi lỗi");
      }
    } catch (apiError) {
      console.error("🔥 Lỗi gọi API nội bộ kết nối Product-Service:", apiError.message);
      return res.status(502).json({ success: false, message: "Hệ thống không thể xác thực thông tin sản phẩm thô lúc này!" });
    }

    // 🚀 BƯỚC B: TÍNH TOÁN CHI PHÍ GIAO HÀNG VÀ DÒNG TIỀN ĐƠN HÀNG
    const shippingCheck = await calculateGhnShippingCost(to_district_id, to_ward_code, req.body.weight);
    req.body.phi_van_chuyen = shippingCheck.cost;
    req.body.don_vi_van_chuyen = shippingCheck.name;
    
    let finalTotal = Number(tong_tien_hang) + shippingCheck.cost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 5000) {
      finalTotal = 50000; 
    }
    req.body.tong_thanh_toan = finalTotal;

    // 🚀 BƯỚC C: PHI CHUẨN HÓA MẢNG SẢN PHẨM SANG TRẠNG THÁI ĐẦY ĐỦ THÔNG TIN ĐỂ LƯU XUỐNG MODEL
    const normalizedItems = danh_sach_san_pham.map(item => {
      // Tìm kiếm thông tin sản phẩm khớp từ danh mục lấy ở bước A về
      const detail = internalProducts.find(p => String(p.variant_id) === String(item.variant_id));
      
      return {
        variant_id: String(item.variant_id),
        quantity: Number(item.quantity),
        price: detail ? Number(detail.price) : Number(item.price), // Ưu tiên lấy giá bảo mật từ DB sản phẩm gốc
        product_name: detail ? detail.product_name : "Sản phẩm Demi Mart",
        variant_name: detail ? detail.variant_name : "Mặc định",
        image_url: detail ? detail.image_url : ""
      };
    });

    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: normalizedItems,
        paypal_transaction_id: req.body.paypal_transaction_id || null, 
        paypal_order_id: req.body.paypal_order_id || null
    };

    // 🚀 BƯỚC D: LƯU TRỰC TIẾP HÓA ĐƠN VÀO CƠ SỞ DỮ LIỆU CỦA ORDER SERVICE
    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công tại Order-Service với ID:", order.id);

    // Trả về thông tin phục vụ luồng tiếp theo ở Frontend
    return res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
      message: "Đặt hàng thành công! Đang chuyển tiếp sang cổng thanh toán xử lý đối soát." 
    });

  } catch (err) {
    console.error("🔥 [LỒI TẠO ĐƠN HÀNG LOG CHI TIẾT]:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống phân hệ đơn hàng khi khởi tạo!" });
  }
};

export { getShippingFee, placeOrder };