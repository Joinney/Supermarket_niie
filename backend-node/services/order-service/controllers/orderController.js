import * as Order from '../models/orderModel.js';
import axios from 'axios';
import db from '../configs/database.js';
import fs from 'fs';
import path from 'path';

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
    return { success: false, cost: 0, message: 'Không kết nối được GHN' };
  }
};

// ========================================================
// 🌟 HELPER 2: THUẬT TOÁN REGEX SIÊU TỐC TRÍCH XUẤT THÔ FILE KML 
// ========================================================
const parseKmlWithRegex = (kmlContent) => {
  const stations = [];
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  let match;
  let index = 0;

  while ((match = placemarkRegex.exec(kmlContent)) !== null) {
    const block = match[1];

    const coordMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (!coordMatch) continue;
    
    const [lng, lat] = coordMatch[1].trim().split(',').map(num => parseFloat(num.trim()));
    if (!lat || !lng || lat === 0) continue;

    const extractDataField = (fieldName) => {
      const regex = new RegExp(`<Data\\s+name="${fieldName}">\\s*<value>([\\s\\S]*?)<\/value>\\s*<\/Data>`, "i");
      const fieldMatch = block.match(regex);
      return fieldMatch ? fieldMatch[1].trim() : "";
    };

    const districtName = extractDataField("Quận/huyện");
    const wardName = extractDataField("Phường/xã");
    const street = extractDataField("Số nhà, đường");
    const maVanHanh = extractDataField("Mã vận hành");

    if (districtName === "(blank)" || districtName === "") continue;

    stations.push({
      index,
      id: maVanHanh && maVanHanh !== "(blank)" ? maVanHanh : `STATION_${index}`,
      name: maVanHanh && maVanHanh !== "(blank)" ? `Bưu cục GHN ${maVanHanh} (${wardName || 'Chi nhánh'})` : "Bưu cục Giao Hàng Nhanh",
      address: street && street !== "(blank)" ? street : `${wardName}, ${districtName}`,
      districtName,
      wardName,
      location: { lat, lng }
    });
    index++;
  }
  return stations;
};

// ========================================================
// 🛃 CONTROLLER INTERFACE
// ========================================================

// 1. Tính cước phí giao nhận vận chuyển dự phòng
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

