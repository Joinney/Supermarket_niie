import React, { useEffect, useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, ChevronDown, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";

// Component điều khiển tự động Zoom & Pan bản đồ linh hoạt theo từng cấp
function ChangeMapView({ coords, zoomLevel }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], zoomLevel || 16, {
        animate: true,
        duration: 1.2
      });
      setTimeout(() => { map.invalidateSize(); }, 200);
    }
  }, [coords, zoomLevel, map]);
  return null;
}

// Component Marker có thể kéo thả thủ công
function DraggableMarker({ position, setPosition, onDragEnd }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newLatLng = marker.getLatLng();
        if (setPosition) setPosition({ lat: newLatLng.lat, lng: newLatLng.lng });
        if (typeof onDragEnd === 'function') onDragEnd(newLatLng.lat, newLatLng.lng);
      }
    },
  }), [setPosition, onDragEnd]);

  if (!position || !position.lat || !position.lng) return null;

  return (
    <Marker 
      draggable={true} 
      eventHandlers={eventHandlers} 
      position={[position.lat, position.lng]} 
      ref={markerRef} 
    />
  );
}

export default function AddressModal(props) {
  const {
    isOpen = false,
    onClose,
    editingAddressId,
    handleSaveAddress,
    addressForm = {},
    setAddressForm,
    addresses = [],
    openDropdown,
    setOpenDropdown,
    searchTerm = '',
    setSearchTerm,
    filteredProvinces = [],
    selectProvince,
    filteredDistricts = [],
    selectDistrict,
    filteredWards = [],
    selectWard,
    showSuggestions = false,
    setShowSuggestions,
    addressSuggestions = [],
    isLoadingSuggestions = false,
    handleSelectSuggestion,
    markerPos = { lat: 10.762622, lng: 106.660172 },
    setMarkerPos,
    fetchAddressFromCoords,
    provinceRef,
    districtRef,
    wardRef,
    suggestionRef
  } = props;

  const [mapZoom, setMapZoom] = useState(16);
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [isSearchingDetail, setIsSearchingDetail] = useState(false);

  // 🌟 DÙNG NATIVE FETCH ĐỂ TRÁNH DÍNH LỖI CORS CREDENTIALS / HEADERS CỦA AXIOS
  useEffect(() => {
    if (!isOpen) return;
    
    const detailText = addressForm?.detail_address;

    if (!detailText || String(detailText).trim().length < 3) {
      if (typeof setShowSuggestions === 'function') setShowSuggestions(false);
      setLocalSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDetail(true);
      try {
        const locationParts = [
          detailText,
          addressForm?.ward_name,
          addressForm?.district_name,
          addressForm?.province_name,
          "Việt Nam"
        ].filter(item => item && typeof item === 'string' && item.trim() !== '' && !item.includes('undefined'));

        const fullQuery = locationParts.join(", ");
        const encodedQuery = encodeURIComponent(fullQuery);

        // Call API bằng Fetch nguyên bản của Browser
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=5&countrycodes=vn`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setLocalSuggestions(data);
            if (typeof setShowSuggestions === 'function') setShowSuggestions(true);
          } else {
            setLocalSuggestions([]);
          }
        }
      } catch (err) {
        console.warn("Cảnh báo tìm kiếm địa chỉ:", err.message);
      } finally {
        setIsSearchingDetail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, addressForm?.detail_address, addressForm?.ward_name, addressForm?.district_name, addressForm?.province_name, setShowSuggestions]);

  if (!isOpen) return null;

  // 🌟 HÀM GEOCODING DÙNG FETCH ĐỂ KHÔNG DÍNH LỖI USER-AGENT
  const geocodeLocation = async (queryArray, targetZoom) => {
    const validParts = queryArray.filter(part => part && typeof part === 'string' && part.trim() !== '' && !part.includes('undefined'));
    if (validParts.length === 0) return;

    const fullQuery = validParts.join(", ");
    try {
      const encodedQuery = encodeURIComponent(`${fullQuery}, Việt Nam`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (typeof setMarkerPos === 'function') setMarkerPos({ lat, lng });
          setMapZoom(targetZoom);
        }
      }
    } catch (e) {
      console.warn("Cảnh báo Geocode:", e.message);
    }
  };

  const handleSelectProvince = (id, name) => {
    if (typeof selectProvince === 'function') selectProvince(id, name);
    geocodeLocation([name], 10);
  };

  const handleSelectDistrict = (id, name) => {
    if (typeof selectDistrict === 'function') selectDistrict(id, name);
    geocodeLocation([name, addressForm?.province_name], 13);
  };

  const handleSelectWard = (code, name) => {
    if (typeof selectWard === 'function') selectWard(code, name);
    geocodeLocation([name, addressForm?.district_name, addressForm?.province_name], 15);
  };

  const handleSelectDetailSuggestion = (suggestion) => {
    if (typeof handleSelectSuggestion === 'function') {
      handleSelectSuggestion(suggestion);
    } else if (typeof setAddressForm === 'function') {
      setAddressForm(prev => ({
        ...prev,
        detail_address: suggestion.display_name ? suggestion.display_name.split(',')[0] : ''
      }));
      if (suggestion.lat && suggestion.lon && typeof setMarkerPos === 'function') {
        setMarkerPos({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
      }
    }
    if (typeof setShowSuggestions === 'function') setShowSuggestions(false);
    setMapZoom(17);
  };

  const activeSuggestions = Array.isArray(addressSuggestions) && addressSuggestions.length > 0 ? addressSuggestions : localSuggestions;
  const isSpinnerLoading = Boolean(isLoadingSuggestions) || isSearchingDetail;

  const currentLat = markerPos?.lat || 10.762622;
  const currentLng = markerPos?.lng || 106.660172;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        
        {/* Header Modal */}
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {editingAddressId ? "Chỉnh sửa vị trí" : "Thêm điểm nhận hàng mới"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-red-500 transition-all">
            <X size={20}/>
          </button>
        </div>
        
        {/* Form Nhập Liệu */}
        <form onSubmit={handleSaveAddress} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2 no-scrollbar">
          
          {/* Thông tin cá nhân */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Người nhận</label>
              <input required type="text" className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm?.receiver_name || ''} onChange={e => setAddressForm && setAddressForm({...addressForm, receiver_name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SĐT liên hệ</label>
              <input required type="text" className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm?.receiver_phone || ''} onChange={e => setAddressForm && setAddressForm({...addressForm, receiver_phone: e.target.value})} />
            </div>
          </div>

          {/* Chọn Tỉnh / Thành Phố */}
          <div className="relative" ref={provinceRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tỉnh / Thành phố</label>
            <div onClick={() => { if (typeof setOpenDropdown === 'function') setOpenDropdown(openDropdown === 'province' ? null : 'province'); if (typeof setSearchTerm === 'function') setSearchTerm(''); }} className="w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer hover:border-gray-300 focus:border-[#006c49]">
              <span className={`font-bold ${addressForm?.province_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm?.province_name || '-- Chọn Tỉnh / Thành phố --'}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
            {openDropdown === 'province' && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input autoFocus type="text" placeholder="Nhập từ khóa tìm kiếm tỉnh thành..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm || ''} onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)} />
                </div>
                <div className="overflow-y-auto max-h-40 no-scrollbar">
                  {Array.isArray(filteredProvinces) && filteredProvinces.length > 0 ? filteredProvinces.map(p => (
                    <div key={p.ProvinceID} onClick={() => handleSelectProvince(p.ProvinceID, p.ProvinceName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{p.ProvinceName}</div>
                  )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy tỉnh thành</div>}
                </div>
              </div>
            )}
          </div>

          {/* Quận Huyện & Phường Xã */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quận / Huyện */}
            <div className="relative" ref={districtRef}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Quận / Huyện</label>
              <div onClick={() => { if (!addressForm?.province_id) return; if (typeof setOpenDropdown === 'function') setOpenDropdown(openDropdown === 'district' ? null : 'district'); if (typeof setSearchTerm === 'function') setSearchTerm(''); }} className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm?.province_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}>
                <span className={`font-bold ${addressForm?.district_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm?.district_name || '-- Quận/Huyện --'}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              {openDropdown === 'district' && addressForm?.province_id && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                  <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input autoFocus type="text" placeholder="Gõ tên quận huyện..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm || ''} onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)} />
                  </div>
                  <div className="overflow-y-auto max-h-40 no-scrollbar">
                    {Array.isArray(filteredDistricts) && filteredDistricts.length > 0 ? filteredDistricts.map(d => (
                      <div key={d.DistrictID} onClick={() => handleSelectDistrict(d.DistrictID, d.DistrictName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{d.DistrictName}</div>
                    )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy dữ liệu</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Phường / Xã */}
            <div className="relative" ref={wardRef}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phường / Xã</label>
              <div onClick={() => { if (!addressForm?.district_id) return; if (typeof setOpenDropdown === 'function') setOpenDropdown(openDropdown === 'ward' ? null : 'ward'); if (typeof setSearchTerm === 'function') setSearchTerm(''); }} className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm?.district_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}>
                <span className={`font-bold ${addressForm?.ward_name ? 'text-slate-800' : 'text-slate-400'}`}>{addressForm?.ward_name || '-- Phường/Xã --'}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              {openDropdown === 'ward' && addressForm?.district_id && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                  <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input autoFocus type="text" placeholder="Gõ tên phường xã..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm || ''} onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)} />
                  </div>
                  <div className="overflow-y-auto max-h-40 no-scrollbar">
                    {Array.isArray(filteredWards) && filteredWards.length > 0 ? filteredWards.map(w => (
                      <div key={w.WardCode} onClick={() => handleSelectWard(w.WardCode, w.WardName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{w.WardName}</div>
                    )) : <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy dữ liệu</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ô nhập địa chỉ chi tiết & Gợi ý */}
          <div className="space-y-1 relative" ref={suggestionRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số nhà, tên đường chi tiết</label>
            <div className="relative flex items-center">
              <input required type="text" placeholder={addressForm?.province_name ? `Nhập địa chỉ thuộc ${addressForm.province_name}...` : "Vui lòng chọn Tỉnh/Thành trước để định vị..."} className="w-full bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all pr-10" value={addressForm?.detail_address || ''} onChange={e => setAddressForm && setAddressForm({...addressForm, detail_address: e.target.value})} onFocus={() => { if (activeSuggestions.length > 0 && typeof setShowSuggestions === 'function') setShowSuggestions(true); }} />
              {isSpinnerLoading && <div className="absolute right-3"><Loader2 size={16} className="animate-spin text-[#006c49]" /></div>}
            </div>
            {showSuggestions && activeSuggestions.length > 0 && (
              <div className="absolute z-[110] w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-56">
                <div className="overflow-y-auto no-scrollbar">
                  {activeSuggestions.map((suggestion, index) => (
                    <div key={index} onClick={() => handleSelectDetailSuggestion(suggestion)} className="p-3 text-xs font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer border-b border-slate-50 last:border-none transition-all flex items-start gap-2 text-left">
                      <MapPin size={14} className="mt-0.5 text-[#006c49] shrink-0" />
                      <span className="text-slate-700 leading-normal">{suggestion.display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bản đồ định vị GPS */}
          <div className="space-y-1">
            <div className="w-full h-56 rounded-2xl overflow-hidden border relative z-10 mt-1">
              <MapContainer center={[currentLat, currentLng]} zoom={mapZoom} zoomControl={false} scrollWheelZoom={true} className="w-full h-full">
                <TileLayer attribution='&copy; <a href="https://www.esri.com/">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
                <ChangeMapView coords={{ lat: currentLat, lng: currentLng }} zoomLevel={mapZoom} />
                <DraggableMarker position={{ lat: currentLat, lng: currentLng }} setPosition={setMarkerPos} onDragEnd={(lat, lng) => fetchAddressFromCoords && fetchAddressFromCoords(lat, lng)} />
              </MapContainer>
            </div>
          </div>

          {/* Phân loại & Thiết lập mặc định */}
          <div className="flex justify-between items-center pt-1">
            <div className="flex gap-2">
              {['home', 'office'].map(type => (
                <button key={type} type="button" onClick={() => setAddressForm && setAddressForm({...addressForm, address_type: type})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addressForm?.address_type === type ? 'bg-[#006c49] text-white border-[#006c49]' : 'bg-white text-slate-400 border-slate-100'}`}>{type === 'home' ? 'Nhà riêng' : 'Văn phòng'}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="hidden" checked={Boolean(addressForm?.is_default)} disabled={Array.isArray(addresses) && addresses.length === 0 && Boolean(addressForm?.is_default)} onChange={e => setAddressForm && setAddressForm({...addressForm, is_default: e.target.checked})} />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addressForm?.is_default ? 'bg-[#006c49] border-[#006c49]' : 'border-slate-200'}`}>
                {addressForm?.is_default && <CheckCircle2 size={12} className="text-white"/>}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mặc định</span>
            </label>
          </div>

          {/* Các nút điều khiển hành động */}
          <div className="flex gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider text-slate-400 hover:bg-slate-50">Hủy</button>
            <button type="submit" className="flex-1 bg-[#006c49] text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md">Lưu dữ liệu</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}