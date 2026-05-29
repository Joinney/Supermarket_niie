import React, { useState } from 'react';
import { X, Trash2, Edit2, Check } from 'lucide-react';
import { authApi } from '../../api/axios';

export default function AddressModal({ isOpen, onClose, onSelect, currentAddresses, selectedAddressId, onRefresh }) {
  // Quản lý trạng thái Form nhập liệu (Thêm / Sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  // State phục vụ việc cưỡng bức ép render lại UI cục bộ cho Modal ngay lập tức khi mảng thay đổi thuộc tính lồng
  const [, setTick] = useState(0);

  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_phone: '',
    province_name: '',
    district_name: '',
    ward_name: '',
    detail_address: '',
    is_default: false,
    address_type: 'home'
  });

  if (!isOpen) return null;

  // Kích hoạt chế độ Sửa địa chỉ và đổ dữ liệu cũ vào Form
  const handleEditClick = (e, addr) => {
    e.stopPropagation(); // Không kích hoạt sự kiện chọn địa chỉ của thẻ cha
    setEditingAddressId(addr.address_id);
    setFormData({
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      province_name: addr.province_name,
      district_name: addr.district_name,
      ward_name: addr.ward_name,
      detail_address: addr.detail_address,
      is_default: addr.is_default,
      address_type: addr.address_type || 'home'
    });
    setIsFormOpen(true);
  };

  // Kích hoạt chế độ Thêm mới địa chỉ sạch
  const handleAddClick = () => {
    setEditingAddressId(null);
    setFormData({
      receiver_name: '',
      receiver_phone: '',
      province_name: '',
      district_name: '',
      ward_name: '',
      detail_address: '',
      is_default: false,
      address_type: 'home'
    });
    setIsFormOpen(true);
  };

  // Xử lý Xóa địa chỉ
  const handleDeleteAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await authApi.delete(`/addresses/${addressId}`);
      alert("Đã xóa địa chỉ thành công!");
      if (onRefresh) await onRefresh(); 
    } catch (err) {
      alert("Xóa địa chỉ thất bại, vui lòng thử lại!");
    }
  };

  // Xử lý Đặt mặc định và ép cập nhật giao diện lập tức tại chỗ (SỬA LỖI ĐƠ GIAO DIỆN)
  const handleSetDefault = async (e, addr) => {
    e.stopPropagation(); // Ngăn hành vi đóng modal
    
    try {
      // 1. Chuẩn hóa payload truyền lên đúng các trường DB Backend mong đợi
      const updatePayload = {
        receiver_name: addr.receiver_name,
        receiver_phone: addr.receiver_phone,
        province_name: addr.province_name,
        province_id: addr.province_id || 1,
        district_name: addr.district_name,
        district_id: addr.district_id || 1,
        ward_name: addr.ward_name,
        ward_id: addr.ward_code || addr.ward_id || 1, 
        detail_address: addr.detail_address,
        is_default: true, 
        address_type: addr.address_type || 'home'
      };

      // 2. Gửi lệnh cập nhật trạng thái lên Backend Auth-service trước
      await authApi.put(`/addresses/${addr.address_id}`, updatePayload);
      
      // 3. ĐẬP TAN LỖI ĐƠ UI: Thay đổi giá trị và ép React render lại mảng prop lồng ngay tại chỗ
      if (currentAddresses && currentAddresses.length > 0) {
        currentAddresses.forEach(item => {
          item.is_default = (item.address_id === addr.address_id);
        });
        
        // Sắp xếp lại danh sách: đẩy cái vừa đặt mặc định lên đầu danh sách ngay lập tức giống cấu trúc ORDER BY của Backend
        currentAddresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        
        // Kích hoạt thay đổi state giả lập để ép React re-render giao diện Modal bất chấp tham chiếu Props cũ
        setTick(t => t + 1);
      }

      // 4. Đồng bộ hóa dữ liệu từ Database lên trang Checkout tổng để thay đổi thẻ địa chỉ bên ngoài
      if (onRefresh) {
        await onRefresh();
      }
      
    } catch (err) {
      console.error("Lỗi đặt mặc định:", err);
      alert("Đặt mặc định thất bại, vui lòng kiểm tra lại kết nối!");
    }
  };

  // Xử lý Submit dữ liệu Form (Thêm hoặc Cập nhật)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await authApi.put(`/addresses/${editingAddressId}`, formData);
        alert("Cập nhật địa chỉ thành công!");
      } else {
        await authApi.post('/addresses', formData);
        alert("Thêm địa chỉ mới thành công!");
      }
      setIsFormOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Không thể lưu địa chỉ. Vui lòng kiểm tra lại dữ liệu!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Nút đóng Modal */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={24} />
        </button>

        {!isFormOpen ? (
          <>
            {/* VIEW 1: DANH SÁCH ĐỊA CHỈ */}
            <h2 className="font-black text-xl mb-6 text-[#006c49]">Chọn địa chỉ nhận hàng</h2>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {currentAddresses.length > 0 ? (
                currentAddresses.map((addr) => (
                  <div 
                    key={addr.address_id} 
                    onClick={() => { onSelect(addr); onClose(); }}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative group ${
                      selectedAddressId === addr.address_id 
                        ? 'border-[#006c49] bg-emerald-50' 
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start pr-16">
                      <p className="font-bold">{addr.receiver_name} | {addr.receiver_phone}</p>
                      {Boolean(addr.is_default) && (
                        <span className="text-[#006c49] text-[10px] font-black uppercase bg-emerald-100 px-2 py-0.5 rounded">Mặc định</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{addr.detail_address}, {addr.ward_name}, {addr.district_name}, {addr.province_name}</p>
                    
                    {/* Thanh công cụ Tác vụ */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!Boolean(addr.is_default) && (
                        <button 
                          onClick={(e) => handleSetDefault(e, addr)} 
                          title="Đặt làm mặc định"
                          className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-emerald-100 rounded-lg transition-colors z-10"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleEditClick(e, addr)} 
                        title="Sửa địa chỉ"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-10"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!Boolean(addr.is_default) && (
                        <button 
                          onClick={(e) => handleDeleteAddress(e, addr.address_id)} 
                          title="Xóa địa chỉ"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Bạn chưa có địa chỉ nào.</p>
              )}
            </div>

            <button 
              onClick={handleAddClick}
              className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-500 hover:border-[#006c49] hover:text-[#006c49] transition-all"
            >
              + Thêm địa chỉ mới
            </button>
          </>
        ) : (
          <>
            {/* VIEW 2: FORM THÊM / SỬA ĐỊA CHỈ */}
            <h2 className="font-black text-xl mb-6 text-[#006c49]">
              {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
            </h2>
            
            <form onSubmit={handleSubmitForm} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên người nhận</label>
                  <input required type="text" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.receiver_name} onChange={(e) => setFormData({...formData, receiver_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input required type="text" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.receiver_phone} onChange={(e) => setFormData({...formData, receiver_phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <input required type="text" placeholder="Ví dụ: Tỉnh Đắk Lắk" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.province_name} onChange={(e) => setFormData({...formData, province_name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quận / Huyện</label>
                  <input required type="text" placeholder="Ví dụ: Huyện Lắk" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.district_name} onChange={(e) => setFormData({...formData, district_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phường / Xã</label>
                  <input required type="text" placeholder="Ví dụ: Xã Đắk Liêng" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.ward_name} onChange={(e) => setFormData({...formData, ward_name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, thôn, đường)</label>
                <input required type="text" placeholder="Ví dụ: Thôn 1 Hòa Bình" className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#006c49]" value={formData.detail_address} onChange={(e) => setFormData({...formData, detail_address: e.target.value})} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_default" checked={formData.is_default} onChange={(e) => setFormData({...formData, is_default: e.target.checked})} className="w-4 h-4 accent-[#006c49]" />
                <label htmlFor="is_default" className="text-sm font-bold text-gray-700 cursor-pointer">Đặt làm địa chỉ mặc định</label>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Hủy bỏ</button>
                <button type="submit" className="flex-1 py-3 bg-[#006c49] text-white rounded-xl font-bold hover:bg-[#005a3d] transition-all">Lưu lại</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}