// 2. Tiếp nhận đặt hàng (Đã nâng cấp trừ kho Microservices chống Race Condition)
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

    // 🚀 BƯỚC A: CHUẨN HÓA MẢNG SẢN PHẨM & TỰ ĐỘNG NẠP SKU XỊN TỪ PRODUCT-SERVICE
    const productServiceUrl = process.env.INTERNAL_PRODUCT_URL || 'http://demi_product_service:5002';
    let databaseVariants = [];
    
    try {
      const prodApiRes = await axios.get(`${productServiceUrl}/api/products`);
      databaseVariants = Array.isArray(prodApiRes.data) ? prodApiRes.data : prodApiRes.data?.products || [];
    } catch (err) {
      console.warn("⚠️ Không thể kết nối Product-Service để đồng bộ SKU gốc khi đặt hàng.");
    }

    const normalizedItems = danh_sach_san_pham.map(item => {
      const vId = String(item.variant_id || item.variantId);
      const pName = item.name || item.product_name || "Sản phẩm Demi Mart";
      
      let finalSku = item.sku || null;
      let finalMaSanPham = item.ma_san_pham || item.productId || null; 

      if (databaseVariants.length > 0) {
        const found = databaseVariants.find(p => 
          String(p.ma_bien_the) === vId || String(p.ma_bien_the_mac_dinh) === vId
        );
        
        if (found) {
          if (!finalSku) finalSku = found.sku || found.sku_code || `VN-${String(found.ma_san_pham).replace("MSP", "")}-001`;
          if (!finalMaSanPham) finalMaSanPham = found.ma_san_pham; 
        }
      }

      return {
        variant_id: vId,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0), 
        product_name: pName,
        variant_name: item.variantName || item.variant_name || item.phan_loai || item.variantNameFrontend || "Mặc định",
        image_url: item.image || item.image_url || "",
        ma_san_pham: finalMaSanPham, 
        sku: finalSku 
      };
    }).filter(i => i.variant_id && i.quantity > 0);

    if (normalizedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Giỏ hàng rỗng hoặc sản phẩm không hợp lệ!" });
    }

    // 🚀 BƯỚC B: GỌI SANG PRODUCT SERVICE ĐỂ KHÓA VÀ TRỪ KHO
    try {
      await axios.post(`${productServiceUrl}/api/products/internal/deduct-stock`, {
        items: normalizedItems
      });
      console.log("✅ Đã gọi sang Product Service trừ kho thành công!");
    } catch (apiError) {
      console.error("❌ Lỗi trừ kho từ Product Service:", apiError.response?.data?.message || apiError.message);
      return res.status(400).json({ 
        success: false, 
        message: apiError.response?.data?.message || "Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng!" 
      });
    }

    const promotionServiceUrl = process.env.INTERNAL_PROMOTION_URL || 'http://demi_promotion_service:5007'; 
    try {
        const itemsToPromotion = normalizedItems.map(item => ({
            ma_bien_the: item.variant_id,
            so_luong: item.quantity
        }));

        await axios.post(`${promotionServiceUrl}/api/promotions/internal/update-sold`, {
            items: itemsToPromotion
        });
        console.log("✅ Đã gọi sang Promotion Service đồng bộ số lượng bán thành công!");
    } catch (promoErr) {
        console.warn("⚠️ Cảnh báo: Lỗi khi đồng bộ số lượng đã bán với Promotion Service:", promoErr.message);
    }

    // 🚀 BƯỚC C: CHỐT CHI PHÍ GIAO HÀNG
    const clientShippingFee = Number(req.body.phi_van_chuyen);
    const validShippingCost = (!isNaN(clientShippingFee) && clientShippingFee >= 0) ? clientShippingFee : 25000;

    req.body.phi_van_chuyen = validShippingCost;
    req.body.don_vi_van_chuyen = req.body.don_vi_van_chuyen || 'Siêu thị DemiMart Express';
    
    let finalTotal = Number(tong_tien_hang) + validShippingCost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 5000) {
      finalTotal = 50000; 
    }
    req.body.tong_thanh_toan = finalTotal;

    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: normalizedItems,
        paypal_transaction_id: req.body.paypal_transaction_id || null, 
        paypal_order_id: req.body.paypal_order_id || null,
        to_lat: req.body.to_lat || null,
        to_lng: req.body.to_lng || null,
        tong_khoang_cach_km: req.body.tong_khoang_cach_km || 0,
        thoi_gian_du_kien_phut: req.body.thoi_gian_du_kien_phut || 0
    };

    // 🚀 BƯỚC D: LƯU HÓA ĐƠN VÀO CƠ SỞ DỮ LIỆU
    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công tại Order-Service với ID:", order.id);

    // ========================================================
    // 🌟 SHARE DỮ LIỆU SANG PAYMENT (CHỈ ÁP DỤNG NON-COD)
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

    const sqlQuery = `UPDATE public.orders SET trang_thai_thanh_toan = $1 WHERE ma_don_hang = $2`;
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
    const statsQuery = `
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao') THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('pending', 'cho_xu_ly', 'chờ xử lý', 'dang_xu_ly', '') THEN 1 ELSE 0 END) as pending_orders,
            SUM(CASE WHEN DATE(ngay_tao) = CURRENT_DATE THEN 1 ELSE 0 END) as today_orders,
            SUM(CASE 
                WHEN LOWER(TRIM(COALESCE(trang_thai_thanh_toan, ''))) IN ('completed', 'da_thanh_toan', 'đã thanh toán', 'success') 
                OR LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao') 
                THEN CAST(tong_thanh_toan AS numeric) 
                ELSE 0 
            END) as total_revenue
        FROM public.orders
    `;
    const statsRes = db.query ? await db.query(statsQuery) : await db.execute(statsQuery);
    const stats = statsRes.rows ? statsRes.rows[0] : statsRes[0];

    const recentOrdersQuery = `
        SELECT ma_don_hang, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, ngay_tao
        FROM public.orders
        ORDER BY ngay_tao DESC
        LIMIT 5
    `;
    const recentRes = db.query ? await db.query(recentOrdersQuery) : await db.execute(recentOrdersQuery);
    const recentOrders = recentRes.rows ? recentRes.rows : recentRes;

    const totalOrdersCount = Number(stats.total_orders || 0);
    const totalRevenueAmount = Number(stats.total_revenue || 0);
    const averageOrderValue = totalOrdersCount > 0 ? (totalRevenueAmount / totalOrdersCount) : 0;

    const formattedRecentOrders = recentOrders.map(item => ({
        id: item.ma_don_hang || "N/A",
        customer: "Khách hàng Demi", 
        date: new Date(item.ngay_tao).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        total: Number(item.tong_thanh_toan),
        status: item.trang_thai_don_hang || "Chờ xử lý"
    }));

    return res.status(200).json({
        success: true,
        data: {
            overview: {
                total_orders: totalOrdersCount,
                delivered_orders: Number(stats.delivered_orders || 0),
                pending_orders: Number(stats.pending_orders || 0),
                today_orders: Number(stats.today_orders || 0),
                total_revenue: totalRevenueAmount,
                avg_order_value: Math.round(averageOrderValue)
            },
            recent_orders: formattedRecentOrders
        }
    });

  } catch (err) {
      console.error("🔥 Lỗi API getOrderStatistics:", err.message);
      return res.status(500).json({ success: false, message: "Lỗi máy chủ khi trích xuất thống kê đơn hàng." });
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
    const status = req.query.status || '';
    const payment = req.query.payment || '';

    let whereClause = `WHERE 1=1`;
    const queryParams = [];
    let pIdx = 1;

    if (search.trim() !== '') {
      whereClause += ` AND (o.ma_don_hang ILIKE $${pIdx} OR o.phuong_thuc_thanh_toan ILIKE $${pIdx})`;
      queryParams.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (status.trim() !== '') {
      whereClause += ` AND o.trang_thai_don_hang ILIKE $${pIdx}`;
      queryParams.push(status.trim());
      pIdx++;
    }

    if (payment.trim() !== '') {
      whereClause += ` AND o.trang_thai_thanh_toan ILIKE $${pIdx}`;
      queryParams.push(payment.trim());
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as total FROM public.orders o ${whereClause}`;
    const countRes = db.query ? await db.query(countSql, queryParams) : await db.execute(countSql, queryParams);
    const totalItems = parseInt((countRes.rows ? countRes.rows[0] : countRes[0])?.total || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const dataSql = `
      SELECT 
        o.id, o.ma_don_hang, o.phuong_thuc_thanh_toan, o.trang_thai_thanh_toan, 
        o.trang_thai_don_hang, o.tong_thanh_toan, o.ngay_tao,
        (
            SELECT json_agg(
                json_build_object(
                    'product_name', oi.product_name,
                    'variant_name', oi.variant_name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'image_url', oi.image_url
                )
            )
            FROM public.order_items oi 
            WHERE oi.order_id = o.id
        ) AS danh_sach_san_pham
      FROM public.orders o
      ${whereClause}
      ORDER BY o.ngay_tao DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1};
    `;

    const dataParams = [...queryParams, limit, offset];
    const dataRes = db.query ? await db.query(dataSql, dataParams) : await db.execute(dataSql, dataParams);
    const orders = dataRes.rows ? dataRes.rows : dataRes;

    return res.status(200).json({ success: true, orders, totalPages, currentPage: page, totalItems });
  } catch (err) {
    console.error("🔥 Lỗi API getAllOrdersAdmin:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh sách đơn hàng." });
  }
};

// ========================================================
// 🛒 API 6: LẤY DANH SÁCH ĐƠN HÀNG CHO NGƯỜI DÙNG ĐĂNG NHẬP
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

// ========================================================
// 🎯 API 7: LẤY CHI TIẾT 1 ĐƠN HÀNG KÈM DANH SÁCH SẢN PHẨM THỰC TẾ
// ========================================================
const getOrderDetailAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumber = /^\d+$/.test(id); 
    
    let orderSql = "";
    let queryParam = id;

    if (isNumber) {
      orderSql = `SELECT id, user_id, ma_don_hang, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, tong_thanh_toan, phi_van_chuyen, ngay_tao FROM public.orders WHERE id = $1 LIMIT 1;`;
      queryParam = Number(id);
    } else {
      orderSql = `SELECT id, user_id, ma_don_hang, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, tong_thanh_toan, phi_van_chuyen, ngay_tao FROM public.orders WHERE ma_don_hang = $1 LIMIT 1;`;
    }

    const orderResult = db.query ? await db.query(orderSql, [queryParam]) : await db.execute(orderSql, [queryParam]);
    const order = orderResult.rows ? orderResult.rows[0] : orderResult[0];

    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });

    const itemsSql = `SELECT id, order_id, variant_id, quantity, price, product_name, variant_name, image_url, ma_san_pham, sku FROM public.order_items WHERE order_id = $1;`;
    const itemsResult = db.query ? await db.query(itemsSql, [order.id]) : await db.execute(itemsSql, [order.id]);
    
    order.danh_sach_san_pham = itemsResult.rows ? itemsResult.rows : itemsResult;
    order.user_info = { full_name: "Khách mua hàng (Ẩn danh)", phone_number: "Chưa cập nhật SĐT", email: "Chưa cập nhật Email" };

    if (order.user_id) {
      try {
        const authResponse = await axios.get(`http://demi_auth_service:5001/api/auth/internal/users/${order.user_id}`);
        if (authResponse.data) order.user_info = authResponse.data; 
      } catch (authErr) {
        console.warn(`⚠️ [AUTH SYNC WARNING]: Không thể lấy thông tin khách hàng từ Auth-Service cho user_id ${order.user_id}`);
      }
    }

    return res.status(200).json({ success: true, data: order });

  } catch (err) {
    console.error("🔥 Lỗi API getOrderDetailAdmin:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống phân hệ đơn hàng khi tải dữ liệu chi tiết." });
  }
};

