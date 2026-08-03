// File: backend/services/order-service/controllers/orderController.js

import * as Order from '../models/orderModel.js';
import axios from 'axios';
import db from '../configs/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LiveLocation } from '../models/liveLocationModel.js';

// Khởi tạo __dirname chuẩn cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// 🌟 HELPER 2: THUẬT TOÁN REGEX TRÍCH XUẤT TOÀN VẸN DỮ LIỆU KML
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

    const provinceName = extractDataField("Tỉnh/thành phố");
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
      provinceName: provinceName === "(blank)" ? "" : provinceName,
      districtName: districtName === "(blank)" ? "" : districtName,
      wardName: wardName === "(blank)" ? "" : wardName,
      street: street === "(blank)" ? "" : street,
      location: { lat, lng }
    });
    index++;
  }
  return stations;
};

// Helper tính khoảng cách Haversine giữa 2 tọa độ GPS (km)
function calcHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

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

// 2. Tiếp nhận đặt hàng (ĐÃ TỰ ĐỘNG BỔ SUNG ĐỦ 2 BƯU CỤC TRUNG TRUYỂN Ở GIỮA)
const placeOrder = async (req, res) => {
  console.log("Dữ liệu nhận được từ client:", req.body);
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

    const { 
      to_district_id, 
      to_ward_code, 
      tong_tien_hang, 
      danh_sach_san_pham,
      phuong_thuc_thanh_toan,
      to_lat,
      to_lng,
      points_used // 👈 Lấy số Xu khách muốn dùng từ request
    } = req.body;
    
    if (!to_district_id || !to_ward_code || !danh_sach_san_pham || !Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ hoặc bị thiếu!" });
    }

    const productServiceUrl = process.env.INTERNAL_PRODUCT_URL || 'http://product-service:5002';
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5006';

    let databaseVariants = [];
    try {
      const prodApiRes = await axios.get(`${productServiceUrl}/api/v1/products`);
      databaseVariants = prodApiRes.data?.data?.products || prodApiRes.data?.products || prodApiRes.data || [];
    } catch (err) {}

    let inventoryCatalog = [];
    try {
      const invRes = await axios.get(`${inventoryServiceUrl}/api/v1/inventory`);
      inventoryCatalog = invRes.data || [];
    } catch (err) {
      console.warn("⚠️ Không lấy được danh mục kho.");
    }

    const normalizedItems = danh_sach_san_pham.map(item => {
      const vId = String(item.variant_id || item.variantId);
      const pName = String(item.name || item.product_name || "Sản phẩm Demi Mart").trim();
      let finalSku = item.sku || null;
      let finalMaSanPham = item.ma_san_pham || item.productId || null; 
      let foundImage = item.image_url || "";
      
      if (!foundImage && databaseVariants.length > 0) {
        for (const prod of databaseVariants) {
          if (prod.hinh_anh_chinh) foundImage = prod.hinh_anh_chinh;
          if (prod.bien_the_san_pham) {
            const matched = prod.bien_the_san_pham.find(v => String(v.id) === vId);
            if (matched && matched.image_url) foundImage = matched.image_url;
          }
        }
      }

      if (!finalSku && databaseVariants.length > 0) {
        for (const prod of databaseVariants) {
          if (prod.bien_the_san_pham && Array.isArray(prod.bien_the_san_pham)) {
            const matched = prod.bien_the_san_pham.find(v => String(v.ma_bien_the) === vId || String(v.id) === vId);
            if (matched && matched.sku) finalSku = matched.sku;
            if (matched && !finalMaSanPham) finalMaSanPham = prod.ma_san_pham;
          }
        }
      }

      if (!finalSku && inventoryCatalog.length > 0) {
        const matchedStock = inventoryCatalog.find(stock => 
          String(stock.name).toLowerCase().trim() === pName.toLowerCase()
        );
        if (matchedStock) {
          finalSku = matchedStock.id;
        }
      }

      if (!finalSku) finalSku = vId;

      return {
        variant_id: vId,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0), 
        product_name: pName,
        variant_name: item.variant_name || item.phan_loai || "Mặc định",
        image_url: foundImage,
        ma_san_pham: finalMaSanPham, 
        sku: finalSku 
      };
    }).filter(i => i.variant_id && i.quantity > 0);

    try {
      await Promise.all(normalizedItems.map(async (item) => {
        await axios.post(`${inventoryServiceUrl}/api/v1/inventory/deduct-fifo`, {
          sku: item.sku,         
          quantity: item.quantity 
        });
      }));
    } catch (apiError) {
      console.error("❌ Lỗi trừ kho từ Inventory Service:", apiError.response?.data || apiError.message);
      return res.status(400).json({ 
        success: false, 
        message: "Rất tiếc, sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng thực tế trong kho!" 
      });
    }

    const clientShippingFee = Number(req.body.phi_van_chuyen);
    const validShippingCost = (!isNaN(clientShippingFee) && clientShippingFee >= 0) ? clientShippingFee : 25000;
    req.body.phi_van_chuyen = validShippingCost;
    req.body.don_vi_van_chuyen = req.body.don_vi_van_chuyen || 'Siêu thị DemiMart Express';

    // 👉 ĐÃ SỬA: Tính tổng tiền sơ bộ và bắt lỗi < 0
    let finalTotal = Number(tong_tien_hang) + validShippingCost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 0) finalTotal = 0; 

    // =========================================================
    // 🌟 LOGIC DÙNG XU GIẢM GIÁ (SHOPEE COIN MODEL)
    // =========================================================
    const userPointsToUse = Number(points_used || 0);
    if (userPointsToUse > 0) {
      // Đảm bảo không dùng quá tổng tiền đơn hàng
      const validPointsToUse = Math.min(userPointsToUse, finalTotal); 

      try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
        
        // Gọi sang Auth-Service yêu cầu trừ Xu (Sync call để đảm bảo có tiền mới cho tạo đơn)
        const pointRes = await axios.post(`${authUrl}/api/v1/auth/loyalty/spend`, {
          userId: String(userId),
          points: validPointsToUse,
          referenceId: `ORD_PENDING_${Date.now()}` // Ghi mã tạm thời vào lịch sử
        });

        if (pointRes.data && pointRes.data.success) {
          // Trừ Xu thành công -> Giảm thẳng vào tổng hóa đơn
          finalTotal = finalTotal - validPointsToUse;
          console.log(`🪙 Khách hàng đã dùng ${validPointsToUse} Xu. Tổng tiền phải trả mới: ${finalTotal}đ`);
          req.body.points_used = validPointsToUse; // Chốt số Xu đã dùng để lưu DB orders
        }
      } catch (pointErr) {
        console.error("🔥 Lỗi không đủ Xu hoặc lỗi hệ thống:", pointErr.response?.data || pointErr.message);
        
        // CỰC KỲ QUAN TRỌNG: Nếu lỗi trừ Xu, phải hoàn lại sản phẩm vào kho
        // vì ở trên chúng ta đã gọi deduct-fifo trừ kho mất rồi
        try {
           // Giả định bạn có endpoint trả hàng, hoặc ta báo lỗi ra để xử lý
           console.warn("Cần phải rollback tồn kho do giao dịch trừ xu thất bại!");
           // await axios.post(`${productServiceUrl}/api/v1/products/internal/restore-stock`, { items: normalizedItems });
        } catch(e) {}

        return res.status(400).json({ 
          success: false, 
          message: pointErr.response?.data?.message || "Số dư Demi Xu không đủ để thanh toán. Vui lòng thử lại!" 
        });
      }
    } else {
      req.body.points_used = 0;
    }
    // =========================================================

    req.body.tong_thanh_toan = finalTotal;

    const rgbLatNum = parseFloat(to_lat || 10.762622);
    const rgbLngNum = parseFloat(to_lng || 106.660172);

    const normalizedOrder = {
      ...req.body,
      trang_thai_don_hang: 'Chờ xác nhận',
      danh_sach_san_pham: normalizedItems,
      paypal_transaction_id: req.body.paypal_transaction_id || null,
      paypal_order_id: req.body.paypal_order_id || null,
      to_lat: rgbLatNum,
      to_lng: rgbLngNum
    };

    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công với mã:", order.ma_don_hang);

    // 🚀 BƯỚC 1: TRẢ KẾT QUẢ VỀ FRONTEND NGAY LẬP TỨC ĐỂ TRÁNH TIMEOUT
    res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
      message: "Đặt hàng thành công! Hệ thống đang xử lý lộ trình giao hàng." 
    });

    // 🔄 BƯỚC 2: ĐẨY TOÀN BỘ TÁC VỤ NẶNG XUỐNG TIẾN TRÌNH CHẠY NGẦM (BACKGROUND)
    // IIFE (async () => {...})() giúp Node.js chạy ngầm mà không block request
    (async () => {
      try {
        // --- 1. TỰ ĐỘNG XÁC NHẬN SAU 1 PHÚT ---
        setTimeout(async () => {
          try {
            const getStatusQuery = `SELECT trang_thai_don_hang FROM public.orders WHERE id = $1`;
            const statusRes = db.query ? await db.query(getStatusQuery, [order.id]) : await db.execute(getStatusQuery, [order.id]);
            const currentDbStatus = (statusRes.rows ? statusRes.rows[0] : statusRes[0])?.trang_thai_don_hang;
            
            if (currentDbStatus && String(currentDbStatus).trim().toLowerCase() === 'đã hủy') return; 
            
            const autoConfirmQuery = `UPDATE public.orders SET trang_thai_don_hang = 'Xác nhận' WHERE id = $1 AND trang_thai_don_hang != 'Đã hủy'`;
            if (db.query) await db.query(autoConfirmQuery, [order.id]);
            else await db.execute(autoConfirmQuery, [order.id]);
          } catch (timerErr) {}
        }, 60000);

        // --- 2. TÍNH TOÁN LỘ TRÌNH VÀ LƯU 4 BƯU CỤC ---
        try {
          const storeLat = 10.771963;
          const storeLng = 106.697194;
          const directDistanceToStore = calcHaversine(rgbLatNum, rgbLngNum, storeLat, storeLng);
          const stationsToSave = [];

          if (directDistanceToStore <= 32.0) {
            console.log(`[🚀 NỘI TỈNH - GIAO THẲNG]: Khách hàng thuộc cùng khu vực tỉnh/thành phố (~${directDistanceToStore.toFixed(2)} km).`);
            stationsToSave.push({
              station_id: 'DIRECT_STORE_HQ',
              station_name: 'Tổng Kho Điều Phối Siêu Tốc DemiMart',
              tinh_thanh: 'Thành phố Hồ Chí Minh',
              quan_huyen: 'Quận 1',
              phuong_xa: 'Bến Thành',
              so_nha_duong: 'Khu vực phân phối cự ly gần',
              station_lat: storeLat,
              station_lng: storeLng,
              station_type: 'FIRST_MILE',
              action_type: 'GIAO_THANG_TRỰC_TIEP',
              trang_thai_hien_thi: 'Đơn hàng nội tỉnh - Hệ thống xuất kho giao trực tiếp siêu tốc đến bạn'
            });
          } else {
            console.log('[Trending Ngoại Tỉnh]: Cấu hình luồng trục đa điểm có Bưu Cục Trung Chuyển.');
            const kmlPath = path.join(__dirname, 'danh_sach_bc.kml');
            let rawPostOffices = [];

            if (fs.existsSync(kmlPath)) {
              const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
              rawPostOffices = parseKmlWithRegex(kmlContent);
            }

            if (rawPostOffices.length > 0) {
              const optimalFirstMileOffice = rawPostOffices.reduce((prev, curr) => {
                const prevDist = calcHaversine(storeLat, storeLng, prev.location.lat, prev.location.lng);
                const currDist = calcHaversine(storeLat, storeLng, curr.location.lat, curr.location.lng);
                return currDist < prevDist ? curr : prev;
              }, rawPostOffices[0]);

              const optimalLastMileOffice = rawPostOffices.reduce((prev, curr) => {
                const prevDist = calcHaversine(rgbLatNum, rgbLngNum, prev.location.lat, prev.location.lng);
                const currDist = calcHaversine(rgbLatNum, rgbLngNum, curr.location.lat, curr.location.lng);
                return currDist < prevDist ? curr : prev;
              }, rawPostOffices[0]);

              let waypoints = [`${storeLng},${storeLat}`];
              if (optimalFirstMileOffice) waypoints.push(`${optimalFirstMileOffice.location.lng},${optimalFirstMileOffice.location.lat}`);

              const isTayNguyenZone = rgbLngNum < 108.2 && rgbLatNum > 11.5 && rgbLatNum < 15.0;
              if (isTayNguyenZone) {
                waypoints.push("106.883412,11.521093");
                waypoints.push("107.684125,12.001254");
              } else if (rgbLatNum > 11.2) {
                waypoints.push("107.234125,10.938512");
                waypoints.push("108.106943,10.933391");
                if (rgbLatNum > 12.0) waypoints.push("109.196749,12.245071");
                if (rgbLatNum > 13.5) waypoints.push("109.219515,13.774697");
                if (rgbLatNum > 16.0) waypoints.push("108.221464,16.059541");
                if (rgbLatNum > 18.0) waypoints.push("105.681123,18.673412");
                if (rgbLatNum > 20.0) waypoints.push("105.820421,20.251093");
              }

              waypoints.push(`${optimalLastMileOffice.location.lng},${optimalLastMileOffice.location.lat}`);
              waypoints.push(`${rgbLngNum},${rgbLatNum}`);

              const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints.join(';')}?overview=full&geometries=geojson`;
              const routeRes = await axios.get(osrmUrl);
              
              stationsToSave.push({
                station_id: String(optimalFirstMileOffice.id),
                station_name: String(optimalFirstMileOffice.name),
                tinh_thanh: String(optimalFirstMileOffice.provinceName || ''),
                quan_huyen: String(optimalFirstMileOffice.districtName || ''),
                phuong_xa: String(optimalFirstMileOffice.wardName || ''),
                so_nha_duong: String(optimalFirstMileOffice.street || optimalFirstMileOffice.address || ''),
                station_lat: parseFloat(optimalFirstMileOffice.location.lat),
                station_lng: parseFloat(optimalFirstMileOffice.location.lng),
                station_type: 'FIRST_MILE',
                action_type: 'GOM_HANG_DIEU_PHOI',
                trang_thai_hien_thi: 'Đã tiếp nhận hàng tại bưu cục điều phối chặng đầu'
              });

              if (routeRes.data?.code === "Ok" && routeRes.data.routes[0]?.geometry?.coordinates) {
                const coordinates = routeRes.data.routes[0].geometry.coordinates;
                const idx1 = Math.floor(coordinates.length * 0.33);
                const idx2 = Math.floor(coordinates.length * 0.66);

                const coordMid1 = coordinates[idx1];
                const coordMid2 = coordinates[idx2];

                const midStation1 = rawPostOffices.reduce((prev, curr) => {
                  const prevDist = calcHaversine(coordMid1[1], coordMid1[0], prev.location.lat, prev.location.lng);
                  const currDist = calcHaversine(coordMid1[1], coordMid1[0], curr.location.lat, curr.location.lng);
                  return currDist < prevDist ? curr : prev;
                }, rawPostOffices[0]);

                const midStation2 = rawPostOffices.reduce((prev, curr) => {
                  const prevDist = calcHaversine(coordMid2[1], coordMid2[0], prev.location.lat, prev.location.lng);
                  const currDist = calcHaversine(coordMid2[1], coordMid2[0], curr.location.lat, curr.location.lng);
                  return currDist < prevDist ? curr : prev;
                }, rawPostOffices[0]);

                if (midStation1.id !== optimalFirstMileOffice.id && midStation1.id !== optimalLastMileOffice.id) {
                  stationsToSave.push({
                    station_id: String(midStation1.id),
                    station_name: `Kho Trung Chuyển ${midStation1.provinceName || midStation1.districtName}`,
                    tinh_thanh: String(midStation1.provinceName || ''),
                    quan_huyen: String(midStation1.districtName || ''),
                    phuong_xa: String(midStation1.wardName || ''),
                    so_nha_duong: String(midStation1.street || midStation1.address || ''),
                    station_lat: parseFloat(midStation1.location.lat),
                    station_lng: parseFloat(midStation1.location.lng),
                    station_type: 'HUB',
                    action_type: 'TRUNG_CHUYEN',
                    trang_thai_hien_thi: `Hàng đã cập kho trung chuyển ${midStation1.districtName || midStation1.provinceName}`
                  });
                }

                if (midStation2.id !== optimalFirstMileOffice.id && midStation2.id !== optimalLastMileOffice.id && midStation2.id !== midStation1.id) {
                  stationsToSave.push({
                    station_id: String(midStation2.id),
                    station_name: `Bưu Cục Trung Chuyển ${midStation2.districtName || midStation2.wardName}`,
                    tinh_thanh: String(midStation2.provinceName || ''),
                    quan_huyen: String(midStation2.districtName || ''),
                    phuong_xa: String(midStation2.wardName || ''),
                    so_nha_duong: String(midStation2.street || midStation2.address || ''),
                    station_lat: parseFloat(midStation2.location.lat),
                    station_lng: parseFloat(midStation2.location.lng),
                    station_type: 'HUB',
                    action_type: 'TRUNG_CHUYEN',
                    trang_thai_hien_thi: `Đã luân chuyển qua trạm phân loại ${midStation2.districtName}`
                  });
                }
              }

              if (optimalLastMileOffice.id !== optimalFirstMileOffice.id) {
                stationsToSave.push({
                  station_id: String(optimalLastMileOffice.id),
                  station_name: String(optimalLastMileOffice.name),
                  tinh_thanh: String(optimalLastMileOffice.provinceName || ''),
                  quan_huyen: String(optimalLastMileOffice.districtName || ''),
                  phuong_xa: String(optimalLastMileOffice.wardName || ''),
                  so_nha_duong: String(optimalLastMileOffice.street || optimalLastMileOffice.address || ''),
                  station_lat: parseFloat(optimalLastMileOffice.location.lat),
                  station_lng: parseFloat(optimalLastMileOffice.location.lng),
                  station_type: 'LAST_MILE',
                  action_type: 'DIEU_PHOI_PHAT',
                  trang_thai_hien_thi: 'Đã cập bưu cục phát chặng cuối'
                });
              }
            }
          }

          console.log(`📦 Đã khởi tạo ${stationsToSave.length} Bưu cục cho đơn hàng ${order.ma_don_hang}`);

          const insertLogQuery = `
            INSERT INTO public.order_tracking_logs (
              order_id, ma_don_hang, station_id, station_name,
              tinh_thanh, quan_huyen, phuong_xa, so_nha_duong,
              station_lat, station_lng, station_type, action_type,
              trang_thai_hien_thi, ngay_tao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          `;

          for (const station of stationsToSave) {
            const queryParams = [
              Number(order.id),
              String(order.ma_don_hang),
              station.station_id,
              station.station_name,
              station.tinh_thanh,
              station.quan_huyen,
              station.phuong_xa,
              station.so_nha_duong,
              parseFloat(station.station_lat),
              parseFloat(station.station_lng),
              station.station_type,
              station.action_type,
              station.trang_thai_hien_thi
            ];

            if (db.query) await db.query(insertLogQuery, queryParams);
            else await db.execute(insertLogQuery, queryParams);
          }
        } catch (logisticsErr) {
          console.error('⚠️ Cảnh báo lỗi cấu trúc hành trình:', logisticsErr.message);
        }

        // --- 3. ĐỒNG BỘ THANH TOÁN PAYPAL ---
        const methodUpper = String(phuong_thuc_thanh_toan || '').toUpperCase().trim();
        if (methodUpper !== 'COD' && methodUpper !== '') {
          try {
            const safeOrderId = req.body.paypal_order_id || `GATEWAY_${order.ma_don_hang}`;
            const safeTxnId = req.body.paypal_transaction_id || `TXN_${Date.now()}`;
            await axios.post('http://demi_payment_service:5004/api/v1/paypal-capture', {
              ma_don_hang: String(order.ma_don_hang),
              so_tien: Number(finalTotal),
              phuong_thuc_thanh_toan: methodUpper,
              trang_thai_thanh_toan: String(req.body.trang_thai_thanh_toan || 'PENDING'),
              paypal_order_id: String(safeOrderId),
              capture_data: { status: 'COMPLETED', id: String(safeTxnId), shared_from: 'order_service' }
            });
          } catch (syncErr) {}
        }

        // --- 4. BẮN THÔNG BÁO WEBSOCKET ---
        try {
          await axios.post('http://notification-service:8085/api/v1/notifications/send', {
            userId: String(userId),
            channel: "websocket",
            title: "🎉 Đặt hàng thành công",
            description: `Đơn hàng ${order.ma_don_hang} của bạn đã được hệ thống ghi nhận và đang chờ giao cho đơn vị vận chuyển.`,
            type: "order" 
          });
        } catch (notiError) {
          console.warn("⚠️ Gửi thông báo thất bại:", notiError.message);
        }

      } catch (backgroundErr) {
        console.error("🔥 Lỗi tiến trình chạy ngầm:", backgroundErr);
      }
    })();

  } catch (err) {
    // Chỉ lọt vào catch này nếu lỗi xảy ra TRƯỚC khi gọi res.status(201).json
    console.error("🔥 [LỖI TẠO ĐƠN HÀNG LOG CHI TIẾT]:", err.message);
    // Kiểm tra headersSent để đảm bảo không dính lỗi ERR_HTTP_HEADERS_SENT
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: "Lỗi hệ thống phân hệ đơn hàng khi khởi tạo!" 
      });
    }
  }
};

// 3. Tiếp nhận đồng bộ trạng thái từ Payment-Service
const updateInternalOrderStatus = async (req, res) => {
  try {
    const { ma_don_hang, trang_thai_thanh_toan } = req.body;
    if (!ma_don_hang || !trang_thai_thanh_toan) return res.status(400).json({ success: false, message: 'Thiếu thông tin đồng bộ trạng thái đơn hàng!' });

    const sqlQuery = `UPDATE public.orders SET trang_thai_thanh_toan = $1 WHERE ma_don_hang = $2`;
    if (db.query) await db.query(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);
    else await db.execute(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);

    return res.status(200).json({ success: true, message: 'Đồng bộ trạng thái hóa đơn nội bộ thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi đồng bộ cơ sở dữ liệu phân hệ đơn hàng!' });
  }
};

// 4. Thống kê đơn hàng cho Admin Dashboard
const getOrderStatistics = async (req, res) => {
  try {
    const statsQuery = `
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao') THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('pending', 'cho_xu_ly', 'chờ xử lý', 'dang_xu_ly', 'chờ xác nhận', '') THEN 1 ELSE 0 END) as pending_orders,
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

    const gridQuery = `SELECT ma_don_hang, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, ngay_tao FROM public.orders ORDER BY ngay_tao DESC LIMIT 5`;
    const recentRes = db.query ? await db.query(gridQuery) : await db.execute(gridQuery);
    const recentOrders = recentRes.rows ? recentRes.rows : recentRes;

    const totalOrdersCount = Number(stats.total_orders || 0);
    const totalRevenueAmount = Number(stats.total_revenue || 0);
    const averageOrderValue = totalOrdersCount > 0 ? (totalRevenueAmount / totalOrdersCount) : 0;

    const formattedRecentOrders = recentOrders.map(item => ({
        id: item.ma_don_hang || "N/A",
        customer: "Khách hàng Demi", 
        date: new Date(item.ngay_tao).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        total: Number(item.tong_thanh_toan),
        status: item.trang_thai_don_hang || "Chờ xác nhận"
    }));

    return res.status(200).json({
      success: true,
      data: {
        overview: { total_orders: totalOrdersCount, delivered_orders: Number(stats.delivered_orders || 0), pending_orders: Number(stats.pending_orders || 0), today_orders: Number(stats.today_orders || 0), total_revenue: totalRevenueAmount, avg_order_value: Math.round(averageOrderValue) },
        recent_orders: formattedRecentOrders
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi trích xuất thống kê đơn hàng." });
  }
};

// 5. Lấy danh sách đơn hàng admin phân trang
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
        o.id, 
        o.ma_don_hang, 
        o.phuong_thuc_thanh_toan, 
        o.trang_thai_thanh_toan, 
        o.trang_thai_don_hang, 
        o.tong_thanh_toan, 
        o.ngay_tao,
        o.to_lat, o.to_lng,
        COALESCE(
          (
            SELECT station_name 
            FROM public.order_tracking_logs tl 
            WHERE tl.order_id = o.id 
            ORDER BY tl.id DESC 
            LIMIT 1
          ), 
          'Đang chờ phân bổ trạm trục'
        ) AS tram_hien_tai,
        (
          SELECT json_agg(json_build_object('product_name', oi.product_name, 'variant_name', oi.variant_name, 'quantity', oi.quantity, 'price', oi.price, 'image_url', oi.image_url)) 
          FROM public.order_items oi 
          WHERE oi.order_id = o.id
        ) AS danh_sach_san_pham
      FROM public.orders o 
      ${whereClause} 
      ORDER BY o.ngay_tao DESC 
      LIMIT CAST($${pIdx} AS INTEGER) OFFSET CAST($${pIdx + 1} AS INTEGER);
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

// 6. Lấy lịch sử mua hàng cá nhân
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });
    const orders = await Order.getByUserId(userId);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy lịch sử đơn hàng cá nhân." });
  }
};

// 6.1 Lấy lịch sử đơn hàng theo userId (Admin)
const getOrdersByUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId trong params." });
    const orders = await Order.getByUserId(userId);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("🔥 Lỗi API getOrdersByUserAdmin:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh sách đơn hàng của khách." });
  }
};

