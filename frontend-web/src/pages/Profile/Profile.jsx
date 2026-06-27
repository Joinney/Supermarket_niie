import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext"; 
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix lỗi icon mặc định của Leaflet khi build trên React
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});
import { 
  User, Mail, Phone, MapPin, Camera, CheckCircle2, Lock, Heart, 
  ChevronRight, Clock, Package, ShieldCheck, CreditCard, 
  Star, Wallet, Ticket, Bell, Eye, History, Zap, Award, X, Plus, ChevronDown, Search, Trash2, Edit2, Check, Loader2
} from "lucide-react";

// 🚀 IMPORT THƯ VIỆN CẮT ẢNH CHUYÊN NGHIỆP
import Cropper from "react-easy-crop";

// --- CẤU HÌNH API INSTANCE TỰ ĐỘNG DI CHUYỂN MÔI TRƯỜNG ---
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost ? 'http://localhost:5001' : 'https://authservice-sz4p.onrender.com';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 📦 HELPER TẠO ẢNH ĐÃ CẮT TỪ CANVAS (CANVAS CROPPER UTILS)
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous"; // Tránh lỗi CORS khi xử lý ảnh từ Cloudinary/Render
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas trống rỗng"));
          return;
        }
        blob.name = "cropped-avatar.jpeg";
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
};

