import React, { useState, useEffect, useContext } from "react";
// 1. IMPORT THÊM useNavigate VÀ useParams TỪ REACT-ROUTER-DOM
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext"; 
import { 
  User, Mail, Phone, MapPin, Camera, CheckCircle2, Lock, Heart, 
  ChevronRight, Clock, Package, ShieldCheck, CreditCard, 
  Star, Wallet, Ticket, Bell, Eye, History, Zap, Award, X, Plus
} from "lucide-react";

// --- CẤU HÌNH API ---
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

export default function ProfilePage() {
  const { user: authUser, updateUser } = useContext(AuthContext);
  
  // 2. KHỞI TẠO HOOK ROUTER ĐỂ CHUYỂN LINK
  const navigate = useNavigate();
  const { tab } = useParams();

  const [profile, setProfile] = useState(null); 
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ MODAL ĐỊA CHỈ ---
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); 
  const [addressForm, setAddressForm] = useState({
    receiver_name: "", receiver_phone: "",
    province_name: "", province_id: "", 
    district_name: "", district_id: "", 
    ward_name: "", ward_id: "",    
    detail_address: "", is_default: false, address_type: "home"
  });

  // --- STATE QUẢN LÝ TAB BẢO MẬT ---
  const [securityStep, setSecurityStep] = useState("verify-password"); 
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // 3. THÊM THUỘC TÍNH 'path' CHO TỪNG TAB TRONG MENU
  const mobileTabs = [
    { id: "profile", path: "", label: "Hồ sơ", icon: <User size={14}/> },
    { id: "notifications", path: "notifications", label: "Thông báo", icon: <Bell size={14}/> },
    { id: "addresses", path: "address", label: "Địa chỉ", icon: <MapPin size={14}/> }, // path là 'address' -> /profile/address
    { id: "security", path: "security", label: "Bảo mật", icon: <Lock size={14}/> },
    { id: "orders", path: "orders", label: "Đơn hàng", icon: <Package size={14}/> },
    { id: "vouchers", path: "vouchers", label: "Voucher", icon: <Ticket size={14}/> },
    { id: "favorites", path: "favorites", label: "Đã thích", icon: <Heart size={14}/> },
  ];

  const menuGroups = [
    { title: "Cá nhân", items: mobileTabs.slice(0, 4) },
    { title: "Mua sắm", items: mobileTabs.slice(4) }
  ];

  // 4. TỰ ĐỘNG ĐỔI TAB DỰA VÀO URL TRÊN TRÌNH DUYỆT
  useEffect(() => {
    // Tìm tab khớp với url hiện tại (nếu url là /profile thì tab sẽ là undefined -> gán là "")
    const currentTab = mobileTabs.find(t => t.path === (tab || ""));
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else {
      setActiveTab("profile");
    }
  }, [tab]);

  // TỰ ĐỘNG LẤY DỮ LIỆU HỒ SƠ TỪ DATABASE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/profile/hoso");
        if (response.data.success) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // TỰ ĐỘNG LẤY ĐỊA CHỈ KHI CHUYỂN SANG TAB ĐỊA CHỈ
  useEffect(() => {
    if (activeTab === "addresses") {
      fetchAddresses();
    }
  }, [activeTab]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/addresses");
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải địa chỉ:", error);
    }
  };

  // --- LOGIC XỬ LÝ MODAL (ĐÃ THÊM MẶC ĐỊNH ID = 1 ĐỂ SỬA LỖI DATABASE) ---
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      receiver_name: profile?.full_name || "",
      receiver_phone: profile?.phone_number || "",
      province_name: "", province_id: 1, 
      district_name: "", district_id: 1, 
      ward_name: "", ward_id: 1,
      detail_address: "", is_default: addresses.length === 0, address_type: "home"
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr.address_id);
    setAddressForm({ 
      ...addr, 
      ward_id: addr.ward_code || 1, // Fix lỗi lệch tên cột ward_code
      province_id: addr.province_id || 1,
      district_id: addr.district_id || 1,
      is_default: Boolean(addr.is_default) 
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      // Ép kiểu ID trước khi gửi
      const payload = { 
        ...addressForm, 
        is_default: addressForm.is_default ? 1 : 0,
        province_id: addressForm.province_id || 1,
        district_id: addressForm.district_id || 1,
        ward_id: addressForm.ward_id || 1
      };
      
      const res = editingAddressId 
        ? await api.put(`/addresses/${editingAddressId}`, payload)
        : await api.post("/addresses", payload);

      if (res.data.success) {
        showToast(editingAddressId ? "Cập nhật thành công!" : "Đã thêm địa chỉ!");
        setIsAddressModalOpen(false);
        fetchAddresses();
      }
    } catch (error) { 
        console.error("Lỗi API:", error.response?.data);
        showToast("Lỗi xử lý địa chỉ", "error"); 
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      const targetAddr = addresses.find(a => a.address_id === addrId);
      if (!targetAddr) return;
      const payload = { ...targetAddr, is_default: 1 };
      const res = await api.put(`/addresses/${addrId}`, payload);
      if (res.data.success) {
        showToast("Đã thiết lập mặc định!");
        fetchAddresses();
      }
    } catch (error) {
      showToast("Không thể thiết lập mặc định", "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      const res = await api.delete(`/addresses/${id}`);
      if (res.data.success) {
        showToast("Đã xóa địa chỉ!");
        fetchAddresses();
      }
    } catch (error) { showToast("Lỗi khi xóa", "error"); }
  };

  // HÀM LƯU THÔNG TIN HỒ SƠ
  const handleSaveProfile = async () => {
    try {
      const response = await api.put("/profile/hoso", profile);
      if (response.data.success) {
        if (updateUser) {
           updateUser(profile); 
        }
        showToast("Đã lưu hồ sơ vào Database!");
      }
    } catch (error) {
      showToast("Lỗi khi lưu dữ liệu!", "error");
    }
  };

  // HÀM UPLOAD ẢNH ĐẠI DIỆN
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const response = await api.post("/profile/upload-avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        if (response.data.success) {
            const newUrl = response.data.avatarUrl;
            setProfile(prev => ({ ...prev, avatar_url: newUrl }));
            if (updateUser) {
                updateUser({ avatar_url: newUrl });
            }
            showToast("Đã cập nhật ảnh đại diện!");
        }
    } catch (error) {
        console.error(error);
    }
  };

  // --- LOGIC BẢO MẬT ĐA BƯỚC ---
  const handleVerifyCurrentPassword = async () => {
    try {
      const res = await api.post("/profile/verify-password", { password: currentPassword });
      if (res.data.success) {
        showToast("Xác thực thành công!");
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
        showToast("Mã OTP đã gửi vào Email!");
        setSecurityStep("otp-verify");
      }
    } catch (err) {
      showToast("Lỗi gửi mã OTP", "error");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await api.post("/auth/verify-otp", { email: profile.email, otp: otpCode });
      if (res.data.success) {
        showToast("OTP hợp lệ!");
        setSecurityStep("reset-password");
      }
    } catch (err) {
      showToast("Mã OTP không đúng hoặc hết hạn", "error");
    }
  };

