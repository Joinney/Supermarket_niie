import React, { useState } from 'react';

export default function GeneralSettings() {
  // Gom tất cả cấu hình vào 1 state để dễ quản lý và cập nhật
  const [settings, setSettings] = useState({
    storeName: "Demi Mart Chi nhánh chính",
    branchCode: "DM-HCM-001",
    storeType: "Siêu thị",
    email: "admin@demimart.vn",
    phone: "090 123 4567",
    taxCode: "0312345678",
    address: "123 Đường Thương Mại, Quận 1, TP. Hồ Chí Minh",
    taxRate: 10,
    isTaxIncluded: true,
    is2FA: false,
    sessionTimeout: "Sau 1 giờ không hoạt động",
    ipLimit: "",
    webhookUrl: "https://api.demimart.vn/v1/webhooks/inventory-sync",
    currency: "VND - Việt Nam Đồng (đ)",
    timezone: "(GMT+07:00) Bangkok, Hà Nội, Jakarta",
    language: "Tiếng Việt",
    dateFormat: "DD/MM/YYYY (31/12/2023)",
    hoursMonFriStart: "08:00",
    hoursMonFriEnd: "22:00",
    hoursSatStart: "09:00",
    hoursSatEnd: "23:00"
  });

  // Hàm xử lý thay đổi cho các input thông thường (text, number, select)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm xử lý riêng cho các nút Toggle (Boolean)
  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Hàm xử lý khi nhấn nút Lưu / Cập nhật
  const handleSave = () => {
    console.log("Dữ liệu cài đặt mới sẽ gửi lên Server:", settings);
    alert("Cập nhật cài đặt thành công! (Kiểm tra Console log để xem data)");
  };

  // Hàm xử lý nút Hủy bỏ (Khôi phục ban đầu nếu muốn, ở đây tạm thời reload hoặc clear)
  const handleCancel = () => {
    if(window.confirm("Bạn có chắc chắn muốn hủy bỏ các thay đổi?")) {
       window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt chung</h1>
        <p className="text-sm text-gray-500">Quản lý nhận diện cốt lõi và các thông số vận hành của cửa hàng.</p>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* SECTION 1: Thông tin cửa hàng & Chi nhánh */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Thông tin cửa hàng & Chi nhánh</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tên cửa hàng</label>
                <input type="text" name="storeName" value={settings.storeName} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mã chi nhánh</label>
                <input type="text" name="branchCode" value={settings.branchCode} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Loại hình cửa hàng</label>
                <select name="storeType" value={settings.storeType} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="Siêu thị">Siêu thị</option>
                  <option value="Cửa hàng tiện lợi">Cửa hàng tiện lợi</option>
                  <option value="Tạp hóa">Tạp hóa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email liên hệ</label>
                <input type="email" name="email" value={settings.email} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                <input type="text" name="phone" value={settings.phone} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mã số thuế</label>
                <input type="text" name="taxCode" value={settings.taxCode} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Địa chỉ cửa hàng</label>
                <input type="text" name="address" value={settings.address} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Cấu hình Thuếu & Hóa đơn */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Cấu hình Thuế & Hóa đơn</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Thuế suất mặc định (%)</label>
                <div className="relative flex items-center">
                  <input type="number" name="taxRate" value={settings.taxRate} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                  <span className="absolute right-3 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Giá đã bao gồm thuế</p>
                  <p className="text-xs text-gray-400">Hiển thị giá bán cuối cùng đã tính VAT</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleToggle('isTaxIncluded')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isTaxIncluded ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isTaxIncluded ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Bảo mật & Hệ thống */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Bảo mật & Hệ thống</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1 flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Xác thực 2 lớp (2FA)</p>
                  <p className="text-xs text-gray-400">Yêu cầu OTP khi đăng nhập</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleToggle('is2FA')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.is2FA ? 'bg-emerald-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.is2FA ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Thời gian tự động đăng xuất</label>
                <select name="sessionTimeout" value={settings.sessionTimeout} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="Sau 1 giờ không hoạt động">Sau 1 giờ không hoạt động</option>
                  <option value="Sau 2 giờ không hoạt động">Sau 2 giờ không hoạt động</option>
                  <option value="Không bao giờ">Không bao giờ</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Giới hạn IP truy cập</label>
                <input type="text" name="ipLimit" value={settings.ipLimit} onChange={handleChange} placeholder="Ví dụ: 192.168.1.1, 10.0.0.5 (Để trống để cho phép tất cả)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none placeholder:text-gray-300" />
              </div>
            </div>
          </div>

          {/* SECTION 4: Tích hợp & API */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Tích hợp & API</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Webhook URL (Đồng bộ kho hàng)</label>
              <div className="flex gap-2">
                <input type="text" name="webhookUrl" value={settings.webhookUrl} onChange={handleChange} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-gray-600" />
                <button type="button" onClick={() => alert(`Đang kiểm tra kết nối tới: ${settings.webhookUrl}`)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Kiểm tra kết nối</button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Dùng để đồng bộ tồn kho thời gian thực với các hệ thống bên ngoài.</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* SECTION 5: Cài đặt Vùng & Ngôn ngữ */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Cài đặt Vùng & Ngôn ngữ</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tiền tệ mặc định</label>
                <select name="currency" value={settings.currency} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="VND - Việt Nam Đồng (đ)">VND - Việt Nam Đồng (đ)</option>
                  <option value="USD - US Dollar ($)">USD - US Dollar ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Múi giờ</label>
                <select name="timezone" value={settings.timezone} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="(GMT+07:00) Bangkok, Hà Nội, Jakarta">(GMT+07:00) Bangkok, Hà Nội, Jakarta</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ngôn ngữ hệ thống</label>
                <select name="language" value={settings.language} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Định dạng ngày tháng</label>
                <select name="dateFormat" value={settings.dateFormat} onChange={handleChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white">
                  <option value="DD/MM/YYYY (31/12/2023)">DD/MM/YYYY (31/12/2023)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 6: Giờ hoạt động */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Giờ hoạt động</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">T2 - T6</span>
                <div className="flex items-center gap-2">
                  <input type="text" name="hoursMonFriStart" value={settings.hoursMonFriStart} onChange={handleChange} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm" />
                  <span>-</span>
                  <input type="text" name="hoursMonFriEnd" value={settings.hoursMonFriEnd} onChange={handleChange} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Thứ Bảy</span>
                <div className="flex items-center gap-2">
                  <input type="text" name="hoursSatStart" value={settings.hoursSatStart} onChange={handleChange} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm" />
                  <span>-</span>
                  <input type="text" name="hoursSatEnd" value={settings.hoursSatEnd} onChange={handleChange} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Chủ Nhật</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-500 uppercase">Đóng cửa</span>
                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => alert("Chức năng thêm ngày nghỉ lễ đang phát triển.")} className="mt-4 w-full rounded-xl border border-dashed border-emerald-500 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50/50 transition">
                + Thêm ngày nghỉ Lễ
              </button>
            </div>
          </div>

          {/* SECTION 7: Tài sản thương hiệu */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="font-semibold text-gray-900">Tài sản thương hiệu</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logo cửa hàng</label>
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center cursor-pointer hover:bg-gray-50 transition">
                  <div className="rounded-full bg-emerald-50 p-3 text-emerald-600 mb-2">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Tải lên Logo mới</p>
                  <p className="text-xs text-gray-400 mt-1">SVG, PNG, WEBP, JPG (Tối đa 800x800px)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Màu sắc thương hiệu</label>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#007A5A] shadow-inner cursor-pointer border border-black/5" title="#007A5A" />
                  <div className="h-8 w-8 rounded-lg bg-white shadow-inner cursor-pointer border border-gray-200" title="#FFFFFF" />
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FIXED BOTTOM BAR */}
      <div className="mt-8 flex items-center justify-between rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span>Đã bật đồng bộ hóa tự động cho tất cả các thiết bị đầu cuối.</span>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleCancel} className="rounded-lg px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-[#007A5A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#006349] transition shadow-sm">Cập nhật cài đặt</button>
        </div>
      </div>
    </div>
  );
}