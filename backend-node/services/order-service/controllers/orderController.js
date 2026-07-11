import * as Order from '../models/orderModel.js';
import axios from 'axios';
import db from '../configs/database.js';
import fs from 'fs';
import path from 'path';
import { LiveLocation } from '../models/liveLocationModel.js';
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

// 2. Tiếp nhận đặt hàng (Tự động hóa cấy lộ trình bưu cục đa trạm vào DB)
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
      to_lng
    } = req.body;
    
    if (!to_district_id || !to_ward_code || !danh_sach_san_pham || !Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
      return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ hoặc bị thiếu!" });
    }

    const productServiceUrl = process.env.INTERNAL_PRODUCT_URL || 'http://demi_product_service:5002';
    let databaseVariants = [];
    try {
      const prodApiRes = await axios.get(`${productServiceUrl}/api/v1/products`);
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
        const found = databaseVariants.find(p => String(p.ma_bien_the) === vId || String(p.ma_bien_the_mac_dinh) === vId);
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
        variant_name: item.variant_name || item.phan_loai || "Mặc định",
        image_url: item.image_url || "",
        ma_san_pham: finalMaSanPham, 
        sku: finalSku 
      };
    }).filter(i => i.variant_id && i.quantity > 0);

    try {
      await axios.post(`${productServiceUrl}/api/v1/products/internal/deduct-stock`, { items: normalizedItems });
    } catch (apiError) {
      return res.status(400).json({ success: false, message: "Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng!" });
    }

    const clientShippingFee = Number(req.body.phi_van_chuyen);
    const validShippingCost = (!isNaN(clientShippingFee) && clientShippingFee >= 0) ? clientShippingFee : 25000;
    req.body.phi_van_chuyen = validShippingCost;
    req.body.don_vi_van_chuyen = req.body.don_vi_van_chuyen || 'Siêu thị DemiMart Express';
    
    let finalTotal = Number(tong_tien_hang) + validShippingCost - Number(req.body.so_tien_giam_gia || 0);
    if (isNaN(finalTotal) || finalTotal < 5000) finalTotal = 50000; 
    req.body.tong_thanh_toan = finalTotal;

    const userLatNum = parseFloat(to_lat || 10.762622);
    const userLngNum = parseFloat(to_lng || 106.660172);

    const normalizedOrder = {
        ...req.body,
        danh_sach_san_pham: normalizedItems,
        paypal_transaction_id: req.body.paypal_transaction_id || null, 
        paypal_order_id: req.body.paypal_order_id || null,
        to_lat: userLatNum,
        to_lng: userLngNum
    };

    const order = await Order.create(userId, normalizedOrder);
    console.log("✅ Đơn hàng đã tạo thành công với ID:", order.id);

    // --- LUỒNG TỰ ĐỘNG HÓA TÍNH CHẶNG VÀ ĐỒNG BỘ TRẠM VÀO DATABASE ---
    try {
      const storeLat = 10.771963; // Tọa độ Kho tổng Quận 1
      const storeLng = 106.697194;

      // 🌟 RÀNG BUỘC PHÂN LOẠI THEO TỈNH: Tính khoảng cách thực tế từ Kho tổng đến khách hàng
      const directDistanceToStore = calcHaversine(userLatNum, userLngNum, storeLat, storeLng);
      
      let stationsToSave = [];

      // 🌟 NẾU KHÁCH HÀNG Ở CÙNG TỈNH/THÀNH PHỐ (BÁN KÍNH NỘI THÀNH NỘI TỈNH <= 32.0 KM) -> GIAO THẲNG KHÔNG QUA BƯU CỤC TRUNG GIAN
      if (directDistanceToStore <= 32.0) {
        console.log(`[🚀 NỘI TỈNH - GIAO THẲNG]: Khách hàng thuộc cùng khu vực tỉnh/thành phố (~${directDistanceToStore.toFixed(2)} km). Kích hoạt luồng vận chuyển giao thẳng.`);
        
        stationsToSave.push({
          station_id: `DIRECT_STORE_HQ`,
          station_name: `Tổng Kho Điều Phối Siêu Tốc DemiMart`,
          tinh_thanh: `Thành phố Hồ Chí Minh`,
          quan_huyen: `Quận 1`,
          phuong_xa: `Bến Thành`,
          so_nha_duong: `Khu vực phân phối cự ly gần`,
          station_lat: storeLat,
          station_lng: storeLng,
          station_type: 'FIRST_MILE', // Để Frontend render icon bưu cục nhận chặng đầu
          action_type: 'GIAO_THANG_TRỰC_TIEP',
          trang_thai_hien_thi: 'Đơn hàng nội tỉnh - Hệ thống xuất kho giao trực tiếp siêu tốc đến bạn'
        });
      } else {
        // 🌟 KHÁC TỈNH TRONG MẠNG LƯỚI TOÀN QUỐC (KHI ĐƠN ĐI XA > 32.0 KM) -> BẮT BUỘC ĐI QUA CÁC BƯU CỤC NHƯ CŨ
        console.log(`[🚛 NGOẠI TỈNH - LIÊN TRẠM TRỤC]: Khách hàng ở ngoại tỉnh chặng xa (${directDistanceToStore.toFixed(2)} km). Chuyển tiếp luồng vận tải đa điểm đa trạm.`);
        
        const kmlPath = path.resolve(new URL('.', import.meta.url).pathname, 'danh_sach_bc.kml');
        let rawPostOffices = [];
        if (fs.existsSync(kmlPath)) {
          const kmlContent = fs.readFileSync(kmlPath, 'utf-8');
          rawPostOffices = parseKmlWithRegex(kmlContent);
        }

      let optimalFirstMileOffice = null;
      let optimalLastMileOffice = null;
      let lastMileLat = userLatNum;
      let lastMileLng = userLngNum;

        if (rawPostOffices.length > 0) {
          // [A] THUẬT TOÁN ĐỊNH VỊ BƯU CỤC GOM CHẶNG ĐẦU (GẦN KHO TỔNG NHẤT)
          let minDistanceToStore = Infinity;
          rawPostOffices.forEach(office => {
            const distToStoreSq = ((office.location.lat - storeLat) ** 2) + ((office.location.lng - storeLng) ** 2);
            if (distToStoreSq < minDistanceToStore) {
              minDistanceToStore = distToStoreSq;
              optimalFirstMileOffice = office;
            }
          });

          // [B] THUẬT TOÁN ĐỊNH VỊ BƯU CỤC PHÁT CHẶNG CUỐI (GẦN KHÁCH HÀNG NHẤT)
          let clientZoneOffices = rawPostOffices.filter(o => Math.abs(o.location.lat - userLatNum) < 0.6 && Math.abs(o.location.lng - userLngNum) < 0.6);
          if (clientZoneOffices.length === 0) {
            clientZoneOffices = rawPostOffices.filter(o => Math.abs(o.location.lat - userLatNum) < 1.5 && Math.abs(o.location.lng - userLngNum) < 1.5);
          }

        let minDistanceToClient = Infinity;
        optimalLastMileOffice = clientZoneOffices[0] || rawPostOffices[0];

        clientZoneOffices.forEach(office => {
          const distSq = ((office.location.lat - userLatNum) ** 2) + ((office.location.lng - userLngNum) ** 2);
          if (distSq < minDistanceToClient) {
            minDistanceToClient = distSq;
            optimalLastMileOffice = office;
          }
        });

        lastMileLat = parseFloat(optimalLastMileOffice.location?.lat || optimalLastMileOffice.latitude || userLatNum);
        lastMileLng = parseFloat(optimalLastMileOffice.location?.lng || optimalLastMileOffice.longitude || userLngNum);
      }

        let waypoints = [`${storeLng},${storeLat}`];

        if (optimalFirstMileOffice) {
          waypoints.push(`${optimalFirstMileOffice.location.lng},${optimalFirstMileOffice.location.lat}`);
        }

      const isTayNguyenZone = userLngNum < 108.2 && userLatNum > 11.5 && userLatNum < 15.0;

      if (isTayNguyenZone) {
        waypoints.push("106.883412,11.521093");
        waypoints.push("107.684125,12.001254");
      } else if (userLatNum > 11.2) {
        waypoints.push("107.234125,10.938512");
        waypoints.push("108.106943,10.933391");
        if (userLatNum > 12.0) waypoints.push("109.196749,12.245071");
        if (userLatNum > 13.5) waypoints.push("109.219515,13.774697");
        if (userLatNum > 16.0) waypoints.push("108.221464,16.059541");
        if (userLatNum > 18.0) waypoints.push("105.681123,18.673412");
        if (userLatNum > 20.0) waypoints.push("105.820421,20.251093");
      }

      if (lastMileLng && lastMileLat) {
        waypoints.push(`${lastMileLng},${lastMileLat}`);
      }
      waypoints.push(`${userLngNum},${userLatNum}`);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints.join(';')}?overview=full&geometries=geojson`;
      const routeRes = await axios.get(osrmUrl);
      
      if (routeRes.data?.code === "Ok") {
        const routeGeo = routeRes.data.routes[0];
        const coordinates = routeGeo.geometry.coordinates;

          // 1. Thêm bưu cục gom hàng chặng đầu vào logs
          if (optimalFirstMileOffice) {
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
          }

        // [2] THÊM CÁC HUB TRUNG CHUYỂN DỌC ĐƯỜNG LIÊN TỈNH
        if (coordinates.length > 15) {
          const distributionRatios = [0.33, 0.66];
          distributionRatios.forEach((ratio, idx) => {
            const targetIndex = Math.floor(coordinates.length * ratio);
            if (coordinates[targetIndex]) {
              const nodeCoord = coordinates[targetIndex];
              
              let nearestKmlToHub = null;
              let minHubDistSq = Infinity;
              rawPostOffices.forEach(office => {
                const distSq = ((office.location.lat - nodeCoord[1]) ** 2) + ((office.location.lng - nodeCoord[0]) ** 2);
                if (distSq < minHubDistSq) {
                  minHubDistSq = distSq;
                  nearestKmlToHub = office;
                }
              });

              stationsToSave.push({
                station_id: `HUB_${order.ma_don_hang}_${idx + 1}`,
                station_name: nearestKmlToHub?.name ? `${nearestKmlToHub.name} (${idx + 1})` : `Bưu cục Trung Chuyển (${idx + 1})`,
                tinh_thanh: nearestKmlToHub?.provinceName || '',
                quan_huyen: nearestKmlToHub?.districtName || '',
                phuong_xa: nearestKmlToHub?.wardName || '',
                so_nha_duong: nearestKmlToHub?.street || nearestKmlToHub?.address || '',
                station_lat: nodeCoord[1],
                station_lng: nodeCoord[0],
                station_type: 'HUB',
                action_type: 'TRUNG_CHUYEN',
                trang_thai_hien_thi: 'Đã qua trạm trung chuyển'
              });
            }
          });
        }

        // [3] THÊM BƯU CỤC PHÁT CHẶNG CUỐI
        if (optimalLastMileOffice) {
          stationsToSave.push({
            station_id: String(optimalLastMileOffice.id),
            station_name: String(optimalLastMileOffice.name),
            tinh_thanh: String(optimalLastMileOffice.provinceName || ''),
            quan_huyen: String(optimalLastMileOffice.districtName || ''),
            phuong_xa: String(optimalLastMileOffice.wardName || ''),
            so_nha_duong: String(optimalLastMileOffice.street || optimalLastMileOffice.address || ''),
            station_lat: lastMileLat,
            station_lng: lastMileLng,
            station_type: 'LAST_MILE',
            action_type: 'DIEU_PHOI_PHAT',
            trang_thai_hien_thi: 'Đã cập bưu cục phát chặng cuối'
          });
        }

      // Lưu mảng logs hành trình vào PostgreSQL công khai
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
      console.log(`[🚀 AUTOMATION ENGINE]: Phân loại vùng bưu cục hoàn tất (${stationsToSave.length} điểm mốc được ghi nhận).`);

    } catch (logisticsErr) {
      console.error("⚠️ Cảnh báo lỗi cấu trúc hành trình:", logisticsErr.message);
    }

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

    return res.status(201).json({ 
      success: true, 
      ma_don_hang: order.ma_don_hang, 
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan,
      message: "Đặt hàng thành công! Lộ trình mạng lưới bưu cục hành trình chặng trục đã được đồng bộ tự động lưu trữ." 
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
    if (!ma_don_hang || !trang_thai_thanh_toan) return res.status(400).json({ success: false, message: "Thiếu thông tin đồng bộ trạng thái đơn hàng!" });
    const sqlQuery = `UPDATE public.orders SET trang_thai_thanh_toan = $1 WHERE ma_don_hang = $2`;
    if (db.query) await db.query(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);
    else await db.execute(sqlQuery, [trang_thai_thanh_toan, ma_don_hang]);
    return res.status(200).json({ success: true, message: "Đồng bộ trạng thái hóa đơn nội bộ thành công!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi đồng bộ cơ sở dữ liệu phân hệ đơn hàng!" });
  }
};

// 4. Thống kê đơn hàng cho Admin Dashboard
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

    const recentOrdersQuery = `SELECT ma_don_hang, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang, ngay_tao FROM public.orders ORDER BY ngay_tao DESC LIMIT 5`;
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

// 6.1 Lấy lịch sử đơn hàng theo userId (Admin) — cho phép admin truy vấn lịch sử của bất kỳ user nào
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
        // 🌟 SỬA: Đã thêm http:// vào đường dẫn
        const authResponse = await axios.get(`http://demi_auth_service:5001/api/v1/auth/internal/users/${order.user_id}`);
        if (authResponse.data) order.user_info = authResponse.data; 
      } catch (authErr) { console.warn("Lỗi fetch user info"); }
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

