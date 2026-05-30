import * as Order from '../models/orderModel.js';
import axios from 'axios';

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

const placeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

    const { to_district_id, to_ward_code, tong_tien_hang, danh_sach_san_pham } = req.body;
    if (!to_district_id || !to_ward_code || !danh_sach_san_pham) return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng thiếu!" });

    // 1. Tính chéo phí ship tại Backend
    const shippingCheck = await calculateGhnShippingCost(to_district_id, to_ward_code, req.body.weight);
    req.body.phi_van_chuyen = shippingCheck.cost;
    req.body.tong_thanh_toan = Number(tong_tien_hang) + shippingCheck.cost - Number(req.body.so_tien_giam_gia || 0);

    // 2. Chuyển đổi dữ liệu chuẩn vào DB (đảm bảo variant_id là số hoặc chuỗi khớp DB)
    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: danh_sach_san_pham.map(item => ({
            variant_id: String(item.variant_id),
            quantity: Number(item.quantity),
            price: Number(item.price)
        }))
    };

    const order = await Order.create(userId, normalizedOrder);
console.log("✅ Đơn hàng đã tạo thành công với ID:", order.id);
    res.status(201).json({ success: true, ma_don_hang: order.ma_don_hang, message: "Đặt hàng thành công!" });
  } catch (err) {
    console.error("Order Place Error:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo đơn!" });
  }
};

export { getShippingFee, placeOrder };