// 7. Lấy chi tiết đơn hàng cho Admin
const getOrderDetailAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumber = /^\d+$/.test(id); 
    
    let orderSql = isNumber 
      ? `SELECT id, user_id, ma_don_hang, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, tong_thanh_toan, phi_van_chuyen, to_lat, to_lng, ngay_tao FROM public.orders WHERE id = $1 LIMIT 1;`
      : `SELECT id, user_id, ma_don_hang, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, tong_thanh_toan, phi_van_chuyen, to_lat, to_lng, ngay_tao FROM public.orders WHERE ma_don_hang = $1 LIMIT 1;`;
  
    const orderResult = db.query ? await db.query(orderSql, [isNumber ? Number(id) : id]) : await db.execute(orderSql, [isNumber ? Number(id) : id]);
    const order = orderResult.rows ? orderResult.rows[0] : orderResult[0];

    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });

    const itemsSql = `SELECT id, order_id, variant_id, quantity, price, product_name, variant_name, image_url, ma_san_pham, sku FROM public.order_items WHERE order_id = $1;`;
    const itemsResult = db.query ? await db.query(itemsSql, [order.id]) : await db.execute(itemsSql, [order.id]);
    order.danh_sach_san_pham = itemsResult.rows ? itemsResult.rows : itemsResult;
    order.user_info = { full_name: "Khách mua hàng", phone_number: "Chưa cập nhật", email: "Chưa cập nhật" };

    if (order.user_id) {
      try {
        const authResponse = await axios.get(`http://demi_auth_service:5001/api/v1/auth/internal/users/${order.user_id}`);
        if (authResponse.data) order.user_info = authResponse.data; 
      } catch (authErr) {
        console.warn("Lỗi fetch user info");
      }
    }

    try {
      const liveData = await LiveLocation.findOne({ ma_don_hang: String(order.ma_don_hang).trim() });
      if (liveData) {
        order.current_lat = liveData.current_location.coordinates[1];
        order.current_lng = liveData.current_location.coordinates[0];
        order.current_station_index = liveData.current_station_index;
        order.current_coord_index = liveData.current_coord_index;
        order.status_text = liveData.status_text;
      }
    } catch (mongoFetchErr) {
      console.error("⚠️ Lỗi trích xuất từ MongoDB:", mongoFetchErr.message);
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("🔥 Lỗi getOrderDetailAdmin:", err);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải dữ liệu." });
  }
};

