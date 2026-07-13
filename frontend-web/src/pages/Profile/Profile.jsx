import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { authApi, orderApi, cartApi } from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import L from "leaflet";
import Cropper from "react-easy-crop";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  CheckCircle2,
  Lock,
  Heart,
  ChevronRight,
  Clock,
  Package,
  ShieldCheck,
  CreditCard,
  Star,
  Wallet,
  Ticket,
  Bell,
  Eye,
  History,
  Zap,
  Award,
  X,
  Plus,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";

// Sub-components đã bóc tách
import Tabhoso from "./Tabhoso/Tabhoso";
import Tabdiachi from "./Tabdiachi/Tabdiachi";
import Tabbaomat from "./Tabbaomat/Tabbaomat";
import Tabthongbao from "./Tabthongbao/Tabthongbao";
import Tabdonhang from "./Tabdonhang/Tabdonhang";
import Tabvoucher from "./Tabvoucher/Tabvoucher";
import Tabdathich from "./Tabdathich/Tabdathich";

// Fix lỗi icon mặc định Leaflet
import iconMarker from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
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
        pixelCrop.height,
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas trống rỗng"));
        blob.name = "cropped-avatar.jpeg";
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
};

export default function ProfilePage() {
  const [markerPos, setMarkerPos] = useState({
    lat: 10.762622,
    lng: 106.660172,
  });
  const { user: authUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { tab } = useParams();
  const location = useLocation(); // 🚀 Sử dụng useLocation để lắng nghe query thay đổi động

  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const API_BASE_URL = authApi.defaults.baseURL
    ? authApi.defaults.baseURL.replace(/\/api$/, "")
    : "";

  // 🚀 ĐỒNG BỘ ĐƯỜNG DẪN: Lấy tham số ?status= từ search query của URL
  const queryParams = new URLSearchParams(location.search);
  const currentStatusQuery = queryParams.get("status") || "xac-nhan"; // Mặc định là xac-nhan nếu URL trống

  // Khai báo cấu hình ánh xạ bộ lọc đơn hàng bằng tham số query an toàn
  const rawOrderStepsConfig = [
    { label: "Xác nhận", queryValue: "xac-nhan", icon: <History size={16} />, matchStatuses: ["chờ xác nhận", "xác nhận", "pending", "chờ xử lý"] },
    { label: "Lấy hàng", queryValue: "lay-hang", icon: <Package size={16} />, matchStatuses: ["lấy hàng", "đang xử lý"] },
    { label: "Đang giao", queryValue: "dang-giao", icon: <Clock size={16} />, matchStatuses: ["đang giao"] },
    { label: "Đã giao", queryValue: "da-giao", icon: <CheckCircle2 size={16} />, matchStatuses: ["đã giao"] },
    { label: "Đã hủy", queryValue: "da-huy", icon: <X size={16} />, matchStatuses: ["đã hủy", "cancelled"] },
  ];

  // Tính toán count động dựa trên dữ liệu thật ordersList từ API
  const orderSteps = rawOrderStepsConfig.map(step => {
    const count = ordersList.filter(o => {
      const status = (o.trang_thai_don_hang || "").trim().toLowerCase();
      return step.matchStatuses.includes(status);
    }).length;
    return { ...step, count };
  });

  // Tìm kiếm xem tab hiển thị nào tương ứng với query hiện tại trên trình duyệt
  const activeOrderStep = orderSteps.find(s => s.queryValue === currentStatusQuery);
  const selectedOrderTab = activeOrderStep ? activeOrderStep.label : "Xác nhận";

  useEffect(() => {
    if (activeTab === "orders" || tab === "orders") {
      const fetchRealOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await orderApi.get("/orders/my-orders");
          if (res.data && res.data.success) {
            setOrdersList(res.data.data || []);
          }
        } catch (err) {
          console.error("Lỗi lấy đơn hàng cá nhân:", err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchRealOrders();
    }
  }, [activeTab, tab]);

  // 🌟 HÀM XỬ LÝ HỦY ĐƠN HÀNG
  const handleCancelOrder = async (orderTarget) => {
    const confirmCancel = window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderTarget.ma_don_hang}?`);
    if (!confirmCancel) return;

    try {
      const response = await orderApi.put(`/orders/${orderTarget.ma_don_hang}/cancel`);
      
      if (response.data && response.data.success) {
        showToast(response.data.message || "Hủy đơn hàng thành công!");
        
        setOrdersList((prevOrders) =>
          prevOrders.map((order) =>
            order.ma_don_hang === orderTarget.ma_don_hang
              ? { ...order, trang_thai_don_hang: "Đã hủy" }
              : order
          )
        );
      }
    } catch (err) {
      console.error("Lỗi thực thi gửi API hủy đơn từ phía Client:", err);
      const errorMsg = err.response?.data?.message || "Hệ thống bận, không thể hủy đơn hàng vào lúc này.";
      showToast(errorMsg, "error");
    }
  };

  // 🌟 HÀM XỬ LÝ MUA LẠI ĐƠN HÀNG
  const handleReorder = async (orderTarget) => {
    setLoadingOrders(true);
    try {
      const items = orderTarget.danh_sach_san_pham || orderTarget.items || orderTarget.products || [];
      
      console.log("➡️ [DEBUG REORDER]: Đang chuẩn hóa dữ liệu đơn cũ gửi sang Cart Service:", items);

      if (!items || items.length === 0) {
        showToast("Đơn hàng không có dữ liệu sản phẩm gốc để mua lại!", "error");
        return;
      }

      showToast("Đang thêm sản phẩm cũ vào giỏ hàng...");

      for (const item of items) {
        const variantId = item.variant_id || item.variantId;
        const productName = item.product_name || item.name || "Sản phẩm Demi Mart";
        const qty = item.quantity || item.qty || 1;

        if (variantId) {
          await cartApi.post("/cart/add", {
            variantId: variantId,
            name: productName,
            quantity: Number(qty),
            price: Number(item.price || 0),
            image_url: item.image_url || ""
          });
        }
      }

      showToast("Đang chuyển hướng sang giỏ hàng...");
      navigate("/cart"); 

    } catch (err) {
      console.error("🔥 Lỗi thực thi thêm hàng mua lại:", err);
      const errorMsg = err.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!";
      showToast(errorMsg, "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingGeography, setLoadingGeography] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const provinceRef = useRef(null);
  const districtRef = useRef(null);
  const wardRef = useRef(null);
  const suggestionRef = useRef(null);

  const [addressForm, setAddressForm] = useState({
    receiver_name: "",
    receiver_phone: "",
    province_name: "",
    province_id: "",
    district_name: "",
    district_id: "",
    ward_name: "",
    ward_code: "",
    detail_address: "",
    is_default: false,
    address_type: "home",
  });

  const [securityStep, setSecurityStep] = useState("verify-password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const mobileTabs = [
    { id: "profile", path: "", label: "Hồ sơ", icon: <User size={14} /> },
    {
      id: "notifications",
      path: "notifications",
      label: "Thông báo",
      icon: <Bell size={14} />,
    },
    {
      id: "addresses",
      path: "address",
      label: "Địa chỉ",
      icon: <MapPin size={14} />,
    },
    {
      id: "security",
      path: "security",
      label: "Bảo mật",
      icon: <Lock size={14} />,
    },
    {
      id: "orders",
      path: "orders?status=xac-nhan", // Đồng bộ luôn ở thanh mobile tab
      label: "Đơn hàng",
      icon: <Package size={14} />,
    },
    {
      id: "vouchers",
      path: "vouchers",
      label: "Voucher",
      icon: <Ticket size={14} />,
    },
    {
      id: "favorites",
      path: "favorites",
      label: "Đã thích",
      icon: <Heart size={14} />,
    },
  ];

  const menuGroups = [
    { title: "Cá nhân", items: mobileTabs.slice(0, 4) },
    { title: "Mua sắm", items: mobileTabs.slice(4) },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        provinceRef.current &&
        !provinceRef.current.contains(event.target) &&
        districtRef.current &&
        !districtRef.current.contains(event.target) &&
        wardRef.current &&
        !wardRef.current.contains(event.target) &&
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!tab) {
      setActiveTab("profile");
    } else if (tab === "orders") {
      setActiveTab("orders");
    } else {
      const currentTab = mobileTabs.find((t) => t.path === tab);
      if (currentTab) setActiveTab(currentTab.id);
    }
  }, [tab]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await authApi.get("/profile/hoso");
        if (response.data.success) setProfile(response.data.data);
      } catch (error) {
        console.error("Lỗi kết nối API hồ sơ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") fetchAddresses();
  }, [activeTab]);

  useEffect(() => {
    if (isAddressModalOpen) {
      const fetchProvincesGeo = async () => {
        try {
          setLoadingGeography(true);
          const res = await authApi.get("/addresses/locations/provinces");
          if (res.data && res.data.success) setProvinces(res.data.data || []);
        } catch (err) {
          console.error("🔥 Lỗi bốc danh mục Tỉnh/Thành:", err.message);
        } finally {
          setLoadingGeography(false);
        }
      };
      fetchProvincesGeo();
    }
  }, [isAddressModalOpen]);

  useEffect(() => {
    if (
      !addressForm.detail_address ||
      addressForm.detail_address.trim().length < 2
    ) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      let searchParams = {
        q: addressForm.detail_address.trim(),
        format: "json",
        limit: 6,
        addressdetails: 1,
        "accept-language": "vi",
        countrycodes: "vn",
      };
      if (addressForm.province_name) {
        searchParams.q = `${addressForm.detail_address.trim()}, ${addressForm.province_name}`;
        if (
          addressForm.province_name.includes("Hồ Chí Minh") ||
          addressForm.province_name.includes("HCM")
        ) {
          searchParams.viewbox = "10.37,106.36,11.16,107.02";
          searchParams.bounded = 1;
        } else if (addressForm.province_name.includes("Hà Nội")) {
          searchParams.viewbox = "20.61,105.28,21.36,106.03";
          searchParams.bounded = 1;
        }
      }
      try {
        const res = await authApi.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: searchParams,
            headers: {
              "User-Agent": "DemiMartApp_HighAccuracy/2.0 (dev@demimart.com)",
            },
          },
        );
        if (res.data && res.data.length > 0) {
          setAddressSuggestions(res.data);
          setShowSuggestions(true);
        } else {
          const fallbackRes = await authApi.get(
            `https://nominatim.openstreetmap.org/search`,
            {
              params: {
                q: `${addressForm.detail_address.trim()}, ${addressForm.district_name || ""} ${addressForm.province_name || "Việt Nam"}`,
                format: "json",
                limit: 4,
                "accept-language": "vi",
              },
              headers: { "User-Agent": "DemiMartApp_HighAccuracy/2.0" },
            },
          );
          setAddressSuggestions(fallbackRes.data || []);
          setShowSuggestions(fallbackRes.data && fallbackRes.data.length > 0);
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API bản đồ gợi ý:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [
    addressForm.detail_address,
    addressForm.province_name,
    addressForm.district_name,
  ]);

  const fetchAddresses = async () => {
    try {
      const response = await authApi.get("/addresses");
      if (response.data.success) setAddresses(response.data.data);
    } catch (error) {
      console.error("Lỗi tải danh sách địa chỉ:", error);
    }
  };

  const selectProvince = async (id, name) => {
    setDistricts([]);
    setWards([]);
    setAddressForm((prev) => ({
      ...prev,
      province_id: id,
      province_name: name,
      district_id: "",
      district_name: "",
      ward_code: "",
      ward_name: "",
    }));
    setOpenDropdown(null);
    setSearchTerm("");
    setLoadingGeography(true);
    try {
      const res = await authApi.get(
        `/addresses/locations/districts?province_id=${id}`,
      );
      if (res.data && res.data.success) setDistricts(res.data.data || []);
    } catch (err) {
      console.error("🔥 Lỗi lấy danh mục Quận/Huyện:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  const selectDistrict = async (id, name) => {
    setWards([]);
    setAddressForm((prev) => ({
      ...prev,
      district_id: id,
      district_name: name,
      ward_code: "",
      ward_name: "",
    }));
    setOpenDropdown(null);
    setSearchTerm("");
    setLoadingGeography(true);
    try {
      const res = await authApi.get(
        `/addresses/locations/wards?district_id=${id}`,
      );
      if (res.data && res.data.success) setWards(res.data.data || []);
    } catch (err) {
      console.error("🔥 Lỗi lấy danh mục Phường/Xã:", err.message);
    } finally {
      setLoadingGeography(false);
    }
  };

  const selectWard = (code, name) => {
    setAddressForm((prev) => ({ ...prev, ward_code: code, ward_name: name }));
    setOpenDropdown(null);
    setSearchTerm("");
  };

  const filteredProvinces = provinces.filter((p) =>
    p.ProvinceName.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredDistricts = districts.filter((d) =>
    d.DistrictName.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredWards = wards.filter((w) =>
    w.WardName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setDistricts([]);
    setWards([]);
    setMarkerPos({ lat: 10.762622, lng: 106.660172 });
    setAddressForm({
      receiver_name: profile?.full_name || "",
      receiver_phone: profile?.phone_number || "",
      province_name: "",
      province_id: "",
      district_name: "",
      district_id: "",
      ward_name: "",
      ward_code: "",
      detail_address: "",
      is_default: addresses.length === 0,
      address_type: "home",
    });
    setIsAddressModalOpen(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    const { lat, lon, display_name, address } = suggestion;
    let cleanDetailAddress = display_name;
    if (address) {
      const road =
        address.road || address.suburb || address.neighbourhood || "";
      const house_number = address.house_number || "";
      cleanDetailAddress = house_number
        ? `${house_number} ${road}`
        : road || display_name.split(",")[0];
    }
    setAddressForm((prev) => ({ ...prev, detail_address: cleanDetailAddress }));
    setMarkerPos({ lat: parseFloat(lat), lng: parseFloat(lon) });
    setShowSuggestions(false);
    showToast("Đã đồng bộ tọa độ không gian bản đồ!");
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await authApi.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            format: "json",
            lat,
            lon: lng,
            zoom: 18,
            addressdetails: 1,
            "accept-language": "vi",
          },
          headers: { "User-Agent": "DemiMartApp_HighAccuracy/2.0" },
        },
      );
      if (res.data && res.data.display_name) {
        const addressParts = res.data.display_name.split(", ");
        const streetAddress = addressParts.slice(0, 2).join(", ");
        setAddressForm((prev) => ({
          ...prev,
          detail_address: streetAddress || res.data.display_name,
        }));
      }
    } catch (err) {
      console.log("Lỗi dịch ngược tọa độ bản đồ:", err);
    }
  };

  const handleOpenEditModal = async (addr) => {
    setEditingAddressId(addr.address_id);
    setAddressForm({
      ...addr,
      ward_code: addr.ward_code || addr.ward_id || "",
      is_default: Boolean(addr.is_default),
    });
    if (addr.latitude && addr.longitude)
      setMarkerPos({
        lat: parseFloat(addr.latitude),
        lng: parseFloat(addr.longitude),
      });
    else setMarkerPos({ lat: 10.762622, lng: 106.660172 });
    setIsAddressModalOpen(true);

    if (addr.province_id) {
      try {
        const distRes = await authApi.get(
          `/addresses/locations/districts?province_id=${addr.province_id}`,
        );
        if (distRes.data.success) setDistricts(distRes.data.data || []);
        if (addr.district_id) {
          const wardRes = await authApi.get(
            `/addresses/locations/wards?district_id=${addr.district_id}`,
          );
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
    if (
      !addressForm.province_id ||
      !addressForm.district_id ||
      !addressForm.ward_code
    )
      return alert("Vui lòng chọn đầy đủ danh mục địa chính từ bảng tìm kiếm!");
    try {
      const payload = {
        ...addressForm,
        is_default: addressForm.is_default ? true : false,
        province_id: Number(addressForm.province_id),
        district_id: Number(addressForm.district_id),
        ward_id: String(addressForm.ward_code),
        ward_code: String(addressForm.ward_code),
        latitude: markerPos.lat,
        longitude: markerPos.lng,
      };
      const res = editingAddressId
        ? await authApi.put(`/addresses/${editingAddressId}`, payload)
        : await authApi.post("/addresses", payload);
      if (res.data.success) {
        showToast(
          editingAddressId ? "Cập nhật thành công!" : "Đã thêm địa chỉ mới!",
        );
        setIsAddressModalOpen(false);
        fetchAddresses();
      }
    } catch (error) {
      showToast("Lỗi hệ thống khi xử lý địa chỉ", "error");
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      const targetAddr = addresses.find((a) => a.address_id === addrId);
      if (!targetAddr) return;
      const payload = {
        ...targetAddr,
        is_default: true,
        province_id: Number(targetAddr.province_id),
        district_id: Number(targetAddr.district_id),
        ward_id: String(targetAddr.ward_code || targetAddr.ward_id),
        ward_code: String(targetAddr.ward_code || targetAddr.ward_id),
      };
      const res = await authApi.put(`/addresses/${addrId}`, payload);
      if (res.data.success) {
        showToast("Đã đặt làm điểm nhận hàng mặc định!");
        fetchAddresses();
      }
    } catch (error) {
      showToast("Không thể thiết lập mặc định", "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này khỏi sổ lưu trữ?"))
      return;
    try {
      const res = await authApi.delete(`/addresses/${id}`);
      if (res.data.success) {
        showToast("Đã xóa địa chỉ thành công!");
        fetchAddresses();
      }
    } catch (error) {
      showToast("Lỗi khi xóa địa chỉ", "error");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authApi.put("/profile/hoso", profile);
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
      const response = await authApi.post("/profile/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        const newUrl = response.data.avatarUrl;
        setProfile((prev) => ({ ...prev, avatar_url: newUrl }));
        if (updateUser) updateUser({ avatar_url: newUrl });
        showToast("Đã cập nhật ảnh đại diện tùy chỉnh rực rỡ!");
        setImageSrc(null);
      }
    } catch (error) {
      showToast("Lỗi xử lý cắt ảnh hệ thống", "error");
    } finally {
      setIsCropping(false);
    }
  };

  const handleVerifyCurrentPassword = async () => {
    try {
      const res = await authApi.post("/profile/verify-password", {
        password: currentPassword,
      });
      if (res.data.success) {
        showToast("Xác thực danh tính thành công!");
        setSecurityStep("reset-password");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Mật khẩu không chính xác",
        "error",
      );
    }
  };

  const handleSendOTP = async () => {
    try {
      const res = await authApi.post("/auth/forgot-password", {
        email: profile.email,
      });
      if (res.data.success) {
        showToast("Mã OTP bảo mật đã được gửi!");
        setSecurityStep("otp-verify");
      }
    } catch (err) {
      showToast("Lỗi gửi mã xác thực", "error");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await authApi.post("/auth/verify-otp", {
        email: profile.email,
        otp: otpCode,
      });
      if (res.data.success) {
        showToast("Mã OTP hợp lệ!");
        setSecurityStep("reset-password");
      }
    } catch (err) {
      showToast("Mã OTP không đúng hoặc đã hết hạn", "error");
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword)
      return showToast("Mật khẩu nhập lại không khớp!", "error");
    try {
      let res = otpCode
        ? await authApi.post("/auth/reset-password", {
            email: profile.email,
            otp: otpCode,
            newPassword,
          })
        : await authApi.put("/profile/change-password", { newPassword });
      if (res.data.success) {
        showToast("Đổi mật khẩu bảo mật thành công!");
        setSecurityStep("verify-password");
        setNewPassword("");
        setConfirmNewPassword("");
        setOtpCode("");
        setCurrentPassword("");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Lỗi cập nhật cấu trúc mật khẩu",
        "error",
      );
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const getAvatarSrc = (url) => {
    if (!url || url === "" || url.includes("unsplash.com")) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || "User")}&background=006c49&color=fff`;
    }
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? url : "/" + url}?t=${new Date().getTime()}`;
  };

  const renderTierBadge = (tier, sizeClass, iconSize) => {
    const name = String(tier || "BẠC").toUpperCase();
    if (name === "KIM CƯƠNG") {
      return (
        <p
          className={`${sizeClass} font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 w-max`}
        >
          <Award size={iconSize} fill="currentColor" /> KIM CƯƠNG
        </p>
      );
    }
    if (name === "VÀNG") {
      return (
        <p
          className={`${sizeClass} font-black text-amber-600 uppercase tracking-widest flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 w-max`}
        >
          <Award size={iconSize} fill="currentColor" /> VÀNG
        </p>
      );
    }
    return (
      <p
        className={`${sizeClass} font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200 w-max`}
      >
        <Award size={iconSize} fill="currentColor" /> BẠC
      </p>
    );
  };

  const notifications = [
    {
      id: 1,
      title: "Ưu đãi Platinum độc quyền",
      desc: "Giảm ngay 100k cho đơn hàng từ 500k.",
      time: "10 phút trước",
      unread: true,
    },
    {
      id: 2,
      title: "Đơn hàng #DM9922 thành công",
      desc: "Kiện hàng của bạn đã được giao đến đích.",
      time: "2 giờ trước",
      unread: false,
    },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">
          Đang kết nối cơ sở dữ liệu Demi Mart...
        </p>
      </div>
    );

  return (
    <div className="w-full bg-[#f0f2f5] font-sans text-slate-700 min-h-screen transition-all relative selection:bg-[#006c49] selection:text-white pb-8 text-left">
      {/* MODAL CẮT ẢNH ĐẠI DIỆN */}
      {imageSrc && (
        <div className="fixed inset-0 z-[10008] flex flex-col items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-800">
            <div className="p-5 border-b flex justify-between items-center bg-white">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Cắt chỉnh ảnh đại diện
              </h3>
              <button
                disabled={isCropping}
                onClick={() => setImageSrc(null)}
                className="text-slate-400 hover:text-red-500 transition-all cursor-pointer"
              >
                <X size={18} />
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
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-400 hover:bg-slate-50 border disabled:opacity-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isCropping}
                  onClick={handleUploadCroppedAvatar}
                  className="flex-1 bg-[#006c49] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                >
                  {isCropping ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Xác nhận cắt"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TOP BANNER */}
      <div className="md:hidden sticky top-0 z-[100] bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={getAvatarSrc(profile.avatar_url)}
              className="w-10 h-10 rounded-2xl object-cover border-2"
              alt="avt"
            />
            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-md border border-white shadow-sm">
              <Award size={8} fill="currentColor" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-slate-900 text-sm tracking-tight leading-none">
              {profile.full_name}
            </span>
            {renderTierBadge(profile.membership_tier, "text-[8px] mt-1.5", 8)}
          </div>
        </div>
        <div className="bg-[#e6f0ed] px-3 py-1.5 rounded-xl border border-[#006c49]/10">
          <p className="text-[9px] font-black text-[#006c49] uppercase tracking-tighter">
            Đang hoạt động
          </p>
        </div>
      </div>

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className="fixed top-20 md:top-6 right-4 left-4 md:left-auto z-[10009] animate-toastIn">
          <div
            className={`bg-white border-l-4 ${toast.type === "success" ? "border-[#006c49]" : "border-red-500"} shadow-2xl rounded-xl p-3 flex items-center gap-3`}
          >
            {toast.type === "error" ? (
              <X size={18} className="text-red-500" />
            ) : (
              <CheckCircle2 size={18} className="text-[#006c49]" />
            )}
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
                <img
                  src={getAvatarSrc(profile.avatar_url)}
                  className="w-14 h-14 rounded-2xl object-cover border-4 border-[#f0f9f6]"
                  alt="Avatar"
                />
                <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-lg border-2 border-white shadow-sm">
                  <Award size={10} fill="currentColor" />
                </div>
              </div>
              <div className="overflow-hidden text-left">
                <h4 className="font-black text-slate-900 truncate tracking-tight text-sm">
                  {profile.full_name}
                </h4>
                {renderTierBadge(
                  profile.membership_tier,
                  "text-[9px] mt-1",
                  10,
                )}
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100 space-y-4">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-0.5">
                  <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    {group.title}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        navigate(
                          item.path ? `/profile/${item.path}` : "/profile",
                        );
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${activeTab === item.id || (item.id === "orders" && activeTab === "orders") ? "bg-[#006c49] text-white shadow-lg shadow-[#006c49]/20" : "text-slate-500 hover:bg-slate-50 hover:text-[#006c49]"}`}
                    >
                      <span
                        className={
                          activeTab === item.id || (item.id === "orders" && activeTab === "orders")
                            ? "text-white"
                            : "text-slate-300"
                        }
                      >
                        {item.icon}
                      </span>
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
                <div className="relative z-10 flex flex-col justify-between h-full text-left">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Wallet size={12} /> Ví Demi Pay
                    </span>
                    <Eye
                      size={12}
                      className="opacity-50 cursor-pointer hover:opacity-100"
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-2xl md:text-xl font-black tracking-tight">
                      2.450.000đ
                    </h2>
                    <button
                      onClick={() => showToast("Hệ thống nạp ví đang bảo trì")}
                      className="bg-white text-[#006c49] px-4 py-1.5 rounded-xl font-black text-[9px] shadow-sm cursor-pointer"
                    >
                      Nạp tiền
                    </button>
                  </div>
                </div>
                <CreditCard className="absolute -right-4 -bottom-4 w-20 h-20 opacity-10 -rotate-12" />
              </div>

              <div className="bg-white rounded-none md:rounded-[28px] p-4 shadow-sm border border-slate-100 flex flex-row md:flex-col justify-between items-center h-auto md:h-[100px]">
                <div className="flex items-center justify-between w-full gap-2 md:block text-left">
                  <div className="flex items-center gap-2 md:justify-between">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Star
                        size={12}
                        fill="#fea619"
                        className="text-[#fea619]"
                      />{" "}
                      Thưởng tích lũy
                    </p>
                    <span
                      onClick={() =>
                        showToast("Chức năng đổi quà đang bảo trì")
                      }
                      className="text-[8px] font-black text-[#006c49] cursor-pointer hover:underline uppercase"
                    >
                      Đổi quà
                    </span>
                  </div>
                  <div className="flex items-center gap-3 md:block md:mt-1">
                    <span className="text-lg md:text-xl font-black whitespace-nowrap">
                      1.250{" "}
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        Xu
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB HORIZONTAL MOBILE */}
            <div className="md:hidden bg-[#f0f2f5] py-2 px-4 flex overflow-x-auto no-scrollbar gap-2 sticky top-[73px] z-[90]">
              {mobileTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    navigate(item.path ? `/profile/${item.path}` : "/profile");
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] font-black uppercase border shadow-sm cursor-pointer ${activeTab === item.id || (item.id === "orders" && activeTab === "orders") ? "bg-[#006c49] text-white border-[#006c49]" : "bg-white text-slate-500 border-slate-200"}`}
                >
                  {item.icon} {item.label.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-none md:rounded-[32px] shadow-sm border-none md:border border-slate-100 overflow-hidden flex flex-col min-h-screen md:min-h-[550px]">
              {/* ORDER SUMMARY MINIBAR */}
              <div className="bg-[#fcfdfd] border-b border-slate-100 py-3 px-4 flex justify-around items-center overflow-x-auto no-scrollbar shrink-0">
                {orderSteps.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setActiveTab("orders");
                      // 🚀 SỬA ĐỔI QUAN TRỌNG: Điều hướng dùng Search Query để cố định link gốc /profile/orders không bị lỗi 404 đá trang
                      navigate(`/profile/orders?status=${step.queryValue}`);
                    }}
                    className={`flex flex-col items-center gap-1 group cursor-pointer relative min-w-[70px] pb-1 border-b-2 transition-all ${
                      selectedOrderTab === step.label && activeTab === "orders" ? "border-b-[#006c49]" : "border-b-transparent"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                      selectedOrderTab === step.label && activeTab === "orders"
                        ? "bg-[#e6f0ed] text-[#006c49] border-[#006c49]/20" 
                        : "bg-white border-slate-100 text-slate-300 group-hover:text-[#006c49]"
                    }`}>
                      {step.icon}
                    </div>
                    {step.count > 0 && (
                      <span className="absolute top-0 right-3 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                        {step.count}
                      </span>
                    )}
                    <p className={`text-[8px] font-black uppercase tracking-widest ${
                      selectedOrderTab === step.label && activeTab === "orders" ? "text-[#006c49]" : "text-slate-400"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-5 md:px-8 lg:px-12 pb-10 pt-6 animate-fadeIn flex-1 text-left">
                {/* RENDER CONTENT DỰA TRÊN ACTIVE TAB */}
                {activeTab === "profile" && (
                  <Tabhoso
                    profile={profile}
                    setProfile={setProfile}
                    handleSaveProfile={handleSaveProfile}
                    handleAvatarChange={handleAvatarChange}
                    getAvatarSrc={getAvatarSrc}
                  />
                )}

                {activeTab === "addresses" && (
                  <Tabdiachi
                    addresses={addresses}
                    handleOpenAddModal={handleOpenAddModal}
                    handleOpenEditModal={handleOpenEditModal}
                    handleDeleteAddress={handleDeleteAddress}
                    handleSetDefault={handleSetDefault}
                    isAddressModalOpen={isAddressModalOpen}
                    setIsAddressModalOpen={setIsAddressModalOpen}
                    editingAddressId={editingAddressId}
                    handleSaveAddress={handleSaveAddress}
                    addressForm={addressForm}
                    setAddressForm={setAddressForm}
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
                )}

                {activeTab === "security" && (
                  <Tabbaomat
                    securityStep={securityStep}
                    setSecurityStep={setSecurityStep}
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    handleVerifyCurrentPassword={handleVerifyCurrentPassword}
                    profile={profile}
                    handleSendOTP={handleSendOTP}
                    otpCode={otpCode}
                    setOtpCode={setOtpCode}
                    handleVerifyOTP={handleVerifyOTP}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmNewPassword={confirmNewPassword}
                    setConfirmNewPassword={setConfirmNewPassword}
                    handleResetPassword={handleResetPassword}
                  />
                )}

                {activeTab === "notifications" && (
                  <Tabthongbao notifications={notifications} />
                )}
                
                {activeTab === "orders" && (
                  <Tabdonhang 
                    orders={ordersList} 
                    currentTabLabel={selectedOrderTab}
                    onCancelOrder={handleCancelOrder}
                    onReorder={handleReorder}
                  />
                )}
                
                {activeTab === "vouchers" && <Tabvoucher />}
                {activeTab === "favorites" && <Tabdathich />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-toastIn { animation: toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #006c49; cursor: pointer; transition: all 0.1s ease; }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
      `,
        }}
      />
    </div>
  );
}