import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  Type,
  ImageIcon,
  Copy,
  Eye,
  ArrowRight,
  Star,
  Sliders,
  Layers,
  CheckCircle2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Megaphone,
  CreditCard,
  QrCode,
  ToggleLeft,
  ToggleRight,
  Maximize2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';

// BỘ MÀU GRADIENT MẶC ĐỊNH
const PRESET_GRADIENTS = [
  { label: 'Hồng Sen (Xôi Chè)', value: 'from-pink-950/95 via-pink-700/60 to-pink-600/20', btn: 'text-pink-600' },
  { label: 'Xanh Lá (Món Chay)', value: 'from-emerald-950/95 via-emerald-800/60 to-transparent', btn: 'text-emerald-800' },
  { label: 'Xanh Ngọc (Cà Phê & Trà)', value: 'from-teal-950/95 via-teal-600/50 to-transparent', btn: 'text-teal-600' },
  { label: 'Hổ Phách (Bánh Mì)', value: 'from-amber-950/95 via-amber-700/50 to-transparent', btn: 'text-amber-700' },
  { label: 'Xanh Dương (Hải Sản)', value: 'from-slate-950/95 via-blue-900/60 to-cyan-600/20', btn: 'text-cyan-700' },
  { label: 'Đỏ Lễ Hội (Khuyến Mãi)', value: 'from-red-950/95 via-rose-700/60 to-orange-500/20', btn: 'text-rose-600' },
  { label: 'Đen Sang Trọng (Black)', value: 'from-black/95 via-zinc-900/80 to-transparent', btn: 'text-zinc-800' },
  { label: 'Tím Hoàng Gia (Purple)', value: 'from-purple-950/95 via-purple-700/60 to-transparent', btn: 'text-purple-600' },
  { label: 'Trong suốt (Không phủ màu)', value: 'from-transparent via-transparent to-transparent', btn: 'text-[#006c49]' }
];

// URL API BACKEND PROMOTION SERVICE
const API_URL = 'http://localhost:5007/api/v1/homeposters';