// 8. Hủy đơn hàng
const cancelOrder = async (req, res) => {
  try {
    const { ma_don_hang } = req.params;

    const checkOrderQuery = `SELECT id, user_id, ma_don_hang, trang_thai_don_hang, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan FROM public.orders WHERE ma_don_hang = $1`;
    const checkOrderRes = db.query ? await db.query(checkOrderQuery, [ma_don_hang]) : await db.execute(checkOrderQuery, [ma_don_hang]);
    const orderInfo = checkOrderRes.rows ? checkOrderRes.rows[0] : checkOrderRes[0];

    if (!orderInfo) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }
    
    const currentStatus = String(orderInfo.trang_thai_don_hang).trim().toLowerCase();
    
    if (currentStatus === 'đã hủy' || currentStatus === 'cancelled') {
      return res.status(200).json({ success: true, message: "Đơn hàng này đã được hủy thành công." });
    }
    if (currentStatus !== 'chờ xác nhận' && currentStatus !== 'pending' && currentStatus !== 'chờ xử lý') {
      return res.status(400).json({ success: false, message: "Đơn hàng đã được bàn giao vận chuyển, không thể hủy." });
    }

    const itemsQuery = `SELECT variant_id, quantity FROM public.order_items WHERE order_id = $1`;
    const itemsRes = db.query ? await db.query(itemsQuery, [orderInfo.id]) : await db.execute(itemsQuery, [orderInfo.id]);
    const orderItems = itemsRes.rows ? itemsRes.rows : itemsRes;

    if (orderItems.length > 0) {
      const productServiceUrl = process.env.INTERNAL_PRODUCT_URL || 'http://demi_product_service:5002';
      try {
        await axios.post(`${productServiceUrl}/api/v1/products/internal/restore-stock`, { items: orderItems }, { timeout: 4000 });
      } catch (apiError) {
        console.warn("⚠️ Cảnh báo: Không thể kết nối Service kho để hoàn hàng, vẫn tiếp tục luồng hủy đơn.");
      }
    }

    console.log(`[🚀 LOGISTICS CLEANUP]: Tiến hành xóa sạch lộ trình trạm trục của đơn hàng: ${ma_don_hang}`);
    const deleteTrackingLogsQuery = `DELETE FROM public.order_tracking_logs WHERE order_id = $1 OR ma_don_hang = $2`;
    if (db.query) {
      await db.query(deleteTrackingLogsQuery, [orderInfo.id, String(ma_don_hang)]);
    } else {
      await db.execute(deleteTrackingLogsQuery, [orderInfo.id, String(ma_don_hang)]);
    }

    const updateQuery = `UPDATE public.orders SET trang_thai_don_hang = 'Đã hủy' WHERE ma_don_hang = $1`;
    if (db.query) {
      await db.query(updateQuery, [ma_don_hang]);
    } else {
      await db.execute(updateQuery, [ma_don_hang]);
    }

    // Hoàn tiền vào ví DemiPay nếu đã thanh toán trước
    try {
      const paymentStatus = String(orderInfo.trang_thai_thanh_toan).trim().toLowerCase();
      const paymentMethod = String(orderInfo.phuong_thuc_thanh_toan).trim().toUpperCase();
      
      const isPaid = ['completed', 'da_thanh_toan', 'đã thanh toán', 'success'].includes(paymentStatus);
      const isPrepaid = ['VNPAY', 'PAYPAL'].includes(paymentMethod);

      if (isPaid && isPrepaid && orderInfo.user_id) {
        await axios.post('http://auth-service:5001/api/v1/auth/internal/wallet/refund', {
          userId: orderInfo.user_id,
          amount: Number(orderInfo.tong_thanh_toan),
          orderId: orderInfo.ma_don_hang,
          method: paymentMethod
        });
        console.log(`💰 Đã hoàn ${orderInfo.tong_thanh_toan}đ vào ví DemiPay cho đơn ${orderInfo.ma_don_hang}`);
      }
    } catch (refundErr) {
      console.warn("⚠️ Hoàn tiền ví thất bại:", refundErr.message);
    }
    
    // Bắn thông báo hủy đơn
    try {
      if (orderInfo.user_id) {
        await axios.post('http://notification-service:8085/api/v1/notifications/send', {
          userId: String(orderInfo.user_id),
          channel: "websocket",
          title: "🚫 Đơn hàng đã bị hủy",
          description: `Đơn hàng ${ma_don_hang} của bạn đã được hủy thành công.`,
          type: "system"
        });
      }
    } catch (notiError) {
      console.warn("⚠️ Gửi thông báo hủy thất bại:", notiError.message);
    }

    return res.status(200).json({ 
      success: true, 
      message: "Đơn hàng đã được hủy và lưu vào lịch sử giao dịch. Toàn bộ trạm trục định vị đã được xóa sạch." 
    });

  } catch (err) {
    console.error("🔥 [LỖI HỦY ĐƠN HÀNG]:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi hủy đơn hàng." });
  }
};