export default function ProfilePage() {
  // --- STATE BẢN ĐỒ ---
  const [markerPos, setMarkerPos] = useState({ lat: 10.762622, lng: 106.660172 }); // Mặc định TP.HCM
  const { user: authUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { tab } = useParams();

  const [profile, setProfile] = useState(null); 
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loading, setLoading] = useState(true);

  // --- STATES QUẢN LÝ CẮT ẢNH ĐẠI DIỆN ---
  const [imageSrc, setImageSrc] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false); 

  // --- STATES QUẢN LÝ DANH MỤC ĐỊA CHÍNH ĐỘNG ---
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); 
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingGeography, setLoadingGeography] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

  const provinceRef = useRef(null);
  const districtRef = useRef(null);
  const wardRef = useRef(null);

  const [addressForm, setAddressForm] = useState({
    receiver_name: "", receiver_phone: "",
    province_name: "", province_id: "", 
    district_name: "", district_id: "", 
    ward_name: "", ward_code: "",      
    detail_address: "", is_default: false, address_type: "home"
  });

  // --- STATE QUẢN LÝ TAB BẢO MẬT ---
  const [securityStep, setSecurityStep] = useState("verify-password"); 
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const mobileTabs = [
    { id: "profile", path: "", label: "Hồ sơ", icon: <User size={14}/> },
    { id: "notifications", path: "notifications", label: "Thông báo", icon: <Bell size={14}/> },
    { id: "addresses", path: "address", label: "Địa chỉ", icon: <MapPin size={14}/> },
    { id: "security", path: "security", label: "Bảo mật", icon: <Lock size={14}/> },
    { id: "orders", path: "orders", label: "Đơn hàng", icon: <Package size={14}/> },
    { id: "vouchers", path: "vouchers", label: "Voucher", icon: <Ticket size={14}/> },
    { id: "favorites", path: "favorites", label: "Đã thích", icon: <Heart size={14}/> },
  ];

  const menuGroups = [
    { title: "Cá nhân", items: mobileTabs.slice(0, 4) },
    { title: "Mua sắm", items: mobileTabs.slice(4) }
  ];

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

  useEffect(() => {
    const currentTab = mobileTabs.find(t => t.path === (tab || ""));
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else {
      setActiveTab("profile");
    }
  }, [tab]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/profile/hoso");
        if (response.data.success) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi kết nối API hồ sơ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") {
      fetchAddresses();
    }
  }, [activeTab]);

  // 🔴 ĐÃ SỬA: Chuyển sang gọi API_BASE_URL để Render bốc được dữ liệu Tỉnh/Thành
  useEffect(() => {
    if (isAddressModalOpen) {
      const fetchProvincesGeo = async () => {
        try {
          setLoadingGeography(true);
          const res = await axios.get(`${API_BASE_URL}/api/addresses/locations/provinces`);
          if (res.data && res.data.success) {
            setProvinces(res.data.data || []);
          }
        } catch (err) {
          console.error("🔥 Lỗi bốc danh mục Tỉnh/Thành:", err.message);
        } finally {
          setLoadingGeography(false);
        }
      };
      fetchProvincesGeo();
    }
  }, [isAddressModalOpen]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/addresses");
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách địa chỉ:", error);
    }
  };
  function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng], 16);
  }, [coords]);
  return null;
}

  // 🔴 ĐÃ SỬA: Chuyển sang gọi API_BASE_URL động cho Quận/Huyện
  const selectProvince = async (id, name) => {
    setDistricts([]);
    setWards([]);
    setAddressForm(prev => ({
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
      const res = await axios.get(`${API_BASE_URL}/api/addresses/locations/districts?province_id=${id}`);
      if (res.data && res.data.success) {
        setDistricts(res.data.data || []);
      }
    } catch (err) {
      console.error("🔥 Lỗi lấy danh mục Quận/Huyện:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  // 🔴 ĐÃ SỬA: Chuyển sang gọi API_BASE_URL động cho Phường/Xã
  const selectDistrict = async (id, name) => {
    setWards([]);
    setAddressForm(prev => ({
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
      const res = await axios.get(`${API_BASE_URL}/api/addresses/locations/wards?district_id=${id}`);
      if (res.data && res.data.success) {
        setWards(res.data.data || []);
      }
    } catch (err) {
      console.error("🔥 Lỗi lấy danh mục Phường/Xã:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  const selectWard = (code, name) => {
    setAddressForm(prev => ({ ...prev, ward_code: code, ward_name: name }));
    setOpenDropdown(null);
    setSearchTerm('');
  };

  const filteredProvinces = provinces.filter(p => p.ProvinceName.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDistricts = districts.filter(d => d.DistrictName.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredWards = wards.filter(w => w.WardName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setDistricts([]);
    setWards([]);
    setAddressForm({
      receiver_name: profile?.full_name || "",
      receiver_phone: profile?.phone_number || "",
      province_name: "", province_id: "", 
      district_name: "", district_id: "", 
      ward_name: "", ward_code: "",
      detail_address: "", is_default: addresses.length === 0, address_type: "home"
    });
    setIsAddressModalOpen(true);
  };

// Tìm tọa độ từ chuỗi địa chỉ (Forward Geocoding)
  const handleAutoLocate = async (e) => {
    if (e) e.preventDefault();
    
    // Ghép chuỗi từ chi tiết đến tổng quát để API dễ tìm nhất
    const fullStr = `${addressForm.detail_address}, ${addressForm.ward_name}, ${addressForm.district_name}, ${addressForm.province_name}, Việt Nam`;
    
    try {
      showToast("Đang quét vị trí trên bản đồ...", "success");
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullStr)}&limit=1`);
      
      if (res.data && res.data.length > 0) {
        const foundLat = parseFloat(res.data[0].lat);
        const foundLng = parseFloat(res.data[0].lon);
        setMarkerPos({ lat: foundLat, lng: foundLng });
        showToast("Đã ghim vị trí thành công!");
      } else {
        // Fallback: Nếu gõ số nhà quá chi tiết API free không tìm ra, thử tìm theo Phường/Xã
        const fallbackStr = `${addressForm.ward_name}, ${addressForm.district_name}, ${addressForm.province_name}, Việt Nam`;
        const resFallback = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackStr)}&limit=1`);
        
        if (resFallback.data && resFallback.data.length > 0) {
          setMarkerPos({ lat: parseFloat(resFallback.data[0].lat), lng: parseFloat(resFallback.data[0].lon) });
          showToast("Chỉ tìm thấy khu vực Phường/Xã. Vui lòng kéo ghim đỏ tới đúng nhà bạn nhé!", "error");
        }
      }
    } catch (err) {
      console.log("Không tìm thấy tọa độ");
    }
  };

// Dịch tọa độ thành địa chỉ chi tiết khi người dùng kéo ghim (Reverse Geocoding)
  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.data && res.data.display_name) {
        // Tách lấy phần số nhà, tên đường (bỏ qua Tỉnh/Huyện đã chọn ở dropdown)
        const addressParts = res.data.display_name.split(', ');
        // Thường lấy 1-2 thành phần đầu tiên của mảng (số nhà, tên đường)
        const streetAddress = addressParts.slice(0, 2).join(', ');
        
        // Cập nhật lại ô text địa chỉ chi tiết
        setAddressForm(prev => ({
          ...prev,
          detail_address: streetAddress || res.data.display_name
        }));
      }
    } catch (err) {
      console.log("Lỗi dịch ngược tọa độ:", err);
    }
  };

  // 🔴 ĐÃ SỬA: Chuyển sang gọi API_BASE_URL động khi sửa địa chỉ cũ
  const handleOpenEditModal = async (addr) => {
    setEditingAddressId(addr.address_id);
    setAddressForm({ 
      ...addr, 
      ward_code: addr.ward_code || addr.ward_id || "", 
      is_default: Boolean(addr.is_default) 
    });
    setIsAddressModalOpen(true);

    if (addr.province_id) {
      try {
        setLoadingGeography(true);
        const distRes = await axios.get(`${API_BASE_URL}/api/addresses/locations/districts?province_id=${addr.province_id}`);
        if (distRes.data.success) setDistricts(distRes.data.data || []);
        
        if (addr.district_id) {
          const wardRes = await axios.get(`${API_BASE_URL}/api/addresses/locations/wards?district_id=${addr.district_id}`);
          if (wardRes.data.success) setWards(wardRes.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải đệm địa chính khi chỉnh sửa:", err);
      } finally {
        setLoadingGeography(false);
      }
    }
  };

const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.province_id || !addressForm.district_id || !addressForm.ward_code) {
      return alert("Vui lòng chọn đầy đủ danh mục địa chính từ bảng tìm kiếm!");
    }
    try {
      const payload = { 
        ...addressForm, 
        is_default: addressForm.is_default ? true : false,
        province_id: Number(addressForm.province_id),
        district_id: Number(addressForm.district_id),
        ward_id: String(addressForm.ward_code),
        ward_code: String(addressForm.ward_code), // <--- ĐÃ SỬA: Thêm dấu phẩy ở đây
        latitude: markerPos.lat,  // 👈 Truyền kinh vĩ độ xuống API
        longitude: markerPos.lng
      };
      
      const res = editingAddressId 
        ? await api.put(`/addresses/${editingAddressId}`, payload)
        : await api.post("/addresses", payload);

      if (res.data.success) {
        showToast(editingAddressId ? "Cập nhật thành công!" : "Đã thêm địa chỉ mới!");
        setIsAddressModalOpen(false);
        fetchAddresses();
      }
    } catch (error) { 
        showToast("Lỗi hệ thống khi xử lý địa chỉ", "error"); 
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      const targetAddr = addresses.find(a => a.address_id === addrId);
      if (!targetAddr) return;
      const payload = { 
        ...targetAddr, 
        is_default: true,
        province_id: Number(targetAddr.province_id),
        district_id: Number(targetAddr.district_id),
        ward_id: String(targetAddr.ward_code || targetAddr.ward_id),
        ward_code: String(targetAddr.ward_code || targetAddr.ward_id)
      };
      const res = await api.put(`/addresses/${addrId}`, payload);
      if (res.data.success) {
        showToast("Đã đặt làm điểm nhận hàng mặc định!");
        fetchAddresses();
      }
    } catch (error) {
      showToast("Không thể thiết lập mặc định", "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này khỏi sổ lưu trữ?")) return;
    try {
      const res = await api.delete(`/addresses/${id}`);
      if (res.data.success) {
        showToast("Đã xóa địa chỉ thành công!");
        fetchAddresses();
      }
    } catch (error) { showToast("Lỗi khi xóa địa chỉ", "error"); }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put("/profile/hoso", profile);
      if (response.data.success) {
        if (updateUser) updateUser(profile); 
        showToast("Đã cập nhật hồ sơ cá nhân rực rỡ!");
      }
    } catch (error) {
      showToast("Lỗi khi lưu dữ liệu!", "error");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result); 
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleUploadCroppedAvatar = async () => {
    try {
      setIsCropping(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "cropped-avatar.jpeg");

      const response = await api.post("/profile/upload-avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
          const newUrl = response.data.avatarUrl;
          setProfile(prev => ({ ...prev, avatar_url: newUrl }));
          if (updateUser) updateUser({ avatar_url: newUrl });
          showToast("Đã cập nhật ảnh đại diện tùy chỉnh rực rỡ!");
          setImageSrc(null); 
      }
    } catch (error) {
        console.error("Lỗi upload avatar sau khi cắt:", error);
        showToast("Lỗi xử lý cắt ảnh hệ thống", "error");
    } finally {
        setIsCropping(false);
    }
  };

  const handleVerifyCurrentPassword = async () => {
    try {
      const res = await api.post("/profile/verify-password", { password: currentPassword });
      if (res.data.success) {
        showToast("Xác thực danh tính thành công!");
        setSecurityStep("reset-password");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Mật khẩu không chính xác", "error");
    }
  };

  const handleSendOTP = async () => {
    try {
      const res = await api.post("/auth/forgot-password", { email: profile.email });
      if (res.data.success) {
        showToast("Mã OTP bảo mật đã được gửi!");
        setSecurityStep("otp-verify");
      }
    } catch (err) { showToast("Lỗi gửi mã xác thực", "error"); }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await api.post("/auth/verify-otp", { email: profile.email, otp: otpCode });
      if (res.data.success) {
        showToast("Mã OTP hợp lệ!");
        setSecurityStep("reset-password");
      }
    } catch (err) { showToast("Mã OTP không đúng hoặc đã hết hạn", "error"); }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) return showToast("Mật khẩu nhập lại không khớp!", "error");
    try {
      let res = otpCode 
        ? await api.post("/auth/reset-password", { email: profile.email, otp: otpCode, newPassword })
        : await api.put("/profile/change-password", { newPassword });

      if (res.data.success) {
        showToast("Đổi mật khẩu bảo mật thành công!");
        setSecurityStep("verify-password");
        setNewPassword(""); setConfirmNewPassword(""); setOtpCode(""); setCurrentPassword("");
      }
    } catch (err) { showToast(err.response?.data?.message || "Lỗi cập nhật cấu trúc mật khẩu", "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const getAvatarSrc = (url) => {
    if (!url || url === "" || url.includes('unsplash.com')) {
       return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=006c49&color=fff`;
    }
    if (url.startsWith('http')) return url; 
    return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}?t=${new Date().getTime()}`;
  };

  const notifications = [
    { id: 1, title: "Ưu đãi Platinum độc quyền", desc: "Giảm ngay 100k cho đơn hàng từ 500k.", time: "10 phút trước", unread: true },
    { id: 2, title: "Đơn hàng #DM9922 thành công", desc: "Kiện hàng của bạn đã được giao đến đích.", time: "2 giờ trước", unread: false },
  ];

  const orders = [
    { id: "DM1002", date: "22/10/2023", total: "450.000đ", status: "Đã giao", items: ["Táo Envy Mỹ", "Sữa tươi TH"], img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100" },
  ];

  const orderSteps = [
    { label: "Xác nhận", icon: <History size={16}/>, count: 2 },
    { label: "Lấy hàng", icon: <Package size={16}/>, count: 0 },
    { label: "Đang giao", icon: <Clock size={16}/>, count: 1 },
    { label: "Đã giao", icon: <CheckCircle2 size={16}/>, count: 85 },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Đang kết nối cơ sở dữ liệu Demi Mart...</p>
    </div>
  );

  return (
    <div className="w-full bg-[#f0f2f5] font-sans text-slate-700 min-h-screen transition-all relative selection:bg-[#006c49] selection:text-white pb-8 text-left">
      
      {/* MODAL CẮT ẢNH ĐẠI DIỆN */}
      {imageSrc && (
        <div className="fixed inset-0 z-[10008] flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-800">
            <div className="p-5 border-b flex justify-between items-center bg-white">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cắt chỉnh ảnh đại diện</h3>
              <button disabled={isCropping} onClick={() => setImageSrc(null)} className="text-slate-400 hover:text-red-500 transition-all">
                <X size={18}/>
              </button>
            </div>

            <div className="relative w-full h-80 bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} 
                cropShape="rect" 
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 bg-white space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Thu nhỏ</span>
                  <span>Phóng to</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-label="Zoom"
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#006c49]"
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t">
                <button 
                  type="button" 
                  disabled={isCropping}
                  onClick={() => setImageSrc(null)} 
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-400 hover:bg-slate-50 border disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  disabled={isCropping}
                  onClick={handleUploadCroppedAvatar} 
                  className="flex-1 bg-[#006c49] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isCropping ? <Loader2 size={12} className="animate-spin" /> : "Xác nhận cắt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP LIỆU ĐỊA CHÍNH */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-toastIn border border-slate-100">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {editingAddressId ? "Chỉnh sửa vị trí" : "Thêm điểm nhận hàng mới"}
              </h3>
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

              {/* DROPDOWN CHỌN TỈNH THÀNH */}
              <div className="relative" ref={provinceRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tỉnh / Thành phố</label>
                <div 
                  onClick={() => { setOpenDropdown(openDropdown === 'province' ? null : 'province'); setSearchTerm(''); }}
                  className="w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer hover:border-gray-300 focus:border-[#006c49]"
                >
                  <span className={`font-bold ${addressForm.province_name ? 'text-slate-800' : 'text-slate-400'}`}>
                    {addressForm.province_name || '-- Gõ từ khóa tìm Tỉnh / Thành --'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>

                {openDropdown === 'province' && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input autoFocus type="text" placeholder="Nhập từ khóa tìm kiếm tỉnh thành..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="overflow-y-auto max-h-40 no-scrollbar">
                      {filteredProvinces.length > 0 ? (
                        filteredProvinces.map(p => (
                          <div key={p.ProvinceID} onClick={() => selectProvince(p.ProvinceID, p.ProvinceName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{p.ProvinceName}</div>
                        ))
                      ) : ( <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy tỉnh thành</div> )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* DROPDOWN CHỌN QUẬN HUYỆN */}
                <div className="relative" ref={districtRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Quận / Huyện</label>
                  <div 
                    onClick={() => { if (!addressForm.province_id) return; setOpenDropdown(openDropdown === 'district' ? null : 'district'); setSearchTerm(''); }}
                    className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm.province_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
                  >
                    <span className={`font-bold ${addressForm.district_name ? 'text-slate-800' : 'text-slate-400'}`}>
                      {addressForm.district_name || '-- Quận/Huyện --'}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>

                  {openDropdown === 'district' && addressForm.province_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Gõ tên quận huyện..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="overflow-y-auto max-h-40 no-scrollbar">
                        {filteredDistricts.length > 0 ? (
                          filteredDistricts.map(d => (
                            <div key={d.DistrictID} onClick={() => selectDistrict(d.DistrictID, d.DistrictName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{d.DistrictName}</div>
                          ))
                        ) : ( <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy vùng này</div> )}
                      </div>
                    </div>
                  )}
                </div>

                {/* DROPDOWN CHỌN PHƯỜNG XÃ */}
                <div className="relative" ref={wardRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phường / Xã</label>
                  <div 
                    onClick={() => { if (!addressForm.district_id) return; setOpenDropdown(openDropdown === 'ward' ? null : 'ward'); setSearchTerm(''); }}
                    className={`w-full border p-3 rounded-2xl text-sm flex justify-between items-center bg-[#f8fafc] cursor-pointer ${!addressForm.district_id ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
                  >
                    <span className={`font-bold ${addressForm.ward_name ? 'text-slate-800' : 'text-slate-400'}`}>
                      {addressForm.ward_name || '-- Phường/Xã --'}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>

                  {openDropdown === 'ward' && addressForm.district_id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl flex flex-col overflow-hidden">
                      <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input autoFocus type="text" placeholder="Gõ tên phường xã..." className="w-full bg-transparent text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="overflow-y-auto max-h-40 no-scrollbar">
                        {filteredWards.length > 0 ? (
                          filteredWards.map(w => (
                            <div key={w.WardCode} onClick={() => selectWard(w.WardCode, w.WardName)} className="p-2.5 text-sm font-bold hover:bg-emerald-50 hover:text-[#006c49] cursor-pointer transition-all">{w.WardName}</div>
                          ))
                        ) : ( <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy phường xã</div> )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ chi tiết (Số nhà, thôn, đường)</label>
                  {/* Nút bấm để kích hoạt dò tìm vị trí trên map giống Shopee */}
                  <button 
                    type="button" 
                    onClick={handleAutoLocate}
                    disabled={!addressForm.province_name || !addressForm.district_name}
                    className="text-[9px] bg-emerald-50 text-[#006c49] px-2 py-1 rounded-lg font-bold uppercase hover:bg-[#006c49] hover:text-white transition-all disabled:opacity-50"
                  >
                    📍 Tìm trên bản đồ
                  </button>
                </div>
                
                <textarea 
                  required 
                  className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all h-20 resize-none" 
                  placeholder="Ví dụ: Số 12, Ngõ 34, Đường ABC..."
                  value={addressForm.detail_address} 
                  onChange={e => setAddressForm({...addressForm, detail_address: e.target.value})} 
                  // Bỏ onBlur ở đây đi để tránh gọi API liên tục gây lag
                />
              </div>

              {/* KHU VỰC BẢN ĐỒ CHỌN TỌA ĐỘ */}
              {addressForm.province_name && addressForm.district_name && (
                <div className="space-y-1.5 pt-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                      📍 Kéo thả ghim đỏ để tinh chỉnh vị trí nhà bạn
                    </label>
                    <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                      {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
                    </span>
                  </div>
                  
                  <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 relative z-10 shadow-inner">
                    <MapContainer center={[markerPos.lat, markerPos.lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
                      <ChangeMapView coords={markerPos} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker 
                        position={[markerPos.lat, markerPos.lng]} 
                        draggable={true}
                        eventHandlers={{
                          dragend: (e) => {
                            const marker = e.target;
                            const position = marker.getLatLng();
                            // 1. Lưu tọa độ mới
                            setMarkerPos({ lat: position.lat, lng: position.lng });
                            // 2. Dịch ngược tọa độ ra địa chỉ text và điền vào form
                            fetchAddressFromCoords(position.lat, position.lng);
                          }
                        }}
                      />
                    </MapContainer>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {['home', 'office'].map(type => (
                    <button key={type} type="button" onClick={() => setAddressForm({...addressForm, address_type: type})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addressForm.address_type === type ? 'bg-[#006c49] text-white border-[#006c49]' : 'bg-white text-slate-400 border-slate-100'}`}>
                      {type === 'home' ? 'Nhà riêng' : 'Văn phòng'}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="hidden" checked={addressForm.is_default} onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})} />
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

      {/* MOBILE TOP BANNER */}
      <div className="md:hidden sticky top-0 z-[100] bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={getAvatarSrc(profile.avatar_url)} className="w-10 h-10 rounded-2xl object-cover border-2" alt="avt" />
            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-md border border-white shadow-sm"><Award size={8} fill="currentColor" /></div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-sm tracking-tight leading-none">{profile.full_name}</span>
            <p className="text-[8px] font-black text-[#006c49] uppercase tracking-widest flex items-center gap-1 mt-1.5"><Zap size={8} fill="currentColor"/> Platinum Member</p>
          </div>
        </div>
        <div className="bg-[#e6f0ed] px-3 py-1.5 rounded-xl border border-[#006c49]/10">
           <p className="text-[9px] font-black text-[#006c49] uppercase tracking-tighter">Đang hoạt động</p>
        </div>
      </div>

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className="fixed top-20 md:top-6 right-4 left-4 md:left-auto z-[10002] animate-toastIn">
          <div className={`bg-white border-l-4 ${toast.type === 'success' ? 'border-[#006c49]' : 'border-red-500'} shadow-2xl rounded-xl p-3 flex items-center gap-3`}>
            {toast.type === 'error' ? <X size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-[#006c49]" />}
            <p className="text-xs font-bold">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-0 md:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row gap-6 pt-0 md:pt-6 items-start">
          
          {/* DESKTOP SIDEBAR MENU */}
          <aside className="hidden md:block w-64 lg:w-72 shrink-0 space-y-4 sticky top-6">
            <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex items-center gap-4 h-[90px]">
              <div className="relative shrink-0">
                <img src={getAvatarSrc(profile.avatar_url)} className="w-14 h-14 rounded-2xl object-cover border-4 border-[#f0f9f6]" alt="Avatar" />
                <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-lg border-2 border-white shadow-sm"><Award size={10} fill="currentColor" /></div>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-slate-900 truncate tracking-tight text-sm">{profile.full_name}</h4>
                <p className="text-[9px] font-black text-[#006c49] uppercase tracking-widest flex items-center gap-1"><Zap size={9} fill="currentColor"/> Platinum</p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100 space-y-4">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-0.5">
                  <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{group.title}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path ? `/profile/${item.path}` : '/profile')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? "bg-[#006c49] text-white shadow-lg shadow-[#006c49]/20" : "text-slate-500 hover:bg-slate-50 hover:text-[#006c49]"}`}
                    >
                      <span className={activeTab === item.id ? "text-white" : "text-slate-300"}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* MAIN CONTAINER CONTENT */}
          <div className="flex-1 w-full space-y-4">
            {/* WIDGETS WALLET SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
              <div className="md:col-span-2 bg-[#006c49] rounded-none md:rounded-[28px] p-5 text-white relative overflow-hidden shadow-lg h-[110px] md:h-[100px]">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2"><Wallet size={12}/> Ví Demi Pay</span>
                    <Eye size={12} className="opacity-50 cursor-pointer hover:opacity-100"/>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-2xl md:text-xl font-black tracking-tight">2.450.000đ</h2>
                    <button onClick={() => showToast("Hệ thống nạp ví đang bảo trì")} className="bg-white text-[#006c49] px-4 py-1.5 rounded-xl font-black text-[9px] shadow-sm">Nạp tiền</button>
                  </div>
                </div>
                <CreditCard className="absolute -right-4 -bottom-4 w-20 h-20 opacity-10 -rotate-12" />
              </div>
              
              <div className="bg-white rounded-none md:rounded-[28px] p-4 shadow-sm border border-slate-100 flex flex-row md:flex-col justify-between items-center h-auto md:h-[100px]">
                <div className="flex items-center justify-between w-full gap-2 md:block">
                  <div className="flex items-center gap-2 md:justify-between">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Star size={12} fill="#fea619" className="text-[#fea619]"/> Thưởng tích lũy</p>
                    <span onClick={() => showToast("Chức năng đổi quà đang bảo trì")} className="text-[8px] font-black text-[#006c49] cursor-pointer hover:underline uppercase">Đổi quà</span>
                  </div>
                  <div className="flex items-center gap-3 md:block md:mt-1">
                    <span className="text-lg md:text-xl font-black whitespace-nowrap">1.250 <span className="text-[8px] font-bold text-slate-400 uppercase">Xu</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB HORIZONTAL MOBILE */}
            <div className="md:hidden bg-[#f0f2f5] py-2 px-4 flex overflow-x-auto no-scrollbar gap-2 sticky top-[73px] z-[90]">
              {mobileTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path ? `/profile/${item.path}` : '/profile')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase border shadow-sm ${activeTab === item.id ? "bg-[#006c49] text-white border-[#006c49]" : "bg-white text-slate-500 border-slate-200"}`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-none md:rounded-[32px] shadow-sm border-none md:border border-slate-100 overflow-hidden flex flex-col min-h-screen md:min-h-[550px]">
              {/* ORDER SUMMARY MINIBAR */}
              <div className="bg-[#fcfdfd] border-b border-slate-100 py-3 px-4 flex justify-around items-center overflow-x-auto no-scrollbar shrink-0">
                {orderSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer relative min-w-[70px]">
                    <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#006c49] transition-all">
                      {step.icon}
                    </div>
                    {step.count > 0 && (
                      <span className="absolute top-0 right-3 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">{step.count}</span>
                    )}
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 md:px-8 lg:px-12 pb-10 pt-6 animate-fadeIn flex-1">
                
                {/* --- TAB 1: HỒ SƠ --- */}
                {activeTab === "profile" && (
                  <div className="space-y-8 flex flex-col h-full">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <h2 className="text-xl font-black text-slate-900 leading-tight">Hồ sơ cá nhân</h2>
                      <button onClick={handleSaveProfile} className="hidden md:block bg-[#006c49] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:scale-105 transition-all">Lưu thay đổi</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-6 text-left order-2 lg:order-1">
                        <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-50 pb-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</label>
                          <div className="col-span-2 font-black text-slate-800 text-sm py-2">{profile.username}</div>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</label>
                          <input type="text" value={profile.full_name || ""} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:border-[#006c49] outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                          <input type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:border-[#006c49] outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</label>
                          <input type="text" value={profile.phone_number || ""} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:border-[#006c49] outline-none" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4 pt-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giới tính</label>
                          <div className="col-span-2 flex gap-6">
                            {["Nam", "Nữ", "Khác"].map((gender) => (
                              <label key={gender} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                                <input type="radio" name="gender" checked={profile.gender === gender} onChange={() => setProfile({...profile, gender: gender})} className="w-4 h-4 accent-[#006c49]" /> {gender}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4 pt-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</label>
                          <input type="date" value={profile.birthday ? profile.birthday.split('T')[0] : ""} onChange={(e) => setProfile({...profile, birthday: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm outline-none focus:border-[#006c49]" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-start pt-2 order-1 lg:order-2">
                        <div className="bg-white rounded-[32px] p-8 border-2 border-slate-100 border-dashed w-full flex flex-col items-center text-center">
                          <div className="relative mb-4 group">
                            <img src={getAvatarSrc(profile.avatar_url)} className="w-28 h-28 rounded-[36px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all" alt="Avatar" />
                            <label htmlFor="avatar-up" className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-[#006c49] cursor-pointer hover:scale-115 transition-all"><Camera size={16} /></label>
                            <input type="file" id="avatar-up" className="hidden" accept="image/*" onChange={handleAvatarChange} onClick={(e) => { e.target.value = null; }} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Ảnh hồ sơ cá nhân</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden pt-6">
                      <button onClick={handleSaveProfile} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md">Lưu thay đổi hồ sơ</button>
                    </div>
                  </div>
                )}

                {/* --- TAB 2: SỔ ĐỊA CHỈ --- */}
                {activeTab === "addresses" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Sổ địa chỉ cá nhân</h2>
                        <p className="text-[11px] font-medium text-slate-400">Quản lý điểm giao nhận phục vụ định tuyến cước vận chuyển tự động</p>
                      </div>
                      <button 
                        onClick={handleOpenAddModal}
                        className="bg-[#006c49] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#006c49]/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus size={14} className="stroke-[3]" /> Thêm địa chỉ mới
                      </button>
                    </div>

                    <div className="space-y-4">
                      {addresses.length > 0 ? (
                        addresses.map((addr) => (
                          <div 
                            key={addr.address_id} 
                            className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-all relative overflow-hidden group gap-4"
                          >
                            <div className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-[#006c49] transition-all" />
                            <div className="space-y-2 flex-1 pl-1 text-left">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-black text-slate-900 text-sm">{addr.receiver_name}</span>
                                <span className="text-slate-200 hidden sm:inline">|</span>
                                <span className="text-[#006c49] bg-emerald-50 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-wide">{addr.receiver_phone}</span>
                                {Boolean(addr.is_default) && <span className="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100 font-black uppercase tracking-wider">Mặc định</span>}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{addr.detail_address}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest"><span className="text-slate-300">📍</span> {`${addr.ward_name} • ${addr.district_name} • ${addr.province_name}`}</p>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                              <div className="flex items-center gap-3.5">
                                <button onClick={() => handleOpenEditModal(addr)} className="text-[10px] font-black text-[#006c49] hover:underline uppercase tracking-wider flex items-center gap-1"><Edit2 size={11} /> Cập nhật</button>
                                {!Boolean(addr.is_default) && <button onClick={() => handleDeleteAddress(addr.address_id)} className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-wider flex items-center gap-1"><Trash2 size={11} /> Xóa</button>}
                              </div>
                              <button 
                                disabled={Boolean(addr.is_default)}
                                onClick={() => handleSetDefault(addr.address_id)}
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${Boolean(addr.is_default) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-[#006c49] hover:text-[#006c49]'}`}
                              >
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
                  </div>
                )}

                {/* --- TAB 3: BẢO MẬT --- */}
                {activeTab === "security" && (
                  <div className="animate-fadeIn space-y-6 text-left">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-xl font-black text-slate-900">Bảo mật tài khoản</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý cấu trúc mã khóa mật mã hệ thống</p>
                    </div>

                    <div className="max-w-xl mx-auto pt-4">
                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden text-center">
                        {securityStep === "verify-password" && (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto"><ShieldCheck size={32} /></div>
                            <div>
                              <h3 className="font-black text-slate-800 text-lg">Xác nhận danh tính</h3>
                              <p className="text-xs text-slate-500 font-medium">Nhập mật khẩu hiện tại để tiếp tục thiết lập chuỗi bảo mật.</p>
                            </div>
                            <div className="space-y-4">
                              <input type="password" placeholder="••••••••" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-sm font-bold outline-none focus:border-[#006c49]" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                              <button onClick={handleVerifyCurrentPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Tiếp tục bước kế</button>
                              <button onClick={() => setSecurityStep("forgot-password")} className="w-full text-[10px] font-black text-[#006c49] uppercase hover:underline">Bạn quên mật khẩu bảo mật?</button>
                            </div>
                          </div>
                        )}

                        {securityStep === "forgot-password" && (
                          <div className="space-y-6 animate-fadeIn">
                            <button onClick={() => setSecurityStep("verify-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900"><ChevronRight size={20} className="rotate-180" /></button>
                            <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto"><Mail size={32} /></div>
                            <div>
                              <h3 className="font-black text-slate-800 text-lg">Khôi phục mật mã</h3>
                              <p className="text-xs text-slate-500 font-medium">Mã OTP bảo mật sẽ được gửi về hòm thư Email đăng ký:<br /><b className="text-slate-900">{profile.email}</b></p>
                            </div>
                            <button onClick={handleSendOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Bắn mã OTP về Email</button>
                          </div>
                        )}

                        {securityStep === "otp-verify" && (
                          <div className="space-y-6 animate-fadeIn">
                            <button onClick={() => setSecurityStep("forgot-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900"><ChevronRight size={20} className="rotate-180" /></button>
                            <div>
                              <h3 className="font-black text-slate-800 text-lg">Xác thực mã OTP</h3>
                              <p className="text-xs text-slate-500 font-medium">Nhập mã xác thực 6 chữ số vừa nhận được</p>
                            </div>
                            <div className="flex justify-center">
                              <input maxLength={6} className="w-44 bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#006c49]" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                            </div>
                            <button onClick={handleVerifyOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Xác thực Token</button>
                          </div>
                        )}

                        {securityStep === "reset-password" && (
                          <div className="space-y-6 animate-fadeIn text-left">
                            <button onClick={() => otpCode ? setSecurityStep("otp-verify") : setSecurityStep("verify-password")} className="flex items-center gap-2 text-slate-300 hover:text-slate-900 mb-2"><ChevronRight size={18} className="rotate-180" /><span className="text-[10px] font-black uppercase tracking-widest">Trở lại</span></button>
                            <div>
                              <h3 className="font-black text-slate-800 text-lg">Đặt lại chuỗi khóa mật mã</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                <input type="password" placeholder="Tối thiểu 8 ký tự" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại chuỗi ký tự</label>
                                <input type="password" placeholder="Xác nhận mã bảo mật" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                              </div>
                              <button onClick={handleResetPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Lưu mật mã mới</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 4: THÔNG BÁO --- */}
                {activeTab === "notifications" && (
                  <div className="space-y-6 text-left">
                    <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Thông báo trung tâm</h2>
                    <div className="space-y-3">
                       {notifications.map(noti => (
                         <div key={noti.id} className="flex gap-4 p-4 rounded-2xl border bg-white border-slate-100 hover:shadow-sm transition-all">
                           <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-slate-50 text-[#006c49]"><Package size={20}/></div>
                           <div className="flex-1 text-left">
                             <div className="flex justify-between items-start">
                                 <h5 className="font-bold text-slate-900 text-sm truncate pr-4">{noti.title}</h5>
                                 <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{noti.time}</span>
                             </div>
                             <p className="text-xs text-slate-500 mt-1">{noti.desc}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* --- TAB 5: ĐƠN HÀNG --- */}
                {activeTab === "orders" && (
                  <div className="space-y-6 text-left">
                    <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Lịch sử giao dịch vận đơn</h2>
                    <div className="space-y-4">
                       {orders.map(order => (
                         <div key={order.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex gap-4 items-center group hover:shadow-md transition-all">
                           <img src={order.img} className="w-16 h-16 rounded-2xl object-cover border" alt="prod" />
                           <div className="flex-1 text-left">
                             <div className="flex justify-between">
                                 <span className="text-xs font-black text-slate-900 uppercase">Vận đơn: #{order.id}</span>
                                 <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase bg-emerald-50 text-emerald-600">{order.status}</span>
                             </div>
                             <p className="text-base font-black text-[#006c49] mt-1">{order.total}</p>
                           </div>
                           <ChevronRight size={20} className="text-slate-300 group-hover:text-[#006c49] transition-all"/>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* CÁC TAB ĐANG PHÁT TRIỂN */}
                {["vouchers", "favorites"].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
                    <Package size={40}/>
                    <p className="text-sm font-bold uppercase tracking-widest text-center">Module cho danh mục {activeTab} đang được nâng cấp</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-toastIn { animation: toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Giao diện thanh trượt phóng to thu nhỏ */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #006c49;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}} />
    </div>
  );
}