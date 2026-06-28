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

    // 🚀 BƯỚC C: PHI CHUẨN HÓA MẢNG SẢN PHẨM AN TOÀN
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
    // 🌟 🚀 CƠ CHẾ SHARE DỮ LIỆU SANG PAYMENT (CHỈ ÁP DỤNG NON-COD & CÙNG TÊN CỘT)
    // ========================================================
    const methodUpper = String(phuong_thuc_thanh_toan || '').toUpperCase().trim();
    
    if (methodUpper !== 'COD' && methodUpper !== '') {
      try {
        const safeOrderId = req.body.paypal_order_id || `GATEWAY_${order.ma_don_hang}`;
        const safeTxnId = req.body.paypal_transaction_id || `TXN_${Date.now()}`;

        const sharePayload = {
          ma_don_hang: String(order.ma_don_hang),
          so_tien: Number(finalTotal),
          phuong_thuc_thanh_toan: methodUpper,
          trang_thai_thanh_toan: String(req.body.trang_thai_thanh_toan || 'PENDING'),
          
          paypal_order_id: String(safeOrderId),
          capture_data: {
            status: 'COMPLETED',
            id: String(safeTxnId),
            shared_from: 'order_service'
          }
        };

        await axios.post('http://demi_payment_service:5004/api/paypal-capture', sharePayload);
        console.log(`🔒 [MICROSERVICES SHARE]: Đã chia sẻ đơn ${order.ma_don_hang} (${methodUpper}) sang Payment-Service!`);
      } catch (syncErr) {
        console.error("⚠️ Cảnh báo: Lỗi share dữ liệu nội bộ Docker sang Payment:", syncErr.message);
      }
    }

    return res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
      message: "Đặt hàng thành công! Thông tin thanh toán đang được xử lý đối soát nội bộ." 
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

// ========================================================
// 📊 CONTROLLER 4: THỐNG KÊ ĐƠN HÀNG CHO ADMIN DASHBOARD
// ========================================================
const getOrderStatistics = async (req, res) => {
  try {
    if (!req.user || !['Admin', 'Manager', 'Staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập dữ liệu thống kê!" });
    }

    // 🛠️ ĐÃ FIX: Chuyển toàn bộ tên cột 'status' -> 'trang_thai_don_hang', 'created_at' -> 'ngay_tao' để khớp Database
    const queryTotal = `SELECT COUNT(*) as total FROM public.orders`;
    const queryDelivered = `SELECT COUNT(*) as delivered FROM public.orders WHERE trang_thai_don_hang = 'Đã giao' OR trang_thai_thanh_toan = 'COMPLETED'`;
    const queryPending = `SELECT COUNT(*) as pending FROM public.orders WHERE trang_thai_don_hang = 'Chờ xử lý' OR trang_thai_don_hang IS NULL`;
    const queryToday = `SELECT COUNT(*) as today FROM public.orders WHERE ngay_tao >= CURRENT_DATE`;
    const queryRevenue = `SELECT SUM(tong_thanh_toan) as revenue FROM public.orders WHERE trang_thai_thanh_toan = 'COMPLETED' OR trang_thai_don_hang = 'Đã giao'`;
    const queryAvg = `SELECT AVG(tong_thanh_toan) as avg_val FROM public.orders WHERE tong_thanh_toan > 0`;
    
    const queryRecent = `
      SELECT ma_don_hang, tong_thanh_toan, COALESCE(trang_thai_don_hang, 'Chờ xử lý') as status, TO_CHAR(ngay_tao, 'DD/MM/YYYY') as date
      FROM public.orders 
      ORDER BY ngay_tao DESC 
      LIMIT 10
    `;

    const executeSql = async (sql) => {
      const res = db.query ? await db.query(sql) : await db.execute(sql);
      return res.rows ? res.rows : res;
    };

    const [totRes, delRes, penRes, todRes, revRes, avgRes, recRes] = await Promise.all([
      executeSql(queryTotal),
      executeSql(queryDelivered),
      executeSql(queryPending),
      executeSql(queryToday),
      executeSql(queryRevenue),
      executeSql(queryAvg),
      executeSql(queryRecent)
    ]);

    const totalOrders = Number(totRes[0]?.total || 0);
    const deliveredOrders = Number(delRes[0]?.delivered || 0);
    const pendingOrders = Number(penRes[0]?.pending || 0);
    const todayOrders = Number(todRes[0]?.today || 0);
    const totalRevenue = Number(revRes[0]?.revenue || 0);
    const avgOrderValue = Number(avgRes[0]?.avg_val || 0);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          total_orders: totalOrders,
          delivered_orders: deliveredOrders,
          pending_orders: pendingOrders,
          today_orders: todayOrders,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue
        },
        recent_orders: recRes.map(item => ({
          id: item.ma_don_hang || "DH-N/A",
          customer: "Khách hàng Demi", 
          date: item.date,
          total: Number(item.tong_thanh_toan).toLocaleString('vi-VN') + ' đ',
          status: item.status
        }))
      }
    });

  } catch (err) {
    console.error("🔥 [LỖI TRÍCH XUẤT THỐNG KÊ]:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi trích xuất số liệu thống kê!" });
  }
};

// ========================================================
// 🎯 API 5: LẤY DANH SÁCH ĐƠN HÀNG PHÂN TRANG CHO ADMIN
// ========================================================
const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = `WHERE 1=1`;
    const queryParams = [];
    let pIdx = 1;

    if (search.trim() !== '') {
      whereClause += ` AND (ma_don_hang ILIKE $${pIdx} OR phuong_thuc_thanh_toan ILIKE $${pIdx})`;
      queryParams.push(`%${search.trim()}%`);
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as total FROM public.orders ${whereClause}`;
    const countRes = db.query ? await db.query(countSql, queryParams) : await db.execute(countSql, queryParams);
    const totalItems = parseInt((countRes.rows ? countRes.rows[0] : countRes[0])?.total || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const dataSql = `
      SELECT 
        id, ma_don_hang, phuong_thuc_thanh_toan, trang_thai_thanh_toan, 
        trang_thai_don_hang, tong_thanh_toan, ngay_tao
      FROM public.orders
      ${whereClause}
      ORDER BY ngay_tao DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};
    `;

    const dataParams = [...queryParams, limit, offset];
    const dataRes = db.query ? await db.query(dataSql, dataParams) : await db.execute(dataSql, dataParams);
    const orders = dataRes.rows ? dataRes.rows : dataRes;

    return res.status(200).json({
      success: true,
      orders,
      totalPages,
      currentPage: page,
      totalItems
    });

  } catch (err) {
    console.error("🔥 Lỗi API getAllOrdersAdmin:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh sách đơn hàng." });
  }
};

// ========================================================
// 🛒 🛠️ ĐÃ BỔ SUNG: API LẤY ĐƠN HÀNG CHO NGƯỜI DÙNG ĐĂNG NHẬP
// ========================================================
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

    const orders = await Order.getByUserId(userId);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("🔥 Lỗi API getMyOrders:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy lịch sử đơn hàng cá nhân." });
  }
};

export { getShippingFee, placeOrder, updateInternalOrderStatus, getOrderStatistics, getAllOrdersAdmin, getMyOrders };