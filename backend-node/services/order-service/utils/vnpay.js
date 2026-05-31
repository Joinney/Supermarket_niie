import crypto from 'crypto';
import moment from 'moment';

export const createVnpayUrl = (req, maDonHang, tongThanhToan) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  
  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  // 🔑 Thông tin cấu hình môi trường TEST (Sandbox) mặc định của VNPay
  const tmnCode = process.env.VNP_TMN_CODE || '2QXUIISW'; // Mã Website định danh
  const secretKey = process.env.VNP_HASH_SECRET || '9O6E27MXV4LCOZJWQ4M9RFEZ9C1QW2L4'; // Chuỗi bảo mật
  const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'; // Cổng Sandbox URL
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/checkout/vnpay-return'; // Link Front-end hứng kết quả

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = maDonHang;
  vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang Demi Mart: ${maDonHang}`;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = tongThanhToan * 100; // VNPay ép buộc nhân 100 để triệt tiêu số thập phân
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  // Sắp xếp các tham số theo bảng chữ cái từ A-Z (Bắt buộc)
  vnp_Params = sortObject(vnp_Params);

  // Tiến hành băm chuỗi mã bảo mật SHA512
  const querystring = new URLSearchParams(vnp_Params).toString();
  const hmac = crypto.createHmac("sha512", secretKey);
  const signData = hmac.update(Buffer.from(querystring, 'utf-8')).digest("hex"); 
  
  vnp_Params['vnp_SecureHash'] = signData;
  
  return vnpUrl + '?' + new URLSearchParams(vnp_Params).toString();
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj){
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}