// 8. Hủy đơn hàng và hoàn kho
const cancelOrder = async (req, res) => {
  try {
    const { ma_don_hang } = req.params;
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
            await axios.post(`${productServiceUrl}/api/v1/products/internal/restore-stock`, { items: orderItems });
        } catch (apiError) {
            return res.status(500).json({ success: false, message: "Lỗi hệ thống: Không thể kết nối để hoàn kho." });
        }
    }

    const updateQuery = `UPDATE public.orders SET trang_thai_don_hang = 'Đã hủy' WHERE ma_don_hang = $1`;
    db.query ? await db.query(updateQuery, [ma_don_hang]) : await db.execute(updateQuery, [ma_don_hang]);
    return res.status(200).json({ success: true, message: "Hủy đơn hàng thành công, số lượng đã được hoàn lại kho." });
  } catch (err) {
      return res.status(500).json({ success: false, message: "Lỗi máy chủ khi hủy đơn hàng." });
  }
};

// 9. Lấy danh sách bưu cục cho Map
const getPostOffices = async (req, res) => {
  try {
    const { district_name, province_name, userLat, userLng } = req.body;
    const kmlPath = path.resolve(new URL('.', import.meta.url).pathname, 'danh_sach_bc.kml');
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
    const kmlPath = path.resolve(new URL('.', import.meta.url).pathname, 'danh_sach_bc.kml');
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

// 11. Tính toán địa lý và chi phí
const calculateShipping = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;
    if (!userLat || !userLng) return res.status(400).json({ success: false, message: "Địa chỉ này chưa có tọa độ bản đồ!" });

    const storeLat = 10.792622;
    const storeLng = 106.680172;
    const distanceKm = calcHaversine(parseFloat(userLat), parseFloat(userLng), storeLat, storeLng);
    const estimatedMinutes = Math.round((distanceKm / 30) * 60) + 15;
    const shippingFee = distanceKm <= 2 ? 0 : Math.round((distanceKm - 2) * 5000);

    return res.status(200).json({
      success: true,
      data: { nearestStore: { id: "DEMIMART_HQ_01", name: "Trụ sở chính Express", lat: storeLat, lng: storeLng }, distanceKm: Number(distanceKm.toFixed(1)), estimatedMinutes, shippingFee }
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
// 📊 API 12: TRUY VẤN LỘ TRÌNH BƯU CỤC TỪ CƠ SỞ DỮ LIỆU CHO BẢN ĐỒ
// ========================================================
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
  getOrderTrackingLogs
};