// 9. Lấy danh sách bưu cục cho Map
const getPostOffices = async (req, res) => {
  try {
    const { district_name, province_name, userLat, userLng } = req.body;
    const kmlPath = path.join(__dirname, 'danh_sach_bc.kml');
    if (!fs.existsSync(kmlPath)) return res.status(200).json({ success: true, data: [] });
    const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
    const allStations = parseKmlWithRegex(kmlContent); 
    const searchProvince = province_name ? String(province_name).trim().toLowerCase() : "";
    const searchDistrict = district_name ? String(district_name).trim().toLowerCase() : "";
    const targetLat = parseFloat(userLat || 0);
    const targetLng = parseFloat(userLng || 0);

    let filteredStations = allStations.filter(station => {
      const fullAddress = station.address.toLowerCase();
      if (searchProvince !== "") return fullAddress.includes(searchProvince) || station.districtName.toLowerCase().includes(searchProvince);
      return true;
    });

    if (searchDistrict !== "" && filteredStations.length > 0) {
      const districtMatch = filteredStations.filter(station => station.districtName.toLowerCase().includes(searchDistrict) || searchDistrict.includes(station.districtName.toLowerCase()));
      if (districtMatch.length > 0) filteredStations = districtMatch;
    }

    if (filteredStations.length === 0 && targetLat > 0 && targetLng > 0) {
      filteredStations = [...allStations].sort((a, b) => (((a.location.lat - targetLat) ** 2) + ((a.location.lng - targetLng) ** 2)) - (((b.location.lat - targetLat) ** 2) + ((b.location.lng - targetLng) ** 2)));
    }
    
    return res.status(200).json({ success: true, data: filteredStations.slice(0, 40) });
  } catch (err) {
    return res.status(200).json({ success: true, data: [] });
  }
};

