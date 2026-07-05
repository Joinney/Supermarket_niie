import React, { useState } from "react";

const TaoKhoForm = ({ onCancel, onSuccess }) => {
  // Quản lý dữ liệu form theo đúng yêu cầu các trường của bạn
  const [formData, setFormData] = useState({
    ma_kho: "",
    hinh_anh: null,
    hinh_anh_preview: "",
    ten_kho: "",
    dia_chi: "",
    trang_thai: "active",
    ngay_tao: new Date().toISOString().slice(0, 16), // Mặc định thời gian hiện tại (YYYY-MM-DDTHH:mm)
    ngay_cap_nhat: new Date().toISOString().slice(0, 16),
  });

  // Xử lý khi thay đổi dữ liệu các text input, select, datetime
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý khi đăng tải và hiển thị ảnh xem trước
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        hinh_anh: file,
        hinh_anh_preview: URL.createObjectURL(file), // Tạo đường dẫn tạm để render thẻ <img>
      }));
    }
  };

  // Xử lý gửi dữ liệu lên hệ thống
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ở đây bạn có thể gọi API chuyển dữ liệu formData đi
    console.log("Dữ liệu kho mới khởi tạo:", formData);
    
    if (onSuccess) {
      onSuccess(formData);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] p-4 font-sans text-gray-800 antialiased flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4 text-left">
        
        {/* ---------------- TIÊU ĐỀ FORM ---------------- */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo kho hàng mới</h2>
            <p className="text-xs text-gray-400 mt-0.5">Vui lòng điền đầy đủ thông tin cấu trúc kho hàng dưới đây</p>
          </div>
          
          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ---------------- KHU VỰC ĐIỀN THÔNG TIN FORM ---------------- */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Trường: Mã kho */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mã kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ma_kho"
                required
                placeholder="Ví dụ: KHO-HCM-01"
                value={formData.ma_kho}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-[#006c49] font-bold transition"
              />
            </div>

            {/* 2. Trường: Tên kho */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tên kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ten_kho"
                required
                placeholder="Ví dụ: Kho Tổng Quận 1"
                value={formData.ten_kho}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold transition"
              />
            </div>

            {/* 3. Trường: Hình ảnh (hinh_anh) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hình ảnh minh họa kho</label>
              <div className="flex items-center gap-4 border border-dashed border-gray-200 p-4 rounded-lg bg-slate-50/30">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Hệ thống chấp nhận các định dạng phổ biến: JPG, PNG, WEBP</p>
                </div>
                
                {/* Khu vực xem trước ảnh khi vừa chọn */}
                {formData.hinh_anh_preview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-inner flex-shrink-0">
                    <img src={formData.hinh_anh_preview} alt="Xem trước" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Trường: Địa chỉ */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dia_chi"
                required
                placeholder="Nhập số nhà, tên đường, phường, quận, thành phố..."
                value={formData.dia_chi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium transition"
              />
            </div>

            {/* 5. Trường: Trạng thái */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái vận hành</label>
              <select
                name="trang_thai"
                value={formData.trang_thai}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none font-bold cursor-pointer focus:border-emerald-500 transition"
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="maintenance">Bảo trì hệ thống (Maintenance)</option>
              </select>
            </div>

            {/* Điểm trống để tạo bố cục cân xứng cho 2 cột bên dưới */}
            <div></div>

            {/* 6. Trường: Ngày tạo */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày giờ khởi tạo</label>
              <input
                type="datetime-local"
                name="ngay_tao"
                value={formData.ngay_tao}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-gray-600 transition"
              />
            </div>

            {/* 7. Trường: Ngày cập nhật */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày cập nhật hệ thống</label>
              <input
                type="datetime-local"
                name="ngay_cap_nhat"
                value={formData.ngay_cap_nhat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-gray-600 transition"
              />
            </div>

          </div>

          {/* ---------------- KHU VỰC NÚT ĐIỀU HƯỚNG CHÂN FORM ---------------- */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}
            
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Lưu thông tin kho
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default TaoKhoForm;