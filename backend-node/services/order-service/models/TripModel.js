import mongoose from 'mongoose';

// 1. Định nghĩa cấu trúc tọa độ GeoJSON
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // Mảng gồm 2 số: [Kinh độ Lng, Vĩ độ Lat]
    required: true
  }
}, { _id: false });

// 2. Định nghĩa cấu trúc một điểm dừng (Stop)
const stopSchema = new mongoose.Schema({
  stop_id: { type: String, required: true },
  type: { type: String, enum: ['PICKUP_STORE', 'DELIVERY_CUST'], required: true },
  name: { type: String, required: true },
  address: { type: String },
  location: { type: pointSchema, required: true },
  step_order: { type: Number, default: 0 } // Thứ tự di chuyển thực tế
}, { _id: false });

// 3. Định nghĩa Schema chính khớp 100% với dữ liệu bạn vừa Insert bên Compass
const tripSchema = new mongoose.Schema({
  trip_code: { type: String, required: true, unique: true },
  shipper_id: { type: Number, required: true },
  shipper_name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['DRAFT', 'OPTIMIZED', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'DRAFT' 
  },
  start_point: {
    name: { type: String, required: true },
    address: { type: String },
    location: { type: pointSchema, required: true }
  },
  stops: [stopSchema],
  optimization_result: {
    is_optimized: { type: Boolean, default: false },
    total_distance_km: { type: Number, default: 0 },
    total_duration_min: { type: Number, default: 0 },
    ordered_stops: [stopSchema],
    polyline_geojson: { type: mongoose.Schema.Types.Mixed, default: null } 
  }
}, { timestamps: true });

// Đăng ký Model kết nối vào đúng Collection 'pickup_trips' trong Mongo
export const TripModel = mongoose.model('pickup_trips', tripSchema);