// 10. Endpoint test KML
const testReadKml = async (req, res) => {
  try {
    const { district_name, province_name } = req.body;
    const kmlPath = path.join(__dirname, 'danh_sach_bc.kml');
    if (!fs.existsSync(kmlPath)) return res.status(404).json({ success: false, message: "Không tìm thấy file danh_sach_bc.kml." });

    const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
    const allStations = parseKmlWithRegex(kmlContent); 
    let finalData = [...allStations];

    if (province_name) finalData = finalData.filter(s => s.address.toLowerCase().includes(province_name.toLowerCase()) || s.districtName.toLowerCase().includes(province_name.toLowerCase()));
    if (district_name) finalData = finalData.filter(s => s.districtName.toLowerCase().includes(district_name.toLowerCase()) || district_name.toLowerCase().includes(s.districtName.toLowerCase()));

    return res.status(200).json({ success: true, total_found: finalData.length, total_all_file: allStations.length, data: finalData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 11. Tính toán địa lý và chi phí (ĐÃ HOÀN CHỈNH BẬC THANG & MỨC TRẦN)
const calculateShipping = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;
    if (!userLat || !userLng) return res.status(400).json({ success: false, message: "Địa chỉ này chưa có tọa độ bản đồ!" });

    const storeLat = 10.792622;
    const storeLng = 106.680172;
    
    // Khoảng cách theo đường chim bay (KM)
    const distanceKm = calcHaversine(parseFloat(userLat), parseFloat(userLng), storeLat, storeLng);
    
    let shippingFee = 0;
    let estimatedMinutes = 0;

    // 🚚 TRƯỜNG HỢP 1: NỘI TỈNH / CỰ LY GẦN (Dưới 32km - Giao siêu tốc)
    if (distanceKm <= 32) {
      // Tốc độ di chuyển nội thành ước tính 30km/h
      estimatedMinutes = Math.round((distanceKm / 30) * 60) + 15; 
      
      if (distanceKm <= 2) {
        shippingFee = 0; // Giữ nguyên luật cũ: Dưới 2km freeship
      } else {
        // Trên 2km: Tính 5.000đ cho mỗi KM tiếp theo
        shippingFee = Math.round((distanceKm - 2) * 5000); 
      }
    } 
    // 🚛 TRƯỜNG HỢP 2: NGOẠI TỈNH / CỰ LY XA (Gửi đơn vị vận chuyển)
    else {
      // Thời gian giao hàng: Cộng thêm 2 ngày (2880 phút) + thời gian di chuyển
      estimatedMinutes = Math.round(2880 + (distanceKm / 500) * 1440); 
      
      // Phí cơ bản 35k, cứ mỗi 50km tiếp theo thì cộng nhẹ thêm 5k
      const baseFee = 35000;
      const extraDistanceFee = Math.floor((distanceKm - 32) / 50) * 5000;
      shippingFee = baseFee + extraDistanceFee;
      
      // 🌟 RÀNG BUỘC QUAN TRỌNG: MỨC TRẦN GIÁ SHIP (MAX CAP)
      // Dù xa đến mấy (Hà Nội, Lào Cai...) thì tiền ship cũng tối đa 80.000đ
      const MAX_SHIPPING_FEE = 80000; 
      if (shippingFee > MAX_SHIPPING_FEE) {
        shippingFee = MAX_SHIPPING_FEE;
      }
    }

    return res.status(200).json({
      success: true,
      data: { 
        nearestStore: { 
          id: "DEMIMART_HQ_01", 
          name: "Trụ sở chính Express", 
          lat: storeLat, 
          lng: storeLng 
        }, 
        distanceKm: Number(distanceKm.toFixed(1)), 
        estimatedMinutes, 
        shippingFee 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 12. Truy vấn lộ trình bưu cục
const getOrderTrackingLogs = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu thông tin mã ID đơn hàng để truy vấn lộ trình!" 
      });
    }
    const isMaDonHangStr = /^[A-Za-z]/.test(String(orderId).trim());

    let selectQuery = "";
    let queryParam = null;

    if (isMaDonHangStr) {
      selectQuery = `
        SELECT 
          id, order_id, ma_don_hang, station_id, station_name, 
          tinh_thanh, quan_huyen, phuong_xa, so_nha_duong, 
          station_lat, station_lng, station_type, action_type, 
          trang_thai_hien_thi, ngay_tao
        FROM public.order_tracking_logs
        WHERE ma_don_hang = $1
        ORDER BY id ASC
      `;
      queryParam = String(orderId).trim();
    } else {
      selectQuery = `
        SELECT 
          id, order_id, ma_don_hang, station_id, station_name, 
          tinh_thanh, quan_huyen, phuong_xa, so_nha_duong, 
          station_lat, station_lng, station_type, action_type, 
          trang_thai_hien_thi, ngay_tao
        FROM public.order_tracking_logs
        WHERE order_id = $1
        ORDER BY id ASC
      `;
      queryParam = Number(orderId);
    }

    let result;
    if (db.query) {
      result = await db.query(selectQuery, [queryParam]);
    } else {
      result = await db.execute(selectQuery, [queryParam]);
    }
    const logs = result.rows ? result.rows : result[0] || [];

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });

  } catch (err) {
    console.error("🔥 Lỗi API getOrderTrackingLogs:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống khi trích xuất dữ liệu nhật ký lộ trình." 
    });
  }
};

