import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit2, Check, Loader2, ChevronDown, Search } from 'lucide-react';
import axios from 'axios';
import { authApi } from '../../api/axios';

export default function AddressModal({ isOpen, onClose, onSelect, currentAddresses, selectedAddressId, onRefresh }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [, setTick] = useState(0);

  // --- DỮ LIỆU ĐỊA CHÍNH TỪ API ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingGeography, setLoadingGeography] = useState(false);

  // --- QUẢN LÝ TRẠNG THÁI ĐÓNG/MỞ & TÌM KIẾM CỦA CUSTOM DROPDOWN ---
  const [openDropdown, setOpenDropdown] = useState(null); // 'province', 'district', 'ward'
  const [searchTerm, setSearchTerm] = useState('');

  // Ref để bấm ra ngoài thì tự động đóng dropdown lọc
  const provinceRef = useRef(null);
  const districtRef = useRef(null);
  const wardRef = useRef(null);

  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_phone: '',
    province_name: '',
    province_id: '',
    district_name: '',
    district_id: '',
    ward_name: '',
    ward_code: '',
    detail_address: '',
    is_default: false,
    address_type: 'home'
  });

  // Tự động đóng dropdown khi click ra ngoài vùng chọn
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        (provinceRef.current && !provinceRef.current.contains(event.target)) &&
        (districtRef.current && !districtRef.current.contains(event.target)) &&
        (wardRef.current && !wardRef.current.contains(event.target))
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. TỰ ĐỘNG LẤY DANH SÁCH TỈNH/THÀNH PHỐ
  useEffect(() => {
    if (isFormOpen) {
      const fetchProvinces = async () => {
        try {
          setLoadingGeography(true);
          const res = await axios.get('http://localhost:5001/api/addresses/locations/provinces');
          if (res.data && res.data.success) {
            setProvinces(res.data.data || []);
          }
        } catch (err) {
          console.error("🔥 Không thể bốc danh mục Tỉnh/Thành:", err.message);
        } finally {
          setLoadingGeography(false);
        }
      };
      fetchProvinces();
    }
  }, [isFormOpen]);

  if (!isOpen) return null;

  // --- XỬ LÝ CHỌN VÀ FETCH DỮ LIỆU LỒNG NHAU ---
  const selectProvince = async (id, name) => {
    setDistricts([]);
    setWards([]);
    setFormData(prev => ({
      ...prev,
      province_id: id,
      province_name: name,
      district_id: '',
      district_name: '',
      ward_code: '',
      ward_name: ''
    }));
    setOpenDropdown(null);
    setSearchTerm('');

    setLoadingGeography(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/addresses/locations/districts?province_id=${id}`);
      if (res.data && res.data.success) {
        setDistricts(res.data.data || []);
      }
    } catch (err) {
      console.error("🔥 Lỗi lấy Quận/Huyện:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  const selectDistrict = async (id, name) => {
    setWards([]);
    setFormData(prev => ({
      ...prev,
      district_id: id,
      district_name: name,
      ward_code: '',
      ward_name: ''
    }));
    setOpenDropdown(null);
    setSearchTerm('');

    setLoadingGeography(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/addresses/locations/wards?district_id=${id}`);
      if (res.data && res.data.success) {
        setWards(res.data.data || []);
      }
    } catch (err) {
      console.error("🔥 Lỗi lấy Phường/Xã:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  const selectWard = (code, name) => {
    setFormData(prev => ({
      ...prev,
      ward_code: code,
      ward_name: name
    }));
    setOpenDropdown(null);
    setSearchTerm('');
  };

  // --- FILTER DỮ LIỆU THEO TỪ KHÓA ĐANG GÕ ---
  const filteredProvinces = provinces.filter(p =>
    p.ProvinceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDistricts = districts.filter(d =>
    d.DistrictName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWards = wards.filter(w =>
    w.WardName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Kích hoạt sửa địa chỉ
  const handleEditClick = async (e, addr) => {
    e.stopPropagation(); 
    setEditingAddressId(addr.address_id);
    setFormData({
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      province_name: addr.province_name,
      province_id: addr.province_id || '',
      district_name: addr.district_name,
      district_id: addr.district_id || '',
      ward_name: addr.ward_name,
      ward_code: addr.ward_code || addr.ward_id || '',
      detail_address: addr.detail_address,
      is_default: addr.is_default,
      address_type: addr.address_type || 'home'
    });
    setIsFormOpen(true);

    if (addr.province_id) {
      try {
        setLoadingGeography(true);
        const distRes = await axios.get(`http://localhost:5001/api/addresses/locations/districts?province_id=${addr.province_id}`);
        if (distRes.data.success) setDistricts(distRes.data.data || []);
        
        if (addr.district_id) {
          const wardRes = await axios.get(`http://localhost:5001/api/addresses/locations/wards?district_id=${addr.district_id}`);
          if (wardRes.data.success) setWards(wardRes.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải đệm địa chính khi sửa:", err);
      } finally {
        setLoadingGeography(false);
      }
    }
  };

  const handleAddClick = () => {
    setEditingAddressId(null);
    setDistricts([]);
    setWards([]);
    setFormData({
      receiver_name: '', receiver_phone: '', province_name: '', province_id: '',
      district_name: '', district_id: '', ward_name: '', ward_code: '',
      detail_address: '', is_default: false, address_type: 'home'
    });
    setIsFormOpen(true);
  };

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

  const handleSetDefault = async (e, addr) => {
    e.stopPropagation(); 
    try {
      const updatePayload = {
        receiver_name: addr.receiver_name, receiver_phone: addr.receiver_phone,
        province_name: addr.province_name, province_id: Number(addr.province_id) || 1,
        district_name: addr.district_name, district_id: Number(addr.district_id) || 1,
        ward_name: addr.ward_name, ward_id: String(addr.ward_code || addr.ward_id || "1"), 
        detail_address: addr.detail_address, is_default: true, address_type: addr.address_type || 'home'
      };
      await authApi.put(`/addresses/${addr.address_id}`, updatePayload);
      if (currentAddresses && currentAddresses.length > 0) {
        currentAddresses.forEach(item => {
          item.is_default = (item.address_id === addr.address_id);
        });
        currentAddresses.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        setTick(t => t + 1);
      }
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Đặt mặc định thất bại!");
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.province_id || !formData.district_id || !formData.ward_code) {
      return alert("Vui lòng chọn đầy đủ danh mục Tỉnh, Quận, Phường từ menu!");
    }
    const finalPayload = {
      ...formData,
      province_id: Number(formData.province_id),
      district_id: Number(formData.district_id),
      ward_id: String(formData.ward_code),
      ward_code: String(formData.ward_code)
    };
    try {
      if (editingAddressId) {
        await authApi.put(`/addresses/${editingAddressId}`, finalPayload);
        alert("Cập nhật địa chỉ thành công!");
      } else {
        await authApi.post('/addresses', finalPayload);
        alert("Thêm địa chỉ mới thành công!");
      }
      setIsFormOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Không thể lưu địa chỉ. Vui lòng kiểm tra lại dữ liệu!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl border border-white/20">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        {!isFormOpen ? (
          <>
            <h2 className="font-black text-xl mb-6 text-[#006c49]">Chọn địa chỉ nhận hàng</h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {currentAddresses.length > 0 ? (
                currentAddresses.map((addr) => (
                  <div 
                    key={addr.address_id} 
                    onClick={() => { onSelect(addr); onClose(); }}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative group ${
                      selectedAddressId === addr.address_id ? 'border-[#006c49] bg-emerald-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start pr-16">
                      <p className="font-bold text-slate-900">{addr.receiver_name} | {addr.receiver_phone}</p>
                      {Boolean(addr.is_default) && <span className="text-[#006c49] text-[10px] font-black uppercase bg-emerald-100 px-2 py-0.5 rounded shadow-sm">Mặc định</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{addr.detail_address}, {addr.ward_name}, {addr.district_name}, {addr.province_name}</p>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!Boolean(addr.is_default) && (
                        <button onClick={(e) => handleSetDefault(e, addr)} className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-emerald-100 rounded-lg transition-colors z-10"><Check size={16} /></button>
                      )}
                      <button onClick={(e) => handleEditClick(e, addr)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-10"><Edit2 size={14} /></button>
                      {!Boolean(addr.is_default) && (
                        <button onClick={(e) => handleDeleteAddress(e, addr.address_id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Bạn chưa có địa chỉ nào.</p>
              )}
            </div>
            <button onClick={handleAddClick} className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-500 hover:border-[#006c49] hover:text-[#006c49] hover:bg-emerald-50/20 transition-all">+ Thêm địa chỉ mới</button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-xl text-[#006c49]">{editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}</h2>
              {loadingGeography && <div className="flex items-center gap-1 text-xs text-amber-600 font-bold"><Loader2 className="animate-spin" size={14} /> Đang nạp dữ liệu...</div>}
            </div>
            
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

              {/* 🎯 SEARCHABLE DROPDOWN 1: TỈNH / THÀNH PHỐ */}
              <div className="relative" ref={provinceRef}>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <div 
                  onClick={() => { setOpenDropdown(openDropdown === 'province' ? null : 'province'); setSearchTerm(''); }}
                  className="w-full border p-2.5 rounded-xl text-sm flex justify-between items-center bg-white cursor-pointer hover:border-gray-400 focus:border-[#006c49]"
                >
                  <span className={formData.province_name ? 'text-black' : 'text-gray-400'}>
                    {formData.province_name || '-- Gõ để tìm kiếm Tỉnh / Thành --'}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </div>

                {openDropdown === 'province' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Nhập tên tỉnh thành để tìm..." 
                        className="w-full bg-transparent text-sm outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 max-h-48">
                      {filteredProvinces.length > 0 ? (
                        filteredProvinces.map(p => (
                          <div 
                            key={p.ProvinceID}
                            onClick={() => selectProvince(p.ProvinceID, p.ProvinceName)}
                            className="p-2.5 text-sm hover:bg-emerald-50 hover:text-[#006c49] font-medium cursor-pointer transition-colors"
                          >
                            {p.ProvinceName}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-gray-400 text-center">Không tìm thấy tỉnh thành này</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 🎯 SEARCHABLE DROPDOWN 2: QUẬN / HUYỆN */}
                <div className="relative" ref={districtRef}>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quận / Huyện</label>
                  <div 
                    onClick={() => {
                      if (!formData.province_id) return;
                      setOpenDropdown(openDropdown === 'district' ? null : 'district');
                      setSearchTerm('');
                    }}
                    className={`w-full border p-2.5 rounded-xl text-sm flex justify-between items-center bg-white cursor-pointer ${!formData.province_id ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}`}
                  >
                    <span className={formData.district_name ? 'text-black' : 'text-gray-400'}>
                      {formData.district_name || '-- Chọn Quận/Huyện --'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>

                  {openDropdown === 'district' && formData.province_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Nhập quận huyện để tìm..." 
                          className="w-full bg-transparent text-sm outline-none"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 max-h-48">
                        {filteredDistricts.length > 0 ? (
                          filteredDistricts.map(d => (
                            <div 
                              key={d.DistrictID}
                              onClick={() => selectDistrict(d.DistrictID, d.DistrictName)}
                              className="p-2.5 text-sm hover:bg-emerald-50 hover:text-[#006c49] font-medium cursor-pointer transition-colors"
                            >
                              {d.DistrictName}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-gray-400 text-center">Không tìm thấy quận huyện này</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🎯 SEARCHABLE DROPDOWN 3: PHƯỜNG / XÃ */}
                <div className="relative" ref={wardRef}>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phường / Xã</label>
                  <div 
                    onClick={() => {
                      if (!formData.district_id) return;
                      setOpenDropdown(openDropdown === 'ward' ? null : 'ward');
                      setSearchTerm('');
                    }}
                    className={`w-full border p-2.5 rounded-xl text-sm flex justify-between items-center bg-white cursor-pointer ${!formData.district_id ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}`}
                  >
                    <span className={formData.ward_name ? 'text-black' : 'text-gray-400'}>
                      {formData.ward_name || '-- Chọn Phường/Xã --'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>

                  {openDropdown === 'ward' && formData.district_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Nhập phường xã để tìm..." 
                          className="w-full bg-transparent text-sm outline-none"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 max-h-48">
                        {filteredWards.length > 0 ? (
                          filteredWards.map(w => (
                            <div 
                              key={w.WardCode}
                              onClick={() => selectWard(w.WardCode, w.WardName)}
                              className="p-2.5 text-sm hover:bg-emerald-50 hover:text-[#006c49] font-medium cursor-pointer transition-colors"
                            >
                              {w.WardName}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-gray-400 text-center">Không tìm thấy phường xã này</div>
                        )}
                      </div>
                    </div>
                  )}
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