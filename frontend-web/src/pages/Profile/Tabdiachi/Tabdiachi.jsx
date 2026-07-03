import React from "react";
import { MapPin, Plus, Edit2, Trash2, Check } from "lucide-react";
import AddressModal from "./AddressModal"; // Import component vừa tách

export default function Tabdiachi({
  addresses, handleOpenAddModal, handleOpenEditModal, handleDeleteAddress, handleSetDefault,
  isAddressModalOpen, setIsAddressModalOpen, editingAddressId, handleSaveAddress, addressForm, setAddressForm,
  openDropdown, setOpenDropdown, searchTerm, setSearchTerm, filteredProvinces, selectProvince,
  filteredDistricts, selectDistrict, filteredWards, selectWard, showSuggestions, setShowSuggestions,
  addressSuggestions, isLoadingSuggestions, handleSelectSuggestion, markerPos, setMarkerPos, fetchAddressFromCoords,
  provinceRef, districtRef, wardRef, suggestionRef
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Sổ địa chỉ cá nhân</h2>
          <p className="text-[11px] font-medium text-slate-400">Quản lý điểm giao nhận phục vụ định tuyến cước vận chuyển tự động</p>
        </div>
        <button onClick={handleOpenAddModal} className="bg-[#006c49] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#006c49]/20 hover:scale-105 active:scale-95 transition-all">
          <Plus size={14} className="stroke-[3]" /> Thêm địa chỉ mới
        </button>
      </div>

      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div key={addr.address_id} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-all relative overflow-hidden group gap-4">
              <div className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-[#006c49] transition-all" />
              <div className="space-y-2 flex-1 pl-1 text-left">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-black text-slate-900 text-sm">{addr.receiver_name}</span>
                  <span className="text-slate-200 hidden sm:inline">|</span>
                  <span className="text-[#006c49] bg-emerald-50 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-wide">{addr.receiver_phone}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${addr.address_type === 'home' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {addr.address_type === 'home' ? 'Nhà riêng' : 'Văn phòng'}
                  </span>
                  {Boolean(addr.is_default) && <span className="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100 font-black uppercase tracking-wider">Mặc định</span>}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">{addr.detail_address}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest"><span className="text-slate-300">📍</span> {`${addr.ward_name} • ${addr.district_name} • ${addr.province_name}`}</p>
                  {addr.latitude && addr.longitude && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-dashed block w-max mt-1">
                      GPS: {parseFloat(addr.latitude).toFixed(4)}, {parseFloat(addr.longitude).toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                <div className="flex items-center gap-3.5">
                  <button onClick={() => handleOpenEditModal(addr)} className="text-[10px] font-black text-[#006c49] hover:underline uppercase tracking-wider flex items-center gap-1"><Edit2 size={11} /> Cập nhật</button>
                  {!Boolean(addr.is_default) && <button onClick={() => handleDeleteAddress(addr.address_id)} className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wider flex items-center gap-1"><Trash2 size={11} /> Xóa</button>}
                </div>
                <button disabled={Boolean(addr.is_default)} onClick={() => handleSetDefault(addr.address_id)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${Boolean(addr.is_default) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-[#006c49] hover:text-[#006c49]'}`}>
                  {Boolean(addr.is_default) ? <span className="flex items-center gap-1"><Check size={10} className="stroke-[3]"/> Đang mặc định</span> : 'Đặt làm mặc định'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-50/40 rounded-3xl border-2 border-dashed border-slate-100 p-8 text-slate-300">
            <MapPin size={36} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sổ địa chỉ trống rỗng</p>
          </div>
        )}
      </div>

      {/* Sử dụng Component Modal vừa được tách riêng ra */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        editingAddressId={editingAddressId}
        handleSaveAddress={handleSaveAddress}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        addresses={addresses}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredProvinces={filteredProvinces}
        selectProvince={selectProvince}
        filteredDistricts={filteredDistricts}
        selectDistrict={selectDistrict}
        filteredWards={filteredWards}
        selectWard={selectWard}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        addressSuggestions={addressSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        handleSelectSuggestion={handleSelectSuggestion}
        markerPos={markerPos}
        setMarkerPos={setMarkerPos}
        fetchAddressFromCoords={fetchAddressFromCoords}
        provinceRef={provinceRef}
        districtRef={districtRef}
        wardRef={wardRef}
        suggestionRef={suggestionRef}
      />
    </div>
  );
}