// 13. Ghi log logistics realtime
const createOrderTrackingLogNode = async (req, res) => {
  try {
    const {
      order_id,
      ma_don_hang,
      station_id,
      station_name,
      tinh_thanh,
      quan_huyen,
      phuong_xa,
      so_nha_duong,
      station_lat,
      station_lng,
      station_type,
      action_type,
      trang_thai_hien_thi
    } = req.body;

    const checkDuplicateQuery = `
      SELECT id FROM public.order_tracking_logs 
      WHERE order_id = $1 AND trang_thai_hien_thi = $2 
      LIMIT 1
    `;
    let checkRes;
    if (db.query) {
      checkRes = await db.query(checkDuplicateQuery, [Number(order_id), trang_thai_hien_thi]);
    } else {
      checkRes = await db.execute(checkDuplicateQuery, [Number(order_id), trang_thai_hien_thi]);
    }
    
    const isDuplicate = checkRes.rows ? checkRes.rows.length > 0 : checkRes.length > 0;
    
    if (isDuplicate) {
      return res.status(200).json({ 
        success: true, 
        message: "Trạng thái này đã được cập nhật trước đó, bỏ qua ghi trùng." 
      });
    }

    const insertLogQuery = `
      INSERT INTO public.order_tracking_logs (
        order_id, ma_don_hang, station_id, station_name, 
        tinh_thanh, quan_huyen, phuong_xa, so_nha_duong, 
        station_lat, station_lng, station_type, action_type, 
        trang_thai_hien_thi, ngay_tao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id;
    `;

    const queryParams = [
      Number(order_id),
      String(ma_don_hang),
      station_id,
      station_name,
      tinh_thanh || "",
      quan_huyen || "",
      phuong_xa || "",
      so_nha_duong || "",
      parseFloat(station_lat),
      parseFloat(station_lng),
      station_type || "HUB",
      action_type || "NHAP_TRAM_REALTIME",
      trang_thai_hien_thi
    ];

    let result;
    if (db.query) {
      result = await db.query(insertLogQuery, queryParams);
    } else {
      result = await db.execute(insertLogQuery, queryParams);
    }

    try {
      const getUserQuery = `SELECT user_id FROM public.orders WHERE id = $1`;
      const userRes = db.query ? await db.query(getUserQuery, [Number(order_id)]) : await db.execute(getUserQuery, [Number(order_id)]);
      const orderUser = userRes.rows ? userRes.rows[0] : userRes[0];

      if (orderUser && orderUser.user_id) {
        await axios.post('http://notification-service:8085/api/v1/notifications/send', {
          userId: String(orderUser.user_id),
          channel: "websocket",
          title: "🚚 Cập nhật vận đơn",
          description: `Đơn hàng ${ma_don_hang}: ${trang_thai_hien_thi}`,
          type: "order"
        });
      }
    } catch (notiError) {
      console.warn("⚠️ Gửi thông báo nhảy trạm thất bại:", notiError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Ghi nhận nhật ký quét trạm realtime thành công vào PostgreSQL!",
      log_id: result.rows ? result.rows[0].id : result[0]?.insertId
    });

  } catch (err) {
    console.error("🔥 Lỗi Controller createOrderTrackingLogNode:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ khi tạo dòng nhật ký quét trạm vận trình." 
    });
  }
};

