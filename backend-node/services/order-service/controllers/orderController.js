import * as Order from '../models/orderModel.js';
import axios from 'axios';
import crypto from 'crypto';
import db from '../configs/database.js';
import moment from 'moment';

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
// 🛡️ HELPER CHUNG: QUY CHUẨN MÃ HÓA RFC 3986 CHO VNPAY 2.1.0
// ========================================================
const vnpayEncode = (str) => {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
};

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
};

// ========================================================
// 🔑 HELPER 2: KHỞI TẠO ĐƯỜNG DẪN THANH TOÁN VNPAY
// ========================================================
const createVnpayUrl = (req, maDonHang, tongThanhToan) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  const createDate = moment().format('YYYYMMDDHHmmss');

  let ipAddr = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (ipAddr.includes('::ffff:')) ipAddr = ipAddr.replace('::ffff:', '');
  if (ipAddr === '::1') ipAddr = '127.0.0.1';

  // 🔴 THỐNG NHẤT 1 CẶP MERCHENT KEY (Thay bằng tài khoản trong mail VNPAY cấp cho bạn)
  const tmnCode = process.env.VNP_TMN_CODE || '2QXUIISW'; 
  const secretKey = process.env.VNP_HASH_SECRET || '9O6E27MXV4LCOZJWQ4M9RFEZ9C1QW2L4'; 
  const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5005/api/orders/vnpay-callback';

  const amount = Math.round(Number(tongThanhToan) * 100);
  
  // Thêm timestamp vào sau mã đơn hàng để không bị lỗi trùng mã giao dịch (vnp_TxnRef) trên cổng VNPAY
  const uniqueTxnRef = `${maDonHang}_${Date.now()}`;

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: uniqueTxnRef,
    vnp_OrderInfo: `Thanh toan don hang Demi Mart: ${maDonHang}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  vnp_Params = sortObject(vnp_Params);
  const sortedKeys = Object.keys(vnp_Params);

  let signDataInput = '';
  let queryUrlOutput = '';

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const value = String(vnp_Params[key]);

    signDataInput += vnpayEncode(key) + '=' + vnpayEncode(value);
    queryUrlOutput += vnpayEncode(key) + '=' + vnpayEncode(value);

    if (i < sortedKeys.length - 1) {
      signDataInput += '&';
      queryUrlOutput += '&';
    }
  }

  const hmac = crypto.createHmac('sha512', secretKey);
  const secureHash = hmac.update(Buffer.from(signDataInput, 'utf8')).digest('hex');

  return `${vnpUrl}?${queryUrlOutput}&vnp_SecureHash=${secureHash}`;
};

// ========================================================
// 🛃 CONTROLLER INTERFACE
// ========================================================
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

    const { 
      to_district_id, 
      to_ward_code, 
      tong_tien_hang, 
      danh_sach_san_pham,
      phuong_thuc_thanh_toan,
      paypal_transaction_id,
      paypal_order_id,
      thong_tin_giao_hang // Bóc tách thêm object này để đảm bảo có dữ liệu shipper/người nhận
    } = req.body;
    
    if (!to_district_id || !to_ward_code || !danh_sach_san_pham) {
      return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng thiếu!" });
    }

    // Tính toán lại phí vận chuyển từ GHN dựa trên district và ward code
    const shippingCheck = await calculateGhnShippingCost(to_district_id, to_ward_code, req.body.weight);
    req.body.phi_van_chuyen = shippingCheck.cost;
    req.body.don_vi_van_chuyen = shippingCheck.name;
    
    // Tính tổng thanh toán cuối cùng
    let finalTotal = Number(tong_tien_hang) + shippingCheck.cost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 5000) {
      finalTotal = 50000; // Ngưỡng an toàn hoặc test
    }
    req.body.tong_thanh_toan = finalTotal;

    // Chuẩn hóa cấu trúc dữ liệu trước khi bắn vào Model khởi tạo DB
    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: danh_sach_san_pham.map(item => ({
            variant_id: String(item.variant_id),
            quantity: Number(item.quantity),
            price: Number(item.price)
        })),
        paypal_transaction_id: paypal_transaction_id ? String(paypal_transaction_id) : null,
        paypal_order_id: paypal_order_id ? String(paypal_order_id) : null
    };

    // Gọi tầng Model thực thi Query vào Database
    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công với ID:", order.id);

    // Xử lý luồng thanh toán VNPay nếu user chọn phương thức này
    if (phuong_thuc_thanh_toan === 'VNPay') {
      const paymentUrl = createVnpayUrl(req, order.ma_don_hang, finalTotal);
      console.log("👉 LINK VNPAY CỦA DEMI:", paymentUrl);
      
      return res.status(201).json({ 
        success: true, 
        phuong_thuc_thanh_toan: 'VNPay',
        paymentUrl: paymentUrl, 
        ma_don_hang: order.ma_don_hang,
        message: "Link thanh toán VNPay đã sẵn sàng!"
      });
    }

    // Trả về kết quả cho phương thức COD thông thường
    return res.status(201).json({ success: true, ma_don_hang: order.ma_don_hang, message: "Đặt hàng thành công!" });

  } catch (err) {
    // 🔴 ĐOẠN QUAN TRỌNG: Log toàn bộ object lỗi để debug tận gốc
    console.error("🔥 [LỖI TẠO ĐƠN HÀNG LOG CHI TIẾT]:");
    console.error("- Message:", err.message);
    console.error("- Stack Trace:", err.stack);
    if (err.detail) console.error("- DB Detail Error:", err.detail); // Hiển thị lỗi ràng buộc của PostgreSQL (nếu có)
    
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo đơn!" });
  }
};

// ========================================================
// 🚀 CONTROLLER: ĐỐI SOÁT & CẬP NHẬT KẾT QUẢ VNPAY
// ========================================================
const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const sortedKeys = Object.keys(sortedParams);

    let querystring = '';
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      const value = String(sortedParams[key]);
      querystring += vnpayEncode(key) + '=' + vnpayEncode(value);
      if (i < sortedKeys.length - 1) {
        querystring += '&';
      }
    }

    // 🔴 ĐỒNG BỘ KEY: Sử dụng chính xác cặp key cấu hình giống hàm tạo URL
    const secretKey = process.env.VNP_HASH_SECRET || '9O6E27MXV4LCOZJWQ4M9RFEZ9C1QW2L4'; 
    const hmac = crypto.createHmac('sha512', secretKey);
    const checkHash = hmac.update(Buffer.from(querystring, 'utf-8')).digest('hex');

    if (secureHash !== checkHash) {
      console.error("⚠️ Chuỗi Hash Checksum VNPay không khớp!");
      return res.status(400).json({ success: false, message: 'Invalid VNPay signature' });
    }

    const txnRef = vnp_Params.vnp_TxnRef; // Có dạng: "DH12345_17173828"
    const maDonHang = txnRef.split('_')[0]; // Tách chuỗi lấy lại mã đơn gốc: "DH12345"
    const responseCode = vnp_Params.vnp_ResponseCode;
    const transactionNo = vnp_Params.vnp_TransactionNo;

    if (responseCode === '00') {
      await db.query(
        `
        UPDATE orders
        SET trang_thai_thanh_toan = 'completed'
        WHERE ma_don_hang = $1
        `,
        [maDonHang]
      );

      console.log(`🔒 Đơn hàng VNPay ${maDonHang} đã cập nhật Đã thanh toán! Mã GD: ${transactionNo}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?order=${maDonHang}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failed?order=${maDonHang}`);

  } catch (error) {
    console.error('VNPay Return Error:', error);
    return res.status(500).json({ success: false, message: 'VNPay callback error' });
  }
};

export { getShippingFee, placeOrder, vnpayReturn };