export default function PosterBuilder() {
  // 1. STATE BỐN HOẶC NHIỀU BANNER DANH MỤC
  const [categoryBanners, setCategoryBanners] = useState([
    { id: 1, tag: 'Đặc sản', title: 'Xôi Chè\nViệt Nam', subtitle: 'Dẻo thơm hương nếp ngọt thanh vị chè!', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-pink-950/95 via-pink-700/60 to-pink-600/20', btnColor: 'text-pink-600', imageOnly: false, showButton: true },
    { id: 2, tag: 'Thực phẩm thiết yếu', title: 'Món chay\nViệt Nam', subtitle: 'Nguyên liệu thanh đạm, bữa ăn hài hòa', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-emerald-950/95 via-emerald-800/60 to-transparent', btnColor: 'text-emerald-800', imageOnly: false, showButton: true },
    { id: 3, tag: 'Thực phẩm thiết yếu', title: 'Cà phê & Trà', subtitle: 'Cho mỗi ngày đều tràn năng lượng!', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-teal-950/95 via-teal-600/50 to-transparent', btnColor: 'text-teal-600', imageOnly: false, showButton: true },
    { id: 4, tag: 'Đặc sản', title: 'Bánh Mì', subtitle: 'Khám phá nguyên bản Bánh Mì Việt Nam', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-amber-950/95 via-amber-700/50 to-transparent', btnColor: 'text-amber-700', imageOnly: false, showButton: true },
    { id: 5, tag: 'Tươi sống', title: 'Hải Sản\nTươi Ngon', subtitle: 'Đánh bắt mới mỗi ngày', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-slate-950/95 via-blue-900/60 to-cyan-600/20', btnColor: 'text-cyan-700', imageOnly: false, showButton: true }
  ]);

  // 2. STATE SLIDE SNAP EBT
  const [ebtList, setEbtList] = useState([
    { id: 1, useBannerImage: false, bannerImageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=120&q=80', title: 'Chúng tôi hiện chấp nhận thanh toán SNAP EBT', subtitle: 'Sắm thực phẩm Việt & được giao hàng miễn phí', note: '*Điều kiện EBT khác nhau theo từng tiểu bang.' },
    { id: 2, useBannerImage: true, bannerImageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&h=120&q=80', title: 'Ưu đãi Đặc Quyền Tuần Này', subtitle: 'Giảm 15% cho đơn hàng thực phẩm tươi sống', note: '*Áp dụng toàn hệ thống' }
  ]);

  // HERO BANNER STATE
  const [heroBanner, setHeroBanner] = useState({
    titleMain: 'Chợ Việt Nam & Châu Á',
    titleHighlight: 'trực tuyến lớn nhất Mỹ',
    offerBadge: '🚚 Giao hàng miễn phí cho 5 đơn đầu tiên',
    offerSub: '*Giá trị tối thiểu $35, thay đổi theo từng khu vực',
    giftBadgeValue: '$25',
    giftBadgeText: 'Trị giá*',
    truckImage: 'https://res.cloudinary.com/dm6fqzwhs/image/upload/v1781632779/Screenshot_2026-06-17_005741_zlraht.png',
    qrText: 'Quét mã để tải app',
    appReviewCount: 'Hơn 1 triệu lượt review'
  });

  // ⏱️ AUTOPLAY & THỜI GIAN CHUYỂN SLIDE RIÊNG BIỆT
  const [catAutoPlay, setCatAutoPlay] = useState(true);
  const [catInterval, setCatInterval] = useState(4);

  const [ebtAutoPlay, setEbtAutoPlay] = useState(true);
  const [ebtInterval, setEbtInterval] = useState(5);

  const [ebtCurrentIndex, setEbtCurrentIndex] = useState(0);
  const [catSliderIndex, setCatSliderIndex] = useState(0);

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedEbtIndex, setSelectedEbtIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');
  const [viewMode, setViewMode] = useState('editor');
  const [copied, setCopied] = useState(false);

  // STATE LƯU DATABASE
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // 🔄 1. TẢI CẤU HÌNH TỪ DATABASE MONGODB KHI NẠP TRANG
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const resData = await response.json();
          const config = resData.data;
          if (config) {
            if (config.heroBanner) setHeroBanner(config.heroBanner);
            if (config.categoryBanners && config.categoryBanners.length > 0) setCategoryBanners(config.categoryBanners);
            if (config.ebtList && config.ebtList.length > 0) setEbtList(config.ebtList);
            if (config.catInterval) setCatInterval(config.catInterval);
            if (config.ebtInterval) setEbtInterval(config.ebtInterval);
            if (typeof config.catAutoPlay === 'boolean') setCatAutoPlay(config.catAutoPlay);
            if (typeof config.ebtAutoPlay === 'boolean') setEbtAutoPlay(config.ebtAutoPlay);
          }
        }
      } catch (err) {
        console.log('Sử dụng dữ liệu mặc định do không gọi được API:', err);
      }
    };
    fetchConfig();
  }, []);

  // 🔄 EFFECT AUTOPLAY BANNER DANH MỤC
  useEffect(() => {
    if (!catAutoPlay || categoryBanners.length <= 4) return;
    const timer = setInterval(() => {
      setCatSliderIndex((prev) => (prev >= categoryBanners.length - 4 ? 0 : prev + 1));
    }, catInterval * 1000);
    return () => clearInterval(timer);
  }, [catAutoPlay, catInterval, categoryBanners.length]);

  // 🔄 EFFECT AUTOPLAY BANNER NGANG EBT
  useEffect(() => {
    if (!ebtAutoPlay || ebtList.length <= 1) return;
    const timer = setInterval(() => {
      setEbtCurrentIndex((prev) => (prev + 1) % ebtList.length);
    }, ebtInterval * 1000);
    return () => clearInterval(timer);
  }, [ebtAutoPlay, ebtInterval, ebtList.length]);

  // DRAG & DROP
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...categoryBanners];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setCategoryBanners(updated);
    setDraggedIndex(null);
  };

  const moveBanner = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= categoryBanners.length) return;

    const updated = [...categoryBanners];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setCategoryBanners(updated);
  };

  const handleAddCategoryBanner = () => {
    const newBanner = {
      id: Date.now(),
      tag: 'Đặc sản mới',
      title: 'Món Ngon\nMới Nhất',
      subtitle: 'Thưởng thức hương vị chuẩn vị',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&h=300&q=80',
      gradient: 'from-[#006c49]/95 via-[#005237]/70 to-transparent',
      btnColor: 'text-[#006c49]',
      imageOnly: false,
      showButton: true
    };
    setCategoryBanners([...categoryBanners, newBanner]);
    setSelectedCategoryIndex(categoryBanners.length);
  };

  const handleRemoveCategoryBanner = (index, e) => {
    e.stopPropagation();
    if (categoryBanners.length <= 1) return;
    const updated = categoryBanners.filter((_, i) => i !== index);
    setCategoryBanners(updated);
    setSelectedCategoryIndex(Math.max(0, selectedCategoryIndex - 1));
  };

  const handleAddEbtBanner = () => {
    const newEbt = {
      id: Date.now(),
      useBannerImage: false,
      bannerImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&h=120&q=80',
      title: 'Thông Báo Khuyến Mãi Mới',
      subtitle: 'Đăng ký thành viên nhận ngay voucher $10',
      note: '*Điều kiện áp dụng'
    };
    setEbtList([...ebtList, newEbt]);
    setSelectedEbtIndex(ebtList.length);
  };

  const handleRemoveEbtBanner = (index, e) => {
    e.stopPropagation();
    if (ebtList.length <= 1) return;
    const updated = ebtList.filter((_, i) => i !== index);
    setEbtList(updated);
    setSelectedEbtIndex(Math.max(0, selectedEbtIndex - 1));
  };

  const updateCurrentCategory = (key, value) => {
    setCategoryBanners((prevBanners) => {
      const updated = [...prevBanners];
      updated[selectedCategoryIndex] = {
        ...updated[selectedCategoryIndex],
        [key]: value
      };
      return updated;
    });
  };

  const updateCurrentEbt = (key, value) => {
    setEbtList((prevList) => {
      const updated = [...prevList];
      updated[selectedEbtIndex] = {
        ...updated[selectedEbtIndex],
        [key]: value
      };
      return updated;
    });
  };

  // 📝 ĐÓNG GÓI DỮ LIỆU CHUẨN KHỚP VỚI SCHEMA MONGOOSE (KHÔNG BỌC VỎ dư thừa)
  const getFullConfigPayload = () => {
    return {
      heroBanner,
      categoryBanners,
      ebtList,
      catInterval,
      ebtInterval,
      catAutoPlay,
      ebtAutoPlay
    };
  };

  const handleCopyConfig = () => {
    const payload = getFullConfigPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 💾 2. NÚT LƯU CẤU HÌNH LÊN DATABASE VIA PUT HTTP REQUEST
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });

    const payload = getFullConfigPayload();

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Lỗi kết nối Server (${response.status})`);
      }

      setSaveStatus({
        type: 'success',
        message: 'Đã lưu cấu hình thành công lên Database (MongoDB)!'
      });
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus({
        type: 'error',
        message: error.message || 'Không thể kết nối đến API Database!'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus({ type: '', message: '' }), 4000);
    }
  };

  const currentCat = categoryBanners[selectedCategoryIndex] || categoryBanners[0];
  const currentEbt = ebtList[selectedEbtIndex] || ebtList[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* HEADER TÁC VỤ */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#006c49] to-emerald-400 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Bảng Thiết Kế Poster & Banner <span className="text-xs bg-[#006c49] px-2 py-0.5 rounded-full font-bold text-emerald-100">Demi Mart</span>
            </h1>
            <p className="text-xs text-slate-400">Đã cập nhật tính năng Chọn & Điều chỉnh Phủ Màu Gradient trực tiếp</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setViewMode('editor')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'editor' ? 'bg-[#006c49] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders size={14} /> Chỉnh Sửa
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-[#006c49] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye size={14} /> Xem Toàn Trang Web
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* NÚT LƯU CẤU HÌNH LÊN DATABASE */}
          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#006c49] hover:from-emerald-500 hover:to-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition shadow-lg border border-emerald-500/30 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Đang Lưu...' : 'Lưu Cấu Hình Lên Database'}
          </button>

          <button
            onClick={handleCopyConfig}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition border border-slate-600"
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Đã Sao Chép JSON!' : 'Xuất JSON'}
          </button>
        </div>
      </header>

      {/* THÔNG BÁO TRẠNG THÁI LƯU DATABASE */}
      {saveStatus.message && (
        <div
          className={`px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            saveStatus.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {saveStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* WORKSPACE CHÍNH */}
      {viewMode === 'editor' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* TAB CHỈNH SỬA (PANEL TRÁI) */}
          <div className="lg:col-span-5 bg-slate-800/50 border-r border-slate-700/60 p-6 overflow-y-auto space-y-6 max-h-[calc(100vh-65px)]">
            
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'categories' ? 'border-[#006c49] text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={14} /> Banner Danh Mục ({categoryBanners.length})
              </button>
              <button
                onClick={() => setActiveTab('ebt')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'ebt' ? 'border-[#006c49] text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard size={14} /> Slider EBT ({ebtList.length})
              </button>
              <button
                onClick={() => setActiveTab('hero')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'hero' ? 'border-[#006c49] text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Megaphone size={14} /> Hero Top & QR
              </button>
            </div>

            {/* TAB CHỈNH SỬA BANNER DANH MỤC */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                {/* ⏱️ THỜI GIAN VÀ AUTOPLAY BANNER DANH MỤC */}
                <div className="p-3.5 bg-slate-900 border border-emerald-500/40 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock size={14} /> Thời gian & Autoplay Banner Danh Mục
                  </h4>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={catInterval}
                        onChange={(e) => setCatInterval(Number(e.target.value))}
                        className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
                      />
                      <span className="text-xs text-slate-400">Giây/Slide</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCatAutoPlay(!catAutoPlay)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                        catAutoPlay ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {catAutoPlay ? <Play size={10} fill="currentColor" /> : <Pause size={10} />}
                      {catAutoPlay ? 'Đang Chạy' : 'Đã Dừng'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Danh sách các Banner (Thêm / Xóa tùy ý):</p>
                  <button
                    type="button"
                    onClick={handleAddCategoryBanner}
                    className="flex items-center gap-1 bg-[#006c49] hover:bg-[#005237] text-white text-xs px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    <Plus size={14} /> Thêm Banner
                  </button>
                </div>

                {/* SELECTOR BANNER LIST CÓ NÚT XÓA */}
                <div className="flex flex-wrap gap-2">
                  {categoryBanners.map((cat, i) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryIndex(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition flex items-center gap-2 ${
                        selectedCategoryIndex === i
                          ? 'bg-[#006c49] text-white border-emerald-400 shadow-md scale-105'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span>Banner #{i + 1}</span>
                      {categoryBanners.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCategoryBanner(i, e)}
                          className="text-slate-400 hover:text-red-400 p-0.5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* CẤU HÌNH TÙY CHỌN BANNER ĐƯỢC CHỌN */}
                {currentCat && (
                  <>
                    <div className="p-4 bg-slate-900/80 border border-emerald-500/40 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <Maximize2 size={14} /> Cấu Hình Hiển Thị Banner #{selectedCategoryIndex + 1}
                      </h4>

                      <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                        <div>
                          <p className="text-xs font-bold text-white">Chế độ Chỉ Hình Ảnh (Chỉ Hình Không)</p>
                          <p className="text-[10px] text-slate-400">Ẩn toàn bộ chữ và dải màu, chỉ hiển thị hình ảnh tràn viền</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCurrentCategory('imageOnly', !currentCat.imageOnly)}
                          className="text-emerald-400"
                        >
                          {currentCat.imageOnly ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-500" />}
                        </button>
                      </div>

                      {!currentCat.imageOnly && (
                        <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                          <div>
                            <p className="text-xs font-bold text-white">Hiển Thị Nút Tròn Mũi Tên (+)</p>
                            <p className="text-[10px] text-slate-400">Ẩn hoặc hiện nút tròn mũi tên xem chi tiết ở góc dưới</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateCurrentCategory('showButton', !currentCat.showButton)}
                            className="text-emerald-400"
                          >
                            {currentCat.showButton ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-500" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {!currentCat.imageOnly && (
                      <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-2xl space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Thẻ Danh Mục (Tag)</label>
                          <input
                            type="text"
                            value={currentCat.tag}
                            onChange={(e) => updateCurrentCategory('tag', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Tiêu Đề (Shift+Enter để xuống dòng)</label>
                          <textarea
                            rows={2}
                            value={currentCat.title}
                            onChange={(e) => updateCurrentCategory('title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">Mô Tả Phụ (Subtitle)</label>
                          <input
                            type="text"
                            value={currentCat.subtitle}
                            onChange={(e) => updateCurrentCategory('subtitle', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-2xl">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Link Ảnh Background (URL)</label>
                      <input
                        type="text"
                        value={currentCat.image}
                        onChange={(e) => updateCurrentCategory('image', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                      />
                    </div>

                    {/* BẢNG CHỌN CẢI TIẾN ĐIỀU CHỈNH PHỦ MÀU GRADIENT */}
                    {!currentCat.imageOnly && (
                      <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-2xl space-y-3">
                        <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Palette size={14} /> Chọn Dải Phủ Màu Background Gradient (Banner #{selectedCategoryIndex + 1})
                        </label>

                        <div className="grid grid-cols-1 gap-2">
                          {PRESET_GRADIENTS.map((grad, gIdx) => (
                            <button
                              key={gIdx}
                              type="button"
                              onClick={() => {
                                updateCurrentCategory('gradient', grad.value);
                                updateCurrentCategory('btnColor', grad.btn);
                              }}
                              className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-between border transition cursor-pointer ${
                                currentCat.gradient === grad.value
                                  ? 'bg-slate-700 border-emerald-400 ring-2 ring-emerald-500/30'
                                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${grad.value} border border-white/20 shadow-sm`}></div>
                                <span className="text-slate-200 font-bold">{grad.label}</span>
                              </div>
                              {currentCat.gradient === grad.value && <CheckCircle2 size={16} className="text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB CHỈNH SỬA SLIDER THANH SNAP EBT NGANG */}
            {activeTab === 'ebt' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 border border-emerald-500/40 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Clock size={14} /> Thời gian & Autoplay Banner Ngang EBT
                  </h4>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={ebtInterval}
                        onChange={(e) => setEbtInterval(Number(e.target.value))}
                        className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
                      />
                      <span className="text-xs text-slate-400">Giây/Slide</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEbtAutoPlay(!ebtAutoPlay)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                        ebtAutoPlay ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {ebtAutoPlay ? <Play size={10} fill="currentColor" /> : <Pause size={10} />}
                      {ebtAutoPlay ? 'Đang Chạy' : 'Đã Dừng'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Danh sách các Slide EBT (Chạy qua lại &lt; &gt;):</p>
                  <button
                    type="button"
                    onClick={handleAddEbtBanner}
                    className="flex items-center gap-1 bg-[#006c49] hover:bg-[#005237] text-white text-xs px-2.5 py-1 rounded-lg font-bold transition"
                  >
                    <Plus size={14} /> Thêm Slide EBT
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ebtList.map((ebt, i) => (
                    <div
                      key={ebt.id}
                      onClick={() => setSelectedEbtIndex(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition flex items-center gap-2 ${
                        selectedEbtIndex === i
                          ? 'bg-[#006c49] text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span>Slide #{i + 1}</span>
                      {ebtList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveEbtBanner(i, e)}
                          className="text-slate-400 hover:text-red-400 p-0.5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {currentEbt && (
                  <div className="p-4 bg-slate-900/80 border border-emerald-500/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                      <div>
                        <p className="text-xs font-bold text-white">Dùng 1 Ảnh Banner Dài Tràn Viền</p>
                        <p className="text-[10px] text-slate-400">Thay thế toàn bộ chữ bằng 1 hình ảnh thiết kế dài</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCurrentEbt('useBannerImage', !currentEbt.useBannerImage)}
                        className="text-emerald-400"
                      >
                        {currentEbt.useBannerImage ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-500" />}
                      </button>
                    </div>

                    {currentEbt.useBannerImage ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Link Ảnh Banner Dài (URL)</label>
                        <input
                          type="text"
                          value={currentEbt.bannerImageUrl}
                          onChange={(e) => updateCurrentEbt('bannerImageUrl', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#006c49]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu Đề SNAP EBT</label>
                          <input
                            type="text"
                            value={currentEbt.title}
                            onChange={(e) => updateCurrentEbt('title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#006c49]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Mô Tả Phụ</label>
                          <input
                            type="text"
                            value={currentEbt.subtitle}
                            onChange={(e) => updateCurrentEbt('subtitle', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#006c49]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB HERO TOP */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu Đề Dòng 1</label>
                  <input
                    type="text"
                    value={heroBanner.titleMain}
                    onChange={(e) => setHeroBanner({ ...heroBanner, titleMain: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#006c49]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu Đề Nổi Bật (Màu Xanh)</label>
                  <input
                    type="text"
                    value={heroBanner.titleHighlight}
                    onChange={(e) => setHeroBanner({ ...heroBanner, titleHighlight: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#006c49]"
                  />
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <QrCode size={14} /> Cấu hình Mã QR & Review
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Chữ Hướng Dẫn Mã QR</label>
                    <input
                      type="text"
                      value={heroBanner.qrText}
                      onChange={(e) => setHeroBanner({ ...heroBanner, qrText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Chữ Lượt Review</label>
                    <input
                      type="text"
                      value={heroBanner.appReviewCount}
                      onChange={(e) => setHeroBanner({ ...heroBanner, appReviewCount: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#006c49]"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* KHU VỰC PREVIEW MÔ PHỎNG (PANEL PHẢI) */}
          <div className="lg:col-span-7 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-65px)]">
            
            <div className="space-y-6">
              
              {/* SẮP XẾP KÉO THẢ */}
              <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <GripVertical size={16} className="text-emerald-400" /> Kéo Thả Thứ Tự Tất Cả {categoryBanners.length} Banner
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {categoryBanners.map((cat, idx) => (
                    <div
                      key={cat.id || idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      onClick={() => setSelectedCategoryIndex(idx)}
                      className={`h-[130px] rounded-2xl p-2.5 relative overflow-hidden text-white flex flex-col justify-between border cursor-grab active:cursor-grabbing select-none transition-all ${
                        draggedIndex === idx
                          ? 'opacity-30 border-emerald-500 scale-95'
                          : selectedCategoryIndex === idx
                          ? 'border-emerald-400 ring-2 ring-emerald-500/50'
                          : 'border-white/10 hover:border-slate-500'
                      }`}
                    >
                      <img src={cat.image} alt={cat.title} className="absolute inset-0 w-full h-full object-cover" />
                      {!cat.imageOnly && <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`}></div>}

                      <div className="relative z-10 flex justify-between items-center bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10">
                        <span className="text-[8px] font-black uppercase text-emerald-300 flex items-center gap-1">
                          <GripVertical size={10} className="text-slate-400" /> #{idx + 1}
                        </span>
                        
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => { e.stopPropagation(); moveBanner(idx, -1); }}
                            className="p-0.5 rounded bg-slate-800/80 hover:bg-emerald-600 disabled:opacity-20 text-white"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categoryBanners.length - 1}
                            onClick={(e) => { e.stopPropagation(); moveBanner(idx, 1); }}
                            className="p-0.5 rounded bg-slate-800/80 hover:bg-emerald-600 disabled:opacity-20 text-white"
                          >
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      </div>

                      {cat.imageOnly ? (
                        <div className="relative z-10 bg-black/60 backdrop-blur-sm text-amber-300 text-[8px] font-bold p-1 rounded text-center my-auto border border-amber-500/30">
                          Chỉ Hình Ảnh
                        </div>
                      ) : (
                        <div className="relative z-10 my-auto">
                          <h4 className="text-[10px] font-black leading-tight whitespace-pre-line truncate">{cat.title}</h4>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DEMO LIVE TRỰC TIẾP */}
              <div className="pt-2 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Mô Phỏng Trực Tiếp (Rê chuột vào khung để thấy nút Mũi Tên &lt; &gt; hiện ra ở 2 mép)
                </span>

                <div className="p-4 bg-white rounded-3xl text-left space-y-5 shadow-2xl border border-slate-200 text-slate-800">
                  
                  {/* HERO TOP BANNER */}
                  <div className="px-4 pt-3 flex flex-col lg:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#f4faf7] via-white to-orange-50/20 rounded-[30px] pb-4 border border-[#e6f0ed]">
                    <div className="space-y-3 max-w-sm">
                      <h1 className="text-2xl md:text-[28px] font-black text-[#161b22] tracking-tight leading-[1.1]">
                        {heroBanner.titleMain}<br />
                        <span className="text-[#006c49]">{heroBanner.titleHighlight}</span>
                      </h1>
                      
                      <div className="inline-flex flex-col items-start gap-1">
                        <div className="bg-[#fea619] text-[#684000] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shadow-sm flex items-center gap-1">
                          {heroBanner.offerBadge}
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold ml-2">
                          {heroBanner.offerSub}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <div className="relative flex items-center gap-2 pl-2">
                        <div className="relative w-12 h-12 flex items-center justify-center filter drop-shadow-md select-none rotate-[-5deg]">
                          <div className="absolute inset-0 bg-white rounded-lg transform rotate-0 scale-105"></div>
                          <div className="absolute inset-0 bg-white rounded-lg transform rotate-12 scale-105"></div>
                          <div className="absolute inset-0 bg-white rounded-lg transform rotate-45 scale-105"></div>
                          <div className="absolute inset-0 bg-white rounded-lg transform rotate-75 scale-105"></div>
                          <div className="absolute inset-0.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg transform rotate-0"></div>
                          <div className="absolute inset-0.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg transform rotate-12"></div>
                          <div className="absolute inset-0.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg transform rotate-45"></div>
                          <div className="absolute inset-0.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg transform rotate-75"></div>
                          <div className="relative z-10 text-center text-white flex flex-col items-center justify-center -space-y-0.5">
                            <span className="text-xs font-black">{heroBanner.giftBadgeValue}</span>
                            <span className="text-[7px] font-bold">{heroBanner.giftBadgeText}</span>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-sky-200/70 border border-sky-100 flex items-center justify-center p-0.5 shadow-inner relative overflow-hidden transform translate-y-1">
                          <img src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=80&h=80&q=80" className="w-7 h-7 object-contain drop-shadow-sm rotate-[10deg]" alt="Bưởi" />
                        </div>

                        <div className="w-9 h-9 rounded-full bg-purple-100/80 border border-purple-50 flex items-center justify-center p-0.5 shadow-inner absolute -top-5 left-12 z-0">
                          <img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=80&h=80&q=80" className="w-6 h-6 object-contain drop-shadow-sm rotate-[-15deg]" alt="Nước" />
                        </div>

                        <div className="relative z-10 ml-1 w-20 flex-shrink-0 flex flex-col items-center">
                          <img src={heroBanner.truckImage} className="w-full h-auto object-contain" alt="Delivery Truck" />
                          <span className="absolute -bottom-1 bg-[#006c49] text-white font-black text-[6px] px-1 py-0.5 rounded shadow uppercase scale-90 whitespace-nowrap">
                            Demi Mart
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center p-0.5 border border-[#d6ede4]">
                          <div className="w-full h-full bg-[radial-gradient(#006c49_2px,transparent_2px)] [background-size:4px_4px]"></div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-slate-600 leading-tight">
                            {heroBanner.qrText} <span className="text-[#006c49]">&rarr;</span>
                          </p>
                          <div className="flex gap-0.5 text-[#fea619]">
                            {[...Array(5)].map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                          </div>
                          <p className="text-[7px] text-[#006c49] font-black uppercase tracking-tight">{heroBanner.appReviewCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🌟 1. BANNER DANH MỤC */}
                  <div className="relative px-2 py-1 group overflow-hidden rounded-3xl">
                    {categoryBanners.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setCatSliderIndex(Math.max(0, catSliderIndex - 1))}
                        disabled={catSliderIndex === 0}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 active:scale-90"
                      >
                        <ChevronLeft size={20} strokeWidth={3} />
                      </button>
                    )}

                    {categoryBanners.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setCatSliderIndex(Math.min(categoryBanners.length - 4, catSliderIndex + 1))}
                        disabled={catSliderIndex >= categoryBanners.length - 4}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 active:scale-90"
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </button>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-500 ease-in-out">
                      {categoryBanners.slice(catSliderIndex, catSliderIndex + 4).map((item) => (
                        <div
                          key={item.id}
                          className="h-[140px] rounded-2xl p-3 relative overflow-hidden text-white flex flex-col justify-between shadow-sm transition-all duration-500"
                        >
                          <img src={item.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title} />
                          
                          {!item.imageOnly && (
                            <>
                              <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} transition-opacity duration-300`}></div>
                              
                              <div className="space-y-0.5 relative z-10">
                                <span className="bg-white/20 backdrop-blur-md text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                  {item.tag}
                                </span>
                                <h3 className="text-xs font-black tracking-tight whitespace-pre-line leading-tight">
                                  {item.title}
                                </h3>
                                <p className="text-[9px] text-pink-100 font-medium truncate opacity-90">
                                  {item.subtitle}
                                </p>
                              </div>

                              {item.showButton && (
                                <div className={`w-5 h-5 rounded-full bg-white ${item.btnColor} flex items-center justify-center shadow relative z-10 self-end`}>
                                  <ArrowRight size={10} strokeWidth={3} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🌟 2. THANH SNAP EBT NGANG */}
                  <div className="relative px-2 group">
                    {ebtList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEbtCurrentIndex((prev) => (prev === 0 ? ebtList.length - 1 : prev - 1))}
                        className="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90"
                      >
                        <ChevronLeft size={20} strokeWidth={3} />
                      </button>
                    )}

                    {ebtList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEbtCurrentIndex((prev) => (prev === ebtList.length - 1 ? 0 : prev + 1))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/90 text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90"
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </button>
                    )}

                    <div className="transition-all duration-500 ease-in-out">
                      {ebtList[ebtCurrentIndex]?.useBannerImage ? (
                        <div className="w-full h-16 rounded-2xl overflow-hidden shadow-md relative group cursor-pointer border border-slate-200 transition-all duration-500">
                          <img src={ebtList[ebtCurrentIndex].bannerImageUrl} className="w-full h-full object-cover transition-transform duration-500" alt="SNAP EBT Banner" />
                        </div>
                      ) : (
                        <div className="bg-[#00875a] text-white rounded-xl p-3 flex items-center justify-between gap-3 border border-emerald-600 shadow-sm transition-all duration-500">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-100">
                              <span className="text-[#00875a] font-black text-[10px]">SNAP</span>
                            </div>
                            <div>
                              <h4 className="text-xs font-black tracking-tight">
                                {ebtList[ebtCurrentIndex]?.title}
                              </h4>
                              <p className="text-[9px] text-emerald-100 font-medium">
                                {ebtList[ebtCurrentIndex]?.subtitle} <span className="opacity-60 text-[8px] ml-1">{ebtList[ebtCurrentIndex]?.note}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="w-6 h-6 rounded-full bg-white text-[#00875a] flex items-center justify-center shadow flex-shrink-0">
                            <ArrowRight size={12} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* XEM TRƯỚC FULL SCREEN TRÊN TOÀN TRANG GIAO DIỆN KHÁCH HÀNG */
        <div className="flex-1 bg-slate-100 overflow-y-auto p-6 text-slate-800">
          <div className="max-w-6xl mx-auto bg-white rounded-[32px] p-6 shadow-2xl space-y-8 text-left border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Giao diện thực tế `QuangCao.jsx`
              </h2>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className="text-xs font-bold bg-[#006c49] text-white px-3 py-1.5 rounded-xl hover:bg-[#005237]"
              >
                &larr; Quay lại Trình Thiết Kế
              </button>
            </div>

            {/* 1. HERO TOP BANNER */}
            <div className="px-6 md:px-10 pt-4 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f4faf7] via-white to-orange-50/20 rounded-[40px] pb-6 border border-[#e6f0ed]">
              <div className="space-y-4 max-w-xl">
                <h1 className="text-4xl md:text-[46px] font-black text-[#161b22] tracking-tight leading-[1.1]">
                  {heroBanner.titleMain}<br />
                  <span className="text-[#006c49]">{heroBanner.titleHighlight}</span>
                </h1>
                
                <div className="inline-flex flex-col items-start gap-1">
                  <div className="bg-[#fea619] text-[#684000] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-sm flex items-center gap-1.5">
                    {heroBanner.offerBadge}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold ml-3">
                    {heroBanner.offerSub}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
                <div className="relative flex items-center gap-4 pl-4">
                  <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-md select-none rotate-[-5deg]">
                    <div className="absolute inset-0 bg-white rounded-xl transform rotate-0 scale-105"></div>
                    <div className="absolute inset-0 bg-white rounded-xl transform rotate-12 scale-105"></div>
                    <div className="absolute inset-0 bg-white rounded-xl transform rotate-45 scale-105"></div>
                    <div className="absolute inset-0 bg-white rounded-xl transform rotate-75 scale-105"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-0"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-12"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-45"></div>
                    <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-75"></div>
                    <div className="relative z-10 text-center text-white flex flex-col items-center justify-center -space-y-1">
                      <span className="text-xl font-black tracking-tight">{heroBanner.giftBadgeValue}</span>
                      <span className="text-[10px] font-bold tracking-tight">{heroBanner.giftBadgeText}</span>
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-full bg-sky-200/70 border border-sky-100 flex items-center justify-center p-1 shadow-inner relative overflow-hidden transform translate-y-2">
                    <img src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=80&h=80&q=80" className="w-11 h-11 object-contain drop-shadow-sm rotate-[10deg]" alt="Bưởi da xanh" />
                  </div>

                  <div className="w-14 h-14 rounded-full bg-purple-100/80 border border-purple-50 flex items-center justify-center p-1 shadow-inner absolute -top-8 left-20 z-0">
                    <img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=80&h=80&q=80" className="w-9 h-9 object-contain drop-shadow-sm rotate-[-15deg]" alt="Nước giải khát" />
                  </div>

                  <div className="relative z-10 ml-1 w-24 sm:w-28 md:w-32 lg:w-36 flex-shrink-0 flex flex-col items-center">
                    <img src={heroBanner.truckImage} className="w-full h-auto object-contain" alt="Delivery Truck" />
                    <span className="absolute -bottom-1 bg-[#006c49] text-white font-black text-[8px] px-2 py-0.5 rounded shadow uppercase tracking-wider scale-90 whitespace-nowrap">
                      Demi Mart
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center p-1 border border-[#d6ede4]">
                    <div className="w-full h-full bg-[radial-gradient(#006c49_2px,transparent_2px)] [background-size:4px_4px]"></div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      {heroBanner.qrText} <span className="text-[#006c49]">&rarr;</span>
                    </p>
                    <div className="flex gap-0.5 text-[#fea619]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                    </div>
                    <p className="text-[9px] text-[#006c49] font-black uppercase tracking-tight">{heroBanner.appReviewCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BANNER DANH MỤC */}
            <div className="px-6 md:px-10 relative group">
              {categoryBanners.length > 4 && (
                <button
                  type="button"
                  onClick={() => setCatSliderIndex(Math.max(0, catSliderIndex - 1))}
                  disabled={catSliderIndex === 0}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 active:scale-95"
                >
                  <ChevronLeft size={26} strokeWidth={3} />
                </button>
              )}

              {categoryBanners.length > 4 && (
                <button
                  type="button"
                  onClick={() => setCatSliderIndex(Math.min(categoryBanners.length - 4, catSliderIndex + 1))}
                  disabled={catSliderIndex >= categoryBanners.length - 4}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 active:scale-95"
                >
                  <ChevronRight size={26} strokeWidth={3} />
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-in-out">
                {categoryBanners.slice(catSliderIndex, catSliderIndex + 4).map((item) => (
                  <div
                    key={item.id}
                    className="h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-500"
                  >
                    <img src={item.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title} />
                    
                    {!item.imageOnly && (
                      <>
                        <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient}`}></div>
                        
                        <div className="space-y-1 relative z-10">
                          <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {item.tag}
                          </span>
                          <h3 className="text-xl font-black tracking-tight whitespace-pre-line leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-pink-100 font-medium max-w-[160px] leading-tight opacity-90">
                            {item.subtitle}
                          </p>
                        </div>

                        {item.showButton && (
                          <button type="button" className={`w-7 h-7 rounded-full bg-white ${item.btnColor} flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative z-10`}>
                            <ArrowRight size={14} strokeWidth={3} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. THANH THÔNG BÁO SNAP EBT */}
            <div className="mx-6 md:mx-10 relative group">
              {ebtList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setEbtCurrentIndex((prev) => (prev === 0 ? ebtList.length - 1 : prev - 1))}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
                >
                  <ChevronLeft size={26} strokeWidth={3} />
                </button>
              )}

              {ebtList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setEbtCurrentIndex((prev) => (prev === ebtList.length - 1 ? 0 : prev + 1))}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
                >
                  <ChevronRight size={26} strokeWidth={3} />
                </button>
              )}

              <div className="transition-all duration-500 ease-in-out">
                {ebtList[ebtCurrentIndex]?.useBannerImage ? (
                  <div className="rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer border border-slate-200">
                    <img src={ebtList[ebtCurrentIndex].bannerImageUrl} className="w-full h-auto object-cover transition-transform duration-500" alt="SNAP EBT Banner" />
                  </div>
                ) : (
                  <div className="bg-[#00875a] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600 shadow-sm relative overflow-hidden group cursor-pointer">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
                        <span className="text-[#00875a] font-black text-xs tracking-tight">SNAP</span>
                      </div>
                      <div>
                        <h4 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
                          {ebtList[ebtCurrentIndex]?.title}
                        </h4>
                        <p className="text-[11px] text-emerald-100 font-medium">
                          {ebtList[ebtCurrentIndex]?.subtitle} <span className="opacity-60 text-[9px] font-normal ml-1">{ebtList[ebtCurrentIndex]?.note}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-white text-[#00875a] flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform flex-shrink-0">
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}