// 14. Tính tổng tiền chi tiêu
const getUserSpent = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin userId." });
    }

    const query = `
      SELECT SUM(CAST(tong_thanh_toan AS numeric)) as total_spent
      FROM public.orders
      WHERE user_id = $1 
      AND LOWER(TRIM(trang_thai_don_hang)) IN ('đã giao', 'delivered', 'hoàn thành')
    `;

    let result;
    if (db.query) {
      result = await db.query(query, [userId]);
    } else {
      result = await db.execute(query, [userId]);
    }

    const total = result.rows ? result.rows[0]?.total_spent : result[0]?.total_spent;

    return res.status(200).json({
      success: true,
      total_spent: Number(total || 0)
    });

  } catch (err) {
    console.error("🔥 Lỗi tính tổng chi tiêu KH:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ khi trích xuất tổng chi tiêu." 
    });
  }
};

// 15. Thanh toán bằng ví DemiPay
const payOrderWithDemiPay = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { ma_don_hang, amount } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });
    if (!ma_don_hang || !amount) return res.status(400).json({ success: false, message: "Thiếu thông tin mã đơn hàng hoặc số tiền!" });

    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://demi_auth_service:5001';
    
    try {
      const authRes = await axios.post(
        `${authServiceUrl}/api/v1/auth/wallet/pay`, 
        { amount: Number(amount), orderId: ma_don_hang },
        { headers: { Authorization: req.headers.authorization } } 
      );

      if (authRes.data.success) {
        const updateQuery = `
          UPDATE public.orders 
          SET trang_thai_thanh_toan = 'Đã thanh toán',
              phuong_thuc_thanh_toan = 'DemiPay'
          WHERE ma_don_hang = $1 AND user_id = $2
        `;
        
        if (db.query) {
          await db.query(updateQuery, [ma_don_hang, userId]);
        } else {
          await db.execute(updateQuery, [ma_don_hang, userId]);
        }

        try {
          await axios.post('http://notification-service:8085/api/v1/notifications/send', {
            userId: String(userId),
            channel: "websocket",
            title: "💳 Thanh toán thành công",
            description: `Đơn hàng ${ma_don_hang} đã được thanh toán thành công qua ví DemiPay.`,
            type: "order" 
          });
        } catch (notiError) {
          console.warn("⚠️ Gửi thông báo thanh toán ví thất bại:", notiError.message);
        }

        return res.status(200).json({ 
          success: true, 
          message: "Thanh toán bằng ví DemiPay thành công và đã cập nhật đơn hàng!" 
        });
      }
    } catch (authError) {
      console.error("🔥 Lỗi Auth Service:", authError.response?.data || authError.message);
      return res.status(400).json({ 
        success: false, 
        message: authError.response?.data?.message || "Thanh toán thất bại, số dư không đủ hoặc lỗi kết nối ví." 
      });
    }

  } catch (err) {
    console.error("🔥 Lỗi hàm payOrderWithDemiPay:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý thanh toán ví." });
  }
};

// 16. Khách hàng xác nhận đã nhận hàng (Cộng Xu Cashback)
const confirmReceiveOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { ma_don_hang } = req.params;

        if (!userId) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });

        // 1. Kiểm tra đơn hàng có đúng của user này không
        const checkQuery = `SELECT id, tong_thanh_toan, trang_thai_don_hang FROM public.orders WHERE ma_don_hang = $1 AND user_id = $2`;
        const checkRes = db.query ? await db.query(checkQuery, [ma_don_hang, userId]) : await db.execute(checkQuery, [ma_don_hang, userId]);
        const orderInfo = checkRes.rows ? checkRes.rows[0] : checkRes[0];

        if (!orderInfo) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        if (orderInfo.trang_thai_don_hang === 'Đã giao') return res.status(400).json({ success: false, message: "Đơn hàng này đã được xác nhận trước đó." });

        // 2. Cập nhật trạng thái thành 'Đã giao'
        const updateQuery = `UPDATE public.orders SET trang_thai_don_hang = 'Đã giao' WHERE id = $1`;
        if (db.query) await db.query(updateQuery, [orderInfo.id]);
        else await db.execute(updateQuery, [orderInfo.id]);

        // =========================================================================
        // 🌟 HOOK: TÍNH TOÁN VÀ CỘNG XU (Hoàn tiền 1% trên tổng thanh toán)
        // =========================================================================
        try {
            const cashbackRate = 0.01; 
            const earnedPoints = Math.floor(Number(orderInfo.tong_thanh_toan) * cashbackRate);

            if (earnedPoints > 0) {
                // Trỏ về AUTH_SERVICE_URL
                const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
                const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8085';

                //  Gọi API /api/v1/auth/loyalty/earn và truyền biến userId
                await axios.post(`${authUrl}/api/v1/auth/loyalty/earn`, {
                    userId: Number(userId), // Đã đổi tên biến thành userId cho khớp DB mới
                    points: earnedPoints,
                    source: 'ORDER',
                    referenceId: String(ma_don_hang),
                    description: `Hoàn xu mua sắm từ đơn hàng ${ma_don_hang}`
                });

                // Bắn thông báo về client
                await axios.post(`${notificationUrl}/api/v1/notifications/send`, {
                    userId: String(userId),
                    channel: "websocket",
                    title: "🛍️ Đơn hàng hoàn tất",
                    description: `Bạn đã nhận hàng thành công và được hoàn lại ${earnedPoints.toLocaleString('vi-VN')} Xu!`,
                    type: "order"
                });
            }
        } catch (pointError) {
            console.warn("⚠️ Lỗi hệ thống hoàn xu:", pointError.message);
        }

        return res.status(200).json({ success: true, message: "Cảm ơn bạn đã xác nhận nhận hàng!" });

    } catch (err) {
        console.error("🔥 Lỗi confirmReceiveOrder:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ khi xác nhận đơn hàng." });
    }
};

// 17. Admin Cập nhật trạng thái đơn hàng nhanh
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const ma_don_hang = req.params.ma_don_hang || req.params.id;
    const { trang_thai_don_hang, status } = req.body;

    const newStatus = trang_thai_don_hang || status;

    if (!newStatus) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp trạng thái đơn hàng mới!' 
      });
    }

    const updateQuery = `
      UPDATE public.orders 
      SET trang_thai_don_hang = $1
      WHERE ma_don_hang = $2 OR id::text = $2
      RETURNING *;
    `;

    const result = db.query ? await db.query(updateQuery, [newStatus, ma_don_hang]) : await db.execute(updateQuery, [newStatus, ma_don_hang]);
    const updatedRows = result.rows ? result.rows : result[0];

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy đơn hàng #${ma_don_hang} để cập nhật!`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng #${ma_don_hang} thành: ${newStatus}`,
      data: updatedRows[0]
    });

  } catch (error) {
    console.error('🔥 Lỗi chi tiết updateOrderStatusAdmin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ khi cập nhật trạng thái đơn hàng!',
      error: error.message 
    });
  }
};

// ========================================================
// 📦 EXPORT TOÀN BỘ CONTROLLER
// ========================================================
export { 
  getShippingFee, 
  placeOrder, 
  updateInternalOrderStatus, 
  getOrderStatistics, 
  getAllOrdersAdmin, 
  getMyOrders, 
  getOrdersByUserAdmin,
  getOrderDetailAdmin, 
  cancelOrder,
  getPostOffices,
  testReadKml,
  calculateShipping,
  getOrderTrackingLogs,
  createOrderTrackingLogNode,
  getUserSpent,
  payOrderWithDemiPay,
  confirmReceiveOrder,
  updateOrderStatusAdmin
};