// =========================================================================
// 🚀 API 8: HỦY ĐƠN HÀNG VÀ HOÀN LẠI KHO (CỘNG KHO SẢN PHẨM)
// =========================================================================
const cancelOrder = async (req, res) => {
  try {
    const { ma_don_hang } = req.params;
    if (!ma_don_hang) return res.status(400).json({ success: false, message: "Thiếu mã đơn hàng cần hủy." });

    const checkOrderQuery = `SELECT id, trang_thai_don_hang, user_id FROM public.orders WHERE ma_don_hang = $1`;
    const checkOrderRes = db.query ? await db.query(checkOrderQuery, [ma_don_hang]) : await db.execute(checkOrderQuery, [ma_don_hang]);
    const orderInfo = checkOrderRes.rows ? checkOrderRes.rows[0] : checkOrderRes[0];

    if (!orderInfo) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });

    if (orderInfo.trang_thai_don_hang !== 'Chờ xử lý' && orderInfo.trang_thai_don_hang !== 'pending') {
        return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn hàng đang chờ xử lý." });
    }

    const itemsQuery = `SELECT variant_id, quantity FROM public.order_items WHERE order_id = $1`;
    const itemsRes = db.query ? await db.query(itemsQuery, [orderInfo.id]) : await db.execute(itemsQuery, [orderInfo.id]);
    const orderItems = itemsRes.rows ? itemsRes.rows : itemsRes;

    if (orderItems.length > 0) {
        const productServiceUrl = process.env.INTERNAL_PRODUCT_URL || 'http://demi_product_service:5002';
        try {
            await axios.post(`${productServiceUrl}/api/products/internal/restore-stock`, { items: orderItems });
            console.log(`✅ Đã hoàn kho thành công cho đơn hàng ${ma_don_hang}`);
        } catch (apiError) {
            console.error("❌ Lỗi khi hoàn kho qua Product Service:", apiError.message);
            return res.status(500).json({ success: false, message: "Lỗi hệ thống: Không thể kết nối để hoàn kho." });
        }
    }

    const updateQuery = `UPDATE public.orders SET trang_thai_don_hang = 'Đã hủy' WHERE ma_don_hang = $1`;
    db.query ? await db.query(updateQuery, [ma_don_hang]) : await db.execute(updateQuery, [ma_don_hang]);

    return res.status(200).json({ success: true, message: "Hủy đơn hàng thành công, số lượng đã được hoàn lại kho." });

  } catch (err) {
      console.error("🔥 Lỗi hủy đơn hàng:", err.message);
      return res.status(500).json({ success: false, message: "Lỗi máy chủ khi hủy đơn hàng." });
  }
};