const handleResetPassword = async () => {
  if (newPassword !== confirmNewPassword) return showToast("Mật khẩu không khớp!", "error");
  
  try {
    let res;
    if (otpCode) {
      res = await api.post("/auth/reset-password", { 
        email: profile.email, 
        otp: otpCode, 
        newPassword 
      });
    } else {
      res = await api.put("/profile/change-password", { newPassword });
    }

    if (res.data.success) {
      showToast("Đổi mật khẩu thành công!");
      setSecurityStep("verify-password");
      setNewPassword(""); setConfirmNewPassword(""); setOtpCode(""); setCurrentPassword("");
    }
  } catch (err) {
    showToast(err.response?.data?.message || "Lỗi cập nhật mật khẩu", "error");
  }
};

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

const getAvatarSrc = (url) => {
  // 1. Kiểm tra nếu không có URL hoặc là ảnh mặc định unsplash
  if (!url || url === "" || url.includes('unsplash.com')) {
     return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=006c49&color=fff`;
  }
  
  // 2. NẾU URL ĐÃ LÀ LINK CLOUDINARY (BẮT ĐẦU BẰNG HTTP), DÙNG LUÔN
  if (url.startsWith('http')) {
      return `${url}?t=${new Date().getTime()}`;
  }

  // 3. NẾU URL LÀ ĐƯỜNG DẪN CỤC BỘ CŨ (/uploads/...), MỚI CẦN THÊM API_BASE_URL
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}?t=${new Date().getTime()}`;
};

  // --- DỮ LIỆU MẪU CÁC TAB CHƯA CÓ API ---
  const notifications = [
    { id: 1, title: "Ưu đãi Platinum độc quyền", desc: "Giảm ngay 100k cho đơn hàng từ 500k.", time: "10 phút trước", type: "promo", unread: true },
    { id: 2, title: "Đơn hàng #DM9922 thành công", desc: "Kiện hàng của bạn đã được giao.", time: "2 giờ trước", type: "order", unread: false },
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
      <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Đang kết nối Database...</p>
    </div>
  );

  return (
    <div className="w-full bg-[#f0f2f5] font-sans text-slate-700 min-h-screen transition-all relative selection:bg-[#006c49] selection:text-white pb-8 text-left">
      
      {/* --- MODAL ĐỊA CHỈ --- */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-toastIn border border-slate-100">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveAddress} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Người nhận</label>
                  <input required className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm.receiver_name} onChange={e => setAddressForm({...addressForm, receiver_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SĐT</label>
                  <input required className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all" value={addressForm.receiver_phone} onChange={e => setAddressForm({...addressForm, receiver_phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ chi tiết</label>
                <textarea required className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49] transition-all h-24 resize-none" value={addressForm.detail_address} onChange={e => setAddressForm({...addressForm, detail_address: e.target.value})} />
              </div>

              <div className="space-y-3">
                <input placeholder="Tỉnh / Thành phố" className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={addressForm.province_name} onChange={e => setAddressForm({...addressForm, province_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="Quận / Huyện" className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={addressForm.district_name} onChange={e => setAddressForm({...addressForm, district_name: e.target.value})} />
                   <input placeholder="Phường / Xã" className="w-full bg-[#f8fafc] border border-slate-100 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={addressForm.ward_name} onChange={e => setAddressForm({...addressForm, ward_name: e.target.value})} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  {['home', 'office'].map(type => (
                    <button key={type} type="button" onClick={() => setAddressForm({...addressForm, address_type: type})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addressForm.address_type === type ? 'bg-[#006c49] text-white border-[#006c49]' : 'bg-white text-slate-400 border-slate-100'}`}>
                      {type === 'home' ? 'Nhà riêng' : 'Công ty'}
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

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddressModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all">Đóng</button>
                <button type="submit" className="flex-1 bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#006c49]/20 hover:scale-[1.02] active:scale-95 transition-all">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. MOBILE HEADER */}
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
        <div className="bg-[#e6f0ed] px-3 py-1.5 rounded-xl border border-[#006c49]/10 shadow-sm">
           <p className="text-[9px] font-black text-[#006c49] uppercase tracking-tighter">Đang hoạt động</p>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-20 md:top-6 right-4 left-4 md:left-auto z-[10002] animate-toastIn">
          <div className={`bg-white border-l-4 ${toast.type === 'success' || toast.type === 'info' ? 'border-[#006c49]' : 'border-red-500'} shadow-2xl rounded-xl p-3 flex items-center gap-3`}>
            {toast.type === 'error' ? <X size={18} className="text-red-500" /> : <CheckCircle2 size={18} className="text-[#006c49]" />}
            <p className="text-xs font-bold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* --- DESKTOP STRUCTURE --- */}
      <div className="max-w-[1600px] mx-auto px-0 md:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row gap-6 pt-0 md:pt-6 items-start">
          
          {/* SIDEBAR */}
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
                      // 5. THAY ĐỔI URL KHI BẤM SIDEBAR
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

          <div className="flex-1 w-full space-y-4">
            {/* WIDGETS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
              <div className="md:col-span-2 bg-[#006c49] rounded-none md:rounded-[28px] p-5 md:p-4 text-white relative overflow-hidden shadow-lg group h-[110px] md:h-[100px]">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2"><Wallet size={12}/> Ví Demi Pay</span>
                    <Eye size={12} className="opacity-50 cursor-pointer hover:opacity-100"/>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-2xl md:text-xl font-black tabular-nums tracking-tight">2.450.000đ</h2>
                    <div className="flex gap-2">
                      <button onClick={() => showToast("Hệ thống đang bảo trì")} className="bg-white text-[#006c49] px-4 md:px-3 py-1.5 md:py-1 rounded-xl font-black text-[9px] md:text-[8px] active:scale-95 shadow-sm">Nạp tiền</button>
                    </div>
                  </div>
                </div>
                <CreditCard className="absolute -right-4 -bottom-4 w-20 h-20 opacity-10 -rotate-12" />
              </div>
              
              <div className="bg-white rounded-none md:rounded-[28px] p-4 shadow-sm border border-slate-100 flex flex-row md:flex-col justify-between items-center md:items-stretch h-auto md:h-[100px]">
                <div className="flex items-center justify-between w-full gap-2 md:block">
                  <div className="flex items-center gap-2 md:justify-between">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap"><Star size={12} fill="#fea619" className="text-[#fea619]"/> Thưởng</p>
                    <span 
                      onClick={() => showToast("Hệ thống đang bảo trì")}
                      className="text-[8px] font-black text-[#006c49] cursor-pointer hover:underline uppercase"
                    >
                      Đổi ngay
                    </span>
                  </div>
                  <div className="flex items-center gap-3 md:block md:mt-1">
                    <span className="text-lg md:text-xl font-black tabular-nums leading-none whitespace-nowrap">1.250 <span className="text-[8px] font-bold text-slate-400 uppercase">Xu</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB NGANG MOBILE */}
            <div className="md:hidden bg-[#f0f2f5] py-2 px-4 flex overflow-x-auto no-scrollbar gap-2 sticky top-[73px] z-[90]">
              {mobileTabs.map((item) => (
                <button
                  key={item.id}
                  // 6. THAY ĐỔI URL KHI BẤM MENU MOBILE
                  onClick={() => navigate(item.path ? `/profile/${item.path}` : '/profile')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase transition-all border shadow-sm ${activeTab === item.id ? "bg-[#006c49] text-white border-[#006c49]" : "bg-white text-slate-500 border-slate-200"}`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-none md:rounded-[32px] shadow-sm border-none md:border border-slate-100 overflow-hidden flex flex-col min-h-screen md:min-h-[550px]">
              
              <div className="bg-[#fcfdfd] border-b border-slate-100 py-3 px-4 md:px-8 flex justify-around items-center shrink-0 overflow-x-auto no-scrollbar">
                {orderSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer relative min-w-[70px]">
                    <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#006c49] transition-all">
                      {step.icon}
                    </div>
                    {step.count > 0 && (
                      <span className="absolute top-0 right-3 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white leading-none">{step.count}</span>
                    )}
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 md:px-8 lg:px-12 pb-10 pt-6 md:pt-8 animate-fadeIn flex-1">
                
                {/* --- TAB HỒ SƠ --- */}
                {activeTab === "profile" && (
                  <div className="space-y-8 flex flex-col h-full">
                    <div className="flex flex-row justify-between items-center gap-4 border-b border-slate-50 pb-4 text-left">
                      <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Hồ sơ cá nhân</h2>
                      <button 
                        onClick={handleSaveProfile} 
                        className="hidden md:block bg-[#006c49] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-[#006c49]/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Lưu thay đổi
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-6 text-left order-2 lg:order-1">
                        <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-50 pb-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</label>
                          <div className="col-span-2 font-bold text-slate-800 text-sm py-2">{profile.username}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</label>
                          <input type="text" value={profile.full_name || ""} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:bg-white focus:border-[#006c49] outline-none" />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                          <input type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:bg-white focus:border-[#006c49] outline-none" />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</label>
                          <input type="text" value={profile.phone_number || ""} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:bg-white focus:border-[#006c49] outline-none" />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4 pt-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giới tính</label>
                          <div className="col-span-2 flex gap-6">
                            {["Nam", "Nữ", "Khác"].map((gender) => (
                              <label key={gender} className="flex items-center gap-2 cursor-pointer group text-xs font-bold text-slate-600">
                                <input type="radio" name="gender" checked={profile.gender === gender} onChange={() => setProfile({...profile, gender: gender})} className="w-4 h-4 accent-[#006c49]" /> {gender}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4 pt-1 text-xs font-bold">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</label>
                          <input type="date" value={profile.birthday ? profile.birthday.split('T')[0] : ""} onChange={(e) => setProfile({...profile, birthday: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm outline-none focus:border-[#006c49]" />
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-start pt-2 order-1 lg:order-2">
                        <div className="bg-[#f8fafc] rounded-[32px] p-8 border-2 border-slate-100 border-dashed w-full flex flex-col items-center text-center">
                          <div className="relative mb-4 group">
                            <img src={getAvatarSrc(profile.avatar_url)} className="w-28 h-28 rounded-[36px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all" alt="Avatar" />
                            <label htmlFor="avatar-up" className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-[#006c49] cursor-pointer hover:scale-110 transition-all"><Camera size={16} /></label>
                            <input type="file" id="avatar-up" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Ảnh đại diện</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden pt-10 pb-4">
                      <button 
                        onClick={handleSaveProfile} 
                        className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#006c49]/20 active:scale-95 transition-all"
                      >
                        Lưu thay đổi hồ sơ
                      </button>
                    </div>
                  </div>
                )}

                {/* --- TAB ĐỊA CHỈ --- */}
                {activeTab === "addresses" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4 text-left">
                      <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Địa chỉ của tôi</h2>
                      <button 
                        onClick={handleOpenAddModal}
                        className="bg-[#006c49] text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-[#006c49]/20 hover:scale-105 transition-all"
                      >
                        <Plus size={14} /> Thêm địa chỉ mới
                      </button>
                    </div>

                    <div className="space-y-4">
                      {addresses.length > 0 ? (
                        addresses.map((addr) => (
                          <div key={addr.address_id} className="p-5 rounded-3xl bg-white border border-slate-100 flex justify-between items-center hover:shadow-md transition-all text-left">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900 text-sm">{addr.receiver_name}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500 text-xs font-bold">{addr.receiver_phone}</span>
                                {Boolean(addr.is_default) && (
                                  <span className="text-[8px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 font-black uppercase">Mặc định</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium">{addr.detail_address}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                {`${addr.ward_name}, ${addr.district_name}, ${addr.province_name}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
                              <div className="flex gap-4">
                                <button onClick={() => handleOpenEditModal(addr)} className="text-[10px] font-black text-[#006c49] uppercase hover:underline">Cập nhật</button>
                                {!Boolean(addr.is_default) && (
                                  <button onClick={() => handleDeleteAddress(addr.address_id)} className="text-[10px] font-black text-red-500 uppercase hover:underline">Xóa</button>
                                )}
                              </div>
                              
                              <button 
                                disabled={Boolean(addr.is_default)}
                                onClick={() => handleSetDefault(addr.address_id)}
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                                  Boolean(addr.is_default) 
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#006c49] hover:text-[#006c49]'
                                }`}
                              >
                                {Boolean(addr.is_default) ? 'Đang là mặc định' : 'Thiết lập mặc định'}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
                          <MapPin size={40}/>
                          <p className="text-xs font-black uppercase tracking-widest text-center">Bạn chưa có địa chỉ nào</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB BẢO MẬT: ĐA BƯỚC --- */}
                  {activeTab === "security" && (
                    <div className="animate-fadeIn space-y-6 text-left">
                      <div className="border-b border-slate-50 pb-6">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                          Bảo mật tài khoản
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Quản lý mật khẩu và xác thực đa lớp
                        </p>
                      </div>

                      <div className="max-w-xl mx-auto pt-4">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden text-center">
                          
                          {/* BƯỚC 1: XÁC THỰC MẬT KHẨU CŨ */}
                          {securityStep === "verify-password" && (
                            <div className="space-y-6 animate-fadeIn">
                              <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto">
                                <ShieldCheck size={32} />
                              </div>
                              <div>
                                <h3 className="font-black text-slate-800 text-lg">Xác nhận danh tính</h3>
                                <p className="text-xs text-slate-500 font-medium">Nhập mật khẩu hiện tại để tiếp tục thiết lập bảo mật.</p>
                              </div>
                              <div className="space-y-4">
                                <input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-sm font-bold outline-none focus:border-[#006c49] transition-all" 
                                  value={currentPassword} 
                                  onChange={e => setCurrentPassword(e.target.value)} 
                                />
                                <button onClick={handleVerifyCurrentPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#006c49]/20 active:scale-95 transition-all">
                                  Tiếp tục
                                </button>
                                <button onClick={() => setSecurityStep("forgot-password")} className="w-full text-[10px] font-black text-[#006c49] uppercase tracking-widest hover:underline">
                                  Bạn quên mật khẩu?
                                </button>
                              </div>
                            </div>
                          )}

                          {/* BƯỚC 2: QUÊN MẬT KHẨU (GỬI OTP) */}
                          {securityStep === "forgot-password" && (
                            <div className="space-y-6 animate-fadeIn">
                              <button onClick={() => setSecurityStep("verify-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900">
                                <ChevronRight size={20} className="rotate-180" />
                              </button>
                              <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto">
                                <Mail size={32} />
                              </div>
                              <div>
                                <h3 className="font-black text-slate-800 text-lg">Khôi phục mật khẩu</h3>
                                <p className="text-xs text-slate-500 font-medium">Chúng tôi sẽ gửi mã OTP đến email đăng ký của bạn:<br /><b className="text-slate-900">{profile.email}</b></p>
                              </div>
                              <button onClick={handleSendOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                Gửi mã OTP qua Email
                              </button>
                            </div>
                          )}

                          {/* BƯỚC 3: NHẬP MÃ OTP */}
                          {securityStep === "otp-verify" && (
                            <div className="space-y-6 animate-fadeIn">
                              <button onClick={() => setSecurityStep("forgot-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900">
                                <ChevronRight size={20} className="rotate-180" />
                              </button>
                              <div className="text-center space-y-2">
                                <h3 className="font-black text-slate-800 text-lg">Xác thực OTP</h3>
                                <p className="text-xs text-slate-500 font-medium">Nhập mã 6 chữ số vừa được gửi đến email của bạn</p>
                              </div>
                              <div className="flex justify-center">
                                <input 
                                  maxLength={6} 
                                  className="w-44 bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#006c49]" 
                                  value={otpCode} 
                                  onChange={e => setOtpCode(e.target.value)} 
                                />
                              </div>
                              <button onClick={handleVerifyOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                Xác thực mã
                              </button>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                Không nhận được mã? <span className="text-[#006c49] cursor-pointer hover:underline" onClick={handleSendOTP}>Gửi lại ngay</span>
                              </p>
                            </div>
                          )}

                          {/* BƯỚC 4: THIẾT LẬP MẬT KHẨU MỚI */}
                          {securityStep === "reset-password" && (
                            <div className="space-y-6 animate-fadeIn text-left">
                              <button onClick={() => otpCode ? setSecurityStep("otp-verify") : setSecurityStep("verify-password")} className="flex items-center gap-2 text-slate-300 hover:text-slate-900 transition-all mb-2">
                                <ChevronRight size={18} className="rotate-180" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Quay lại</span>
                              </button>
                              <div>
                                <h3 className="font-black text-slate-800 text-lg">Đặt lại mật khẩu</h3>
                                <p className="text-xs text-slate-500 font-medium">Vui lòng chọn mật khẩu mạnh để bảo vệ tài khoản.</p>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                                  <input type="password" placeholder="Tối thiểu 8 ký tự" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại mật khẩu</label>
                                  <input type="password" placeholder="Xác nhận mật khẩu" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                                </div>
                                <button onClick={handleResetPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#006c49]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                  Lưu mật khẩu mới
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* --- TAB THÔNG BÁO --- */}
                {activeTab === "notifications" && (
                  <div className="space-y-6 text-left">
                    <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Thông báo mới nhất</h2>
                    <div className="space-y-3">
                       {notifications.map(noti => (
                         <div key={noti.id} className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer bg-white border-slate-100`}>
                           <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-slate-50 text-[#006c49]`}>
                              <Package size={20}/>
                           </div>
                           <div className="flex-1 text-left">
                             <div className="flex justify-between items-start">
                                 <h5 className="font-bold text-slate-900 text-sm truncate pr-4">{noti.title}</h5>
                                 <span className="text-[10px] text-slate-400 font-bold">{noti.time}</span>
                             </div>
                             <p className="text-xs text-slate-500 mt-1">{noti.desc}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* --- TAB ĐƠN HÀNG --- */}
                {activeTab === "orders" && (
                  <div className="space-y-6 text-left">
                    <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Lịch sử đơn hàng</h2>
                    <div className="space-y-4">
                       {orders.map(order => (
                         <div key={order.id} className="p-4 rounded-3xl bg-white border border-slate-100 flex gap-4 items-center group transition-all">
                           <img src={order.img} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" alt="prod" />
                           <div className="flex-1 text-left">
                             <div className="flex justify-between">
                                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Mã: #{order.id}</span>
                                 <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase bg-emerald-50 text-emerald-600`}>{order.status}</span>
                             </div>
                             <p className="text-base font-black text-[#006c49] mt-1">{order.total}</p>
                           </div>
                           <ChevronRight size={20} className="text-slate-300 group-hover:text-[#006c49] transition-all"/>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* CÁC TAB KHÁC CHƯA CÓ GIAO DIỆN CHI TIẾT */}
                {["vouchers", "favorites"].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
                    <Package size={40}/>
                    <p className="text-sm font-bold uppercase tracking-widest text-center">Dữ liệu cho {activeTab} đang cập nhật</p>
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
      `}} />
    </div>
  );
}