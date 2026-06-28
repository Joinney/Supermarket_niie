import React from "react";
import { MapPin, Plus, Edit2, Trash2, Check, CheckCircle2, ChevronDown, Search, Loader2, X } from "lucide-react";
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";

function ChangeMapView({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], 16);
      setTimeout(() => { map.invalidateSize(); }, 200);
    }
  }, [coords, map]);
  return null;
}

function DraggableMarker({ position, setPosition, onDragEnd }) {
  const markerRef = React.useRef(null);
  const eventHandlers = React.useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newLatLng = marker.getLatLng();
        setPosition({ lat: newLatLng.lat, lng: newLatLng.lng });
        if (onDragEnd) onDragEnd(newLatLng.lat, newLatLng.lng);
      }
    },
  }), [setPosition, onDragEnd]);

  return <Marker draggable={true} eventHandlers={eventHandlers} position={[position.lat, position.lng]} ref={markerRef} />;
}

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

      {/* MODAL GEOGRAPHY */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{editingAddressId ? "Chỉnh sửa vị trí" : "Thêm điểm nhận hàng mới"}</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Người nhận</label>
                  <input required type="text" className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm.receiver_name} onChange={e => setAddressForm({...addressForm, receiver_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SĐT liên hệ</label>
                  <input required type="text" className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm.receiver_phone} onChange={e => setAddressForm({...addressForm, receiver_phone: e.target.value})} />
                </div>
              </div>

              <div className="relative" ref={provinceRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tỉnh / Thành phố</label>
                <div onClick={() => { setOpenDropdown(openDropdown === 'province' ? null : 'province'); setSearchTerm(''); }} className="w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer hover:border-gray-300 focus:border-[#006c49]">
                  <span className={`font-bold ${addressForm.province_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm.province_name || '-- Chọn Tỉnh / Thành phố --'}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
                {openDropdown === 'province' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input autoFocus type="text" placeholder="Nhập từ khóa tìm kiếm tỉnh thành..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="overflow-y-auto max-h-40 no-scrollbar">
                      {filteredProvinces.length > 0 ? filteredProvinces.map(p => (
                        <div key={p.ProvinceID} onClick={() => selectProvince(p.ProvinceID, p.ProvinceName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{p.ProvinceName}</div>
                      )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy tỉnh thành</div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={districtRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Quận / Huyện</label>
                  <div onClick={() => { if (!addressForm.province_id) return; setOpenDropdown(openDropdown === 'district' ? null : 'district'); setSearchTerm(''); }} className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm.province_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}>
                    <span className={`font-bold ${addressForm.district_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm.district_name || '-- Quận/Huyện --'}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                  {openDropdown === 'district' && addressForm.province_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Gõ tên quận huyện..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="overflow-y-auto max-h-40 no-scrollbar">
                        {filteredDistricts.length > 0 ? filteredDistricts.map(d => (
                          <div key={d.DistrictID} onClick={() => selectDistrict(d.DistrictID, d.DistrictName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{d.DistrictName}</div>
                        )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy dữ liệu</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={wardRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phường / Xã</label>
                  <div onClick={() => { if (!addressForm.district_id) return; setOpenDropdown(openDropdown === 'ward' ? null : 'ward'); setSearchTerm(''); }} className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm.district_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}>
                    <span className={`font-bold ${addressForm.ward_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm.ward_name || '-- Phường/Xã --'}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                  {openDropdown === 'ward' && addressForm.district_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Gõ tên phường xã..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="overflow-y-auto max-h-40 no-scrollbar">
                        {filteredWards.length > 0 ? filteredWards.map(w => (
                          <div key={w.WardCode} onClick={() => selectWard(w.WardCode, w.WardName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{w.WardName}</div>
                        )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy dữ liệu</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 relative" ref={suggestionRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số nhà, tên đường chi tiết</label>
                <div className="relative flex items-center">
                  <input required type="text" placeholder={addressForm.province_name ? `Nhập địa chỉ thuộc ${addressForm.province_name}...` : "Vui lòng chọn Tỉnh/Thành trước để định vị..."} className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all pr-10" value={addressForm.detail_address} onChange={e => setAddressForm({...addressForm, detail_address: e.target.value})} onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }} />
                  {isLoadingSuggestions && <div className="absolute right-3"><Loader2 size={16} className="animate-spin text-[#006c49]" /></div>}
                </div>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-[10007] w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-56">
                    <div className="overflow-y-auto no-scrollbar">
                      {addressSuggestions.map((suggestion, index) => (
                        <div key={index} onClick={() => handleSelectSuggestion(suggestion)} className="p-3 text-xs font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer border-b border-slate-50 last:border-none transition-all flex items-start gap-2 text-left">
                          <MapPin size={14} className="mt-0.5 text-[#006c49] shrink-0" />
                          <span className="text-slate-700 leading-normal">{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded-lg border border-dashed">
                  <span>Hệ tọa độ vệ tinh WGS84:</span>
                  <span>{markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}</span>
                </div>
                <div className="w-full h-56 rounded-2xl overflow-hidden border relative z-10 mt-1">
                  <MapContainer center={[markerPos.lat, markerPos.lng]} zoom={16} scrollWheelZoom={false} className="w-full h-full">
                    <TileLayer attribution='&copy; <a href="https://www.esri.com/">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
                    <ChangeMapView coords={markerPos} />
                    <DraggableMarker position={markerPos} setPosition={setMarkerPos} onDragEnd={(lat, lng) => fetchAddressFromCoords(lat, lng)} />
                  </MapContainer>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex gap-2">
                  {['home', 'office'].map(type => (
                    <button key={type} type="button" onClick={() => setAddressForm({...addressForm, address_type: type})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addressForm.address_type === type ? 'bg-[#006c49] text-white border-[#006c49]' : 'bg-white text-slate-400 border-slate-100'}`}>{type === 'home' ? 'Nhà riêng' : 'Văn phòng'}</button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="hidden" checked={addressForm.is_default} disabled={addresses.length === 0 && addressForm.is_default} onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})} />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addressForm.is_default ? 'bg-[#006c49] border-[#006c49]' : 'border-slate-200'}`}>
                    {addressForm.is_default && <CheckCircle2 size={12} className="text-white"/>}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mặc định</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsAddressModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider text-slate-400 hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 bg-[#006c49] text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md">Lưu dữ liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}