// ========================================================
// 🎯 API 9: LẤY DANH SÁCH BƯU CỤC CHO MAP (XỬ LÝ DỮ LIỆU ĐỘNG CHUẨN TOÀN QUỐC)
// ========================================================
const getPostOffices = async (req, res) => {
  try {
    const { district_id, district_name, province_name, userLat, userLng } = req.body;
    
    const kmlPath = path.resolve(new URL('.', import.meta.url).pathname, 'danh_sach_bc.kml');
    if (!fs.existsSync(kmlPath)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
    const allStations = parseKmlWithRegex(kmlContent); 

    const searchProvince = province_name ? String(province_name).trim().toLowerCase() : "";
    const searchDistrict = district_name ? String(district_name).trim().toLowerCase() : "";

    const targetLat = parseFloat(userLat || 0);
    const targetLng = parseFloat(userLng || 0);

    // 🌟 ĐỒNG BỘ ĐỘNG TOÀN DIỆN CHỐNG GHIM SAI VÙNG:
    // Lọc theo ký tự văn bản nếu có khớp từ khóa tỉnh thành
    let filteredStations = allStations.filter(station => {
      const fullAddress = station.address.toLowerCase();
      const distName = station.districtName.toLowerCase();
      const wardName = station.wardName.toLowerCase();
      
      if (searchProvince !== "") {
        return fullAddress.includes(searchProvince) || distName.includes(searchProvince);
      }
      return true;
    });

    // Nếu lọc theo tên tỉnh thành công, tiếp tục co gọn lọc sâu xuống Quận/Huyện nhận đơn
    if (searchDistrict !== "" && filteredStations.length > 0) {
      const districtMatch = filteredStations.filter(station => {
        const cleanGhnDist = station.districtName.toLowerCase();
        return cleanGhnDist.includes(searchDistrict) || searchDistrict.includes(cleanGhnDist);
      });
      if (districtMatch.length > 0) {
        filteredStations = districtMatch;
      }
    }

    // 🎯 TẦNG DỰ PHÒNG CHỐNG TRỐNG: Nếu dữ liệu text bị rỗng hoặc lỗi lệch GPS, tự động quét bán kính hình học gần nhà khách nhất
    if (filteredStations.length === 0 && targetLat > 0 && targetLng > 0) {
      filteredStations = [...allStations].sort((a, b) => {
        const distA = ((a.location.lat - targetLat) ** 2) + ((a.location.lng - targetLng) ** 2);
        const distB = ((b.location.lat - targetLat) ** 2) + ((b.location.lng - targetLng) ** 2);
        return distA - distB;
      });
    }

    // Giới hạn số lượng bưu cục đổ về Frontend để tối ưu dung lượng mạng
    const finalResult = filteredStations.slice(0, 40);

    console.log(`[✅ KML LOGISTICS DONE] Đã xuất thành công ${finalResult.length} bưu cục động theo khu vực đơn hàng.`);
    return res.status(200).json({ success: true, data: finalResult });

  } catch (err) {
    console.error("🔥 Lỗi API getPostOffices:", err.message);
    return res.status(200).json({ success: true, data: [] });
  }
};

// ========================================================
// 🔍 API 10: ENDPOINT TEST POSTMAN KML (TRẢ VỀ TOÀN BỘ TOÀN QUỐC KHI KHÔNG TRUYỀN BIẾN)
// ========================================================
const testReadKml = async (req, res) => {
  try {
    const { district_name, province_name } = req.body;
    const kmlPath = path.resolve(new URL('.', import.meta.url).pathname, 'danh_sach_bc.kml');

    if (!fs.existsSync(kmlPath)) {
      return res.status(404).json({ success: false, message: "Không tìm thấy file danh_sach_bc.kml." });
    }

    const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
    const allStations = parseKmlWithRegex(kmlContent); 

    let finalData = [...allStations];

    const searchProvince = province_name ? String(province_name).trim().toLowerCase() : "";
    const searchKey = district_name ? String(district_name).trim().toLowerCase() : "";

    if (searchProvince !== "") {
      finalData = finalData.filter(station => 
        station.address.toLowerCase().includes(searchProvince) || 
        station.districtName.toLowerCase().includes(searchProvince)
      );
    }

    if (searchKey !== "") {
      finalData = finalData.filter(station => {
        const cleanGhnDist = station.districtName.toLowerCase();
        return cleanGhnDist.includes(searchKey) || searchKey.includes(cleanGhnDist);
      });
    }

    return res.status(200).json({
      success: true,
      total_found: finalData.length,
      total_all_file: allStations.length, 
      data: finalData
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ========================================================
// ⚡ HÀM 11: TÍNH TOÁN CỰC CẬN ĐỊA LÝ CỬA HÀNG HOẠT ĐỘNG VÀ CHI PHÍ
// ========================================================
const calculateShipping = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;

    if (!userLat || !userLng) {
      return res.status(400).json({ success: false, message: "Địa chỉ này chưa có tọa độ bản đồ!" });
    }

    const storeLat = 10.792622;
    const storeLng = 106.680172;
    const distanceKm = calcHaversine(parseFloat(userLat), parseFloat(userLng), storeLat, storeLng);

    const estimatedMinutes = Math.round((distanceKm / 30) * 60) + 15;
    const shippingFee = distanceKm <= 2 ? 0 : Math.round((distanceKm - 2) * 5000);

    return res.status(200).json({
      success: true,
      data: {
        nearestStore: { id: "DEMIMART_HQ_01", name: "Trụ sở chính Express", lat: storeLat, lng: storeLng },
        distanceKm: Number(distanceKm.toFixed(1)),
        estimatedMinutes,
        shippingFee
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function calcHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ========================================================
// ✅ KHỐI EXPORT TẬP TRUNG CHÍNH XÁC NHẤT CHO MODULE ROUTER
// ========================================================
export { 
  getShippingFee, 
  placeOrder, 
  updateInternalOrderStatus, 
  getOrderStatistics, 
  getAllOrdersAdmin, 
  getMyOrders, 
  getOrderDetailAdmin, 
  cancelOrder,
  getPostOffices,
  testReadKml,
  calculateShipping 
};