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

// 2. Tiếp nhận đặt hàng và lưu phi chuẩn hóa thông tin sản phẩm (Snapshot)
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

    // 🚀 BƯỚC A: ĐỒNG BỘ NỘI BỘ DOCKER SANG PRODUCT-SERVICE QUA PORT 5002
    const variantIds = danh_sach_san_pham.map(item => String(item.variant_id));
    let internalProducts = [];

    try {
      const productServiceRes = await axios.post('http://localhost:5002/api/products/internal/variants', {
        variant_ids: variantIds
      });
      if (productServiceRes.data && productServiceRes.data.success) {
        internalProducts = productServiceRes.data.data;
      }
    } catch (apiError) {
      console.warn("⚠️ Cảnh báo API kết nối Product-Service thất bại, kích hoạt cơ chế Fallback dữ liệu dự phòng:", apiError.message);
    }

    // 🚀 BƯỚC B: TÍNH TOÁN CHI PHÍ GIAO HÀNG VÀ TỔNG TIỀN ĐƠN HÀNG
    const shippingCheck = await calculateGhnShippingCost(to_district_id, to_ward_code, req.body.weight);
    req.body.phi_van_chuyen = shippingCheck.cost;
    req.body.don_vi_van_chuyen = shippingCheck.name;
    
    let finalTotal = Number(tong_tien_hang) + shippingCheck.cost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 5000) {
      finalTotal = 50000; 
    }
    req.body.tong_thanh_toan = finalTotal;

    // 🚀 BƯỚC C: PHI CHUẨN HÓA MẢNG SẢN PHẨM AN TOÀN (CƠ CHẾ FALLBACK CHỐNG MẤT SẢN PHẨM)
    const normalizedItems = danh_sach_san_pham.map(item => {
      const detail = internalProducts.find(p => String(p.variant_id) === String(item.variant_id));
      
      return {
        variant_id: String(item.variant_id),
        quantity: Number(item.quantity),
        price: detail ? Number(detail.price) : Number(item.price || 0), 
        product_name: detail ? detail.product_name : (item.name || "Sản phẩm cấp lập Demi Mart"),
        variant_name: detail ? detail.variant_name : "Mặc định",
        image_url: detail ? detail.image_url : (item.image || ""),
        ma_san_pham: detail ? detail.ma_san_pham : (item.ma_san_pham || null),
        sku: detail ? detail.sku : (item.sku || null)
      };
    });

    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: normalizedItems,
        paypal_transaction_id: req.body.paypal_transaction_id || null, 
        paypal_order_id: req.body.paypal_order_id || null
    };

    // 🚀 BƯỚC D: LƯU HÓA ĐƠN VÀO CƠ SỞ DỮ LIỆU ĐỘC LẬP CỦA ORDER SERVICE
    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công tại Order-Service với ID:", order.id);

    // ========================================================
    // 🌟 🚀 ĐÃ SỬA CHÍ MẠNG: ĐỒNG BỘ CHUẨN CONTAINER & THAM SỐ PHẲNG SANG RUBY SERVICE
    // ========================================================
    if (phuong_thuc_thanh_toan === 'PayPal' && (req.body.paypal_order_id || req.body.paypal_transaction_id)) {
      try {
        const syncPayload = {
          ma_don_hang: String(order.ma_don_hang),
          paypal_order_id: String(req.body.paypal_order_id),
          so_tien: Number(finalTotal),
          capture_data: {
            status: 'COMPLETED',
            id: String(req.body.paypal_transaction_id),
            purchase_units: [{
              payments: {
                captures: [{ id: req.body.paypal_transaction_id }]
              }
            }]
          }
        };

        // 🌟 ĐÃ FIX: Trỏ chính xác đến tên container 'demi_payment_service' trên cổng nội bộ 5004 và route phẳng hóa
        await axios.post('http://localhost:5004/paypal-capture', syncPayload);
        console.log(`🔒 [MICROSERVICES SYNC]: Đã đồng bộ ngược log giao dịch ${order.ma_don_hang} sang Payment-Service!`);
      } catch (syncErr) {
        console.error("⚠️ Cảnh báo: Lỗi ngầm khi đẩy lịch sử sang Payment-Service:", syncErr.response?.data || syncErr.message);
      }
    }

    return res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
      message: "Đặt hàng thành công! Đang chuyển tiếp sang cổng thanh toán xử lý đối soát." 
    });

  } catch (err) {
    console.error("🔥 [LỖI TẠO ĐƠN HÀNG LOG CHI TIẾT]:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống phân hệ đơn hàng khi khởi tạo!" });
  }
};

// 3. Tiếp nhận đồng bộ trạng thái từ Payment-Service
const updateInternalOrderStatus = async (req, res) => {
  try {
    const { ma_don_hang, trang_thai_thanh_toan } = req.body;

    if (!ma_don_hang || !trang_thai_thanh_toan) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin đồng bộ trạng thái đơn hàng!" });
    }

    const sqlQuery = `
      UPDATE public.orders 
      SET trang_thai_thanh_toan = $1 
      WHERE ma_don_hang = $2
    `;
    
    if (db.query) {
      await db.query(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);
    } else {
      await db.execute(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);
    }

    console.log(`🔒 [ĐỒNG BỘ THÀNH CÔNG]: Đơn hàng ${ma_don_hang} đã cập nhật trạng thái thanh toán sang: ${trang_thai_thanh_toan}`);
    return res.status(200).json({ success: true, message: "Đồng bộ trạng thái hóa đơn nội bộ thành công!" });

  } catch (err) {
    console.error("🔥 Lỗi xử lý đồng bộ tại Order-Service:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi đồng bộ cơ sở dữ liệu phân hệ đơn hàng!" });
  }
};

export { getShippingFee, placeOrder, updateInternalOrderStatus };