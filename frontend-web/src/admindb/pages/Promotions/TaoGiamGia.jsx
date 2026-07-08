import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Search,
  Plus,
  Trash2,
  Tag,
  Calendar,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { promotionApi, productApi } from "../../../api/axios.js";

const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  return str.toLowerCase();
};

export default function TaoGiamGia() {
  const navigate = useNavigate();
  const { id } = useParams();
  // 🌟 NẾU CÓ TRUYỀN ID TRÊN URL, THÌ ĐÂY LÀ CHẾ ĐỘ CHỈNH SỬA
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [campaignInfo, setCampaignInfo] = useState({
    ten_chuong_trinh: "",
    mo_ta: "",
    thoi_gian_bat_dau: "",
    thoi_gian_ket_thuc: "",
  });

  const [availableProducts, setAvailableProducts] = useState([]);
  const [busyVariants, setBusyVariants] = useState(new Set());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Biến cờ kiểm tra lỗi giá để Disable nút Lưu
  const hasPriceError = selectedItems.some(
    (item) =>
      item.gia_khuyen_mai !== "" &&
      Number(item.gia_khuyen_mai) >= Number(item.gia_goc),
  );

  const fetchProductsForSelection = async () => {
    try {
      const res = await productApi.get("/products?role=admin&limit=100");
      let flatVariants = [];

      if (res.data && res.data.products) {
        const groupedProductIds = [];
        const groupedProductsMap = {};

        res.data.products.forEach((p) => {
          const isSingle =
            p.co_bien_the === false ||
            p.co_bien_the === "false" ||
            p.co_bien_the === 0 ||
            !p.co_bien_the;

          if (isSingle) {
            flatVariants.push({
              ma_san_pham: p.ma_san_pham,
              ten_san_pham: p.ten_san_pham,
              hinh_anh: p.hinh_anh_chinh,
              ma_bien_the: p.ma_bien_the_mac_dinh || p.ma_san_pham,
              ten_bien_the: "Mặc định",
              gia_goc: p.gia_ban_le || p.gia_ban_thap_nhat || p.gia_ban || 0,
              ton_kho_goc: p.so_luong_ton || p.tong_ton_kho || p.ton_kho || 0,
              sku: p.sku || "",
            });
          } else {
            const variantArray =
              p.chi_tiet_bien_the ||
              p.bien_the ||
              p.danh_sach_bien_the ||
              p.variants ||
              p.bien_the_san_pham ||
              [];
            if (variantArray.length > 0) {
              variantArray.forEach((v) => {
                flatVariants.push({
                  ma_san_pham: p.ma_san_pham,
                  ten_san_pham: p.ten_san_pham,
                  hinh_anh: v.hinh_anh || p.hinh_anh_chinh,
                  ma_bien_the: v.ma_bien_the,
                  ten_bien_the:
                    v.ten_bien_the ||
                    `${v.mau_sac || ""} ${v.kich_thuoc || ""}`.trim() ||
                    "Biến thể",
                  gia_goc:
                    v.gia_ban_le ||
                    v.gia_ban ||
                    p.gia_ban_le ||
                    p.gia_ban_thap_nhat ||
                    0,
                  ton_kho_goc: v.so_luong_ton || v.ton_kho || 0,
                  sku: v.sku || "",
                });
              });
            } else {
              groupedProductIds.push(p.ma_san_pham);
              groupedProductsMap[p.ma_san_pham] = p;
            }
          }
        });

        if (groupedProductIds.length > 0) {
          const detailPromises = groupedProductIds.map((pid) =>
            productApi.get(`/products/${pid}?role=admin`).catch(() => null),
          );
          const detailResponses = await Promise.all(detailPromises);

          detailResponses.forEach((response) => {
            if (response && response.data) {
              const pDetail =
                response.data.product || response.data.data || response.data;
              if (!pDetail) return;
              const baseP = groupedProductsMap[pDetail.ma_san_pham];
              if (!baseP) return;

              const vArray =
                pDetail.chi_tiet_bien_the ||
                pDetail.bien_the ||
                pDetail.variants ||
                pDetail.bien_the_san_pham ||
                [];
              if (vArray.length > 0) {
                vArray.forEach((v) => {
                  flatVariants.push({
                    ma_san_pham: baseP.ma_san_pham,
                    ten_san_pham: baseP.ten_san_pham,
                    hinh_anh: v.hinh_anh || baseP.hinh_anh_chinh,
                    ma_bien_the: v.ma_bien_the,
                    ten_bien_the:
                      v.ten_bien_the ||
                      `${v.mau_sac || ""} ${v.kich_thuoc || ""}`.trim() ||
                      "Biến thể",
                    gia_goc:
                      v.gia_ban_le ||
                      v.gia_ban ||
                      baseP.gia_ban_le ||
                      baseP.gia_ban_thap_nhat ||
                      0,
                    ton_kho_goc: v.so_luong_ton || v.ton_kho || 0,
                    sku: v.sku || "",
                  });
                });
              }
            }
          });
        }
      }
      return flatVariants;
    } catch (error) {
      console.error("Lỗi tải danh sách sản phẩm:", error);
      return [];
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);

      const allProducts = await fetchProductsForSelection();
      setAvailableProducts(allProducts);

      // YÊU CẦU 1: Lấy danh sách các biến thể đang có Sale để CHẶN (Block)
      try {
        const activeRes = await promotionApi.get("/client/flash-sale/active");
        if (activeRes.data.success) {
          const activePromos = activeRes.data.data;
          const busySet = new Set();

          activePromos.forEach((promo) => {
            // 🌟 QUAN TRỌNG: NẾU ĐANG Ở CHẾ ĐỘ EDIT, THÌ KHÔNG BLOCK CÁC SẢN PHẨM CỦA CHÍNH ĐỢT SALE NÀY!
            if (isEditMode && promo.chuong_trinh.ma_khuyen_mai === id) return;

            promo.products.forEach((p) => {
              busySet.add(p.chi_tiet_bien_the[0].ma_bien_the);
            });
          });
          setBusyVariants(busySet);
        }
      } catch (e) {
        console.warn("Không lấy được danh sách Sale đang chạy", e);
      }

      // 🌟 NẾU LÀ CHẾ ĐỘ CHỈNH SỬA, LẤY DỮ LIỆU CŨ TỪ BACKEND ĐỔ VÀO FORM
      if (isEditMode) {
        try {
          const res = await promotionApi.get(`/admin/flash-sale/${id}`);

          if (res.data.success) {
            const { chuong_trinh, products } = res.data.data;

            const formatTime = (timeStr) => {
              if (!timeStr) return "";
              const date = new Date(timeStr);
              const offset = date.getTimezoneOffset() * 60000;
              return new Date(date - offset).toISOString().slice(0, 16);
            };

            setCampaignInfo({
              ten_chuong_trinh: chuong_trinh.ten_chuong_trinh,
              mo_ta: chuong_trinh.mo_ta || "",
              thoi_gian_bat_dau: formatTime(chuong_trinh.thoi_gian_bat_dau),
              thoi_gian_ket_thuc: formatTime(chuong_trinh.thoi_gian_ket_thuc),
            });

            if (products && products.length > 0) {
              const oldSelectedItems = products.map((item) => {
                const productBase =
                  allProducts.find(
                    (p) => String(p.ma_bien_the) === String(item.ma_bien_the),
                  ) || {};
                return {
                  ma_san_pham: item.ma_san_pham,
                  ten_san_pham:
                    productBase.ten_san_pham || `Sản phẩm ${item.ma_san_pham}`,
                  hinh_anh: productBase.hinh_anh || "",
                  ma_bien_the: item.ma_bien_the,
                  ten_bien_the: productBase.ten_bien_the || "Mặc định",
                  gia_goc: productBase.gia_goc || 0,
                  ton_kho_goc: productBase.ton_kho_goc || 0,
                  sku: productBase.sku || "",
                  gia_khuyen_mai: item.gia_khuyen_mai,
                  phan_tram_giam: "",
                  loai_giam_gia: "price",
                  so_luong_gioi_han: item.so_luong_gioi_han,
                };
              });
              setSelectedItems(oldSelectedItems);
            }
          }
        } catch (error) {
          console.error("Lỗi khi load dữ liệu Edit:", error);
          alert("Không thể tải thông tin chiến dịch.");
          navigate("/admin/promotions/danh-sach");
        }
      }
      setInitialLoading(false);
    };

    initializeData();
  }, [id, isEditMode, navigate]);

  const handleAddItem = (variant) => {
    if (busyVariants.has(variant.ma_bien_the)) {
      alert(
        "Sản phẩm này đang tham gia một chương trình khuyến mãi khác. Vui lòng chọn sản phẩm khác!",
      );
      return;
    }

    const isExist = selectedItems.find(
      (item) => item.ma_bien_the === variant.ma_bien_the,
    );
    if (!isExist) {
      setSelectedItems([
        ...selectedItems,
        {
          ...variant,
          gia_khuyen_mai: "",
          phan_tram_giam: "",
          loai_giam_gia: null,
          so_luong_gioi_han: 0,
        },
      ]);
      setSearchKeyword("");
    }
  };

  const handleRemoveItem = (ma_bien_the) => {
    setSelectedItems(
      selectedItems.filter((item) => item.ma_bien_the !== ma_bien_the),
    );
  };

  const handleUpdateItemData = (ma_bien_the, field, value) => {
    const newItems = selectedItems.map((item) => {
      if (item.ma_bien_the === ma_bien_the) {
        let updatedItem = { ...item };
        const numValue = Number(value);

        if (field === "so_luong_gioi_han") {
          updatedItem.so_luong_gioi_han =
            numValue > item.ton_kho_goc ? item.ton_kho_goc : numValue;
        }

        if (field === "gia_khuyen_mai") {
          updatedItem.loai_giam_gia = "price";
          updatedItem.gia_khuyen_mai = numValue;
          updatedItem.phan_tram_giam = "";
        }

        if (field === "phan_tram_giam") {
          let percent = numValue > 100 ? 100 : numValue < 0 ? 0 : numValue;
          updatedItem.loai_giam_gia = "percent";
          updatedItem.phan_tram_giam = percent;
          let calculatedPrice = item.gia_goc - (item.gia_goc * percent) / 100;
          updatedItem.gia_khuyen_mai =
            calculatedPrice < 1000 ? 1000 : calculatedPrice;
        }

        if (field === "reset_discount") {
          updatedItem.loai_giam_gia = null;
          updatedItem.gia_khuyen_mai = "";
          updatedItem.phan_tram_giam = "";
        }

        return updatedItem;
      }
      return item;
    });
    setSelectedItems(newItems);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để giảm giá!");
      return;
    }

    const hasEmptyPrice = selectedItems.some(
      (item) => item.gia_khuyen_mai === "",
    );
    if (hasEmptyPrice) {
      alert("Vui lòng thiết lập giá khuyến mãi cho tất cả sản phẩm đã chọn!");
      return;
    }

    // YÊU CẦU 2: Validate cứng trước khi gửi API
    if (hasPriceError) {
      alert(
        "Có sản phẩm đang set giá Khuyến mãi LỚN HƠN hoặc BẰNG giá gốc. Vui lòng kiểm tra lại (được bôi đỏ).",
      );
      return;
    }

    try {
      setLoading(true);

      const itemsPayload = selectedItems.map((item) => ({
        ma_san_pham: item.ma_san_pham,
        ma_bien_the: item.ma_bien_the,
        gia_khuyen_mai: item.gia_khuyen_mai,
        so_luong_gioi_han: item.so_luong_gioi_han,
      }));

      // 🌟 TẠO PAYLOAD RIÊNG ĐỂ ÉP MÚI GIỜ CHO CHIẾN DỊCH
      const payloadCampaign = {
        ...campaignInfo,
        thoi_gian_bat_dau: new Date(
          campaignInfo.thoi_gian_bat_dau,
        ).toISOString(),
        thoi_gian_ket_thuc: new Date(
          campaignInfo.thoi_gian_ket_thuc,
        ).toISOString(),
      };

      // NẾU ĐANG Ở CHẾ ĐỘ CHỈNH SỬA -> GỌI API PUT
      if (isEditMode) {
        // Dùng payloadCampaign thay vì campaignInfo
        await promotionApi.put(`/admin/flash-sale/${id}`, payloadCampaign);
        await promotionApi.post(`/admin/flash-sale/${id}/items`, {
          items: itemsPayload,
        });
        alert("Cập nhật chương trình giảm giá thành công!");
      }
      // NẾU TẠO MỚI -> GỌI API POST
      else {
        // Dùng payloadCampaign thay vì campaignInfo
        const createRes = await promotionApi.post(
          "/admin/flash-sale",
          payloadCampaign,
        );
        if (createRes.data.success) {
          const newPromoId = createRes.data.data.ma_khuyen_mai;
          await promotionApi.post(`/admin/flash-sale/${newPromoId}/items`, {
            items: itemsPayload,
          });
          alert("Tạo chương trình giảm giá thành công!");
        }
      }

      navigate("/admin/promotions");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Lỗi khi lưu chương trình! (Có thể sản phẩm đang bị trùng giờ)",
      );
    } finally {
      setLoading(false);
    }
  };

  const searchKeywordNormalized = removeVietnameseTones(searchKeyword);
  const filteredProducts = availableProducts.filter((p) => {
    const nameNormalized = removeVietnameseTones(p.ten_san_pham);
    const skuNormalized = p.sku ? removeVietnameseTones(p.sku) : "";
    return (
      nameNormalized.includes(searchKeywordNormalized) ||
      skuNormalized.includes(searchKeywordNormalized)
    );
  });

  if (initialLoading) {
    return (
      <div className="w-full text-center py-20 text-gray-500">
        Đang tải dữ liệu chiến dịch...
      </div>
    );
  }

  return (
    <div className="w-full text-gray-800 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/promotions"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {isEditMode ? "Chỉnh Sửa Chiến Dịch" : "Tạo Chiến Dịch Mới"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode
                ? "Cập nhật thông tin và danh sách sản phẩm."
                : "Thiết lập thông tin và chọn sản phẩm áp dụng giảm giá."}
            </p>
          </div>
        </div>
        <button
          onClick={handleSaveCampaign}
          disabled={loading || hasPriceError}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
            loading || hasPriceError
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#007A5A] hover:bg-[#006349] text-white"
          }`}
        >
          <Save size={18} />{" "}
          {loading ? "Đang lưu..." : isEditMode ? "Cập Nhật" : "Lưu Chiến Dịch"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#007A5A]">
              <Tag size={18} />
              <h2 className="font-bold text-sm uppercase">Thông tin cơ bản</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Tên chương trình *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Siêu Sale Giữa Tháng..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#007A5A] focus:outline-none font-bold"
                  value={campaignInfo.ten_chuong_trinh}
                  onChange={(e) =>
                    setCampaignInfo({
                      ...campaignInfo,
                      ten_chuong_trinh: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Mô tả hiển thị
                </label>
                <textarea
                  rows="3"
                  placeholder="Nhập mô tả ngắn gọn..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#007A5A] focus:outline-none resize-none font-medium text-gray-600"
                  value={campaignInfo.mo_ta}
                  onChange={(e) =>
                    setCampaignInfo({ ...campaignInfo, mo_ta: e.target.value })
                  }
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[#007A5A]">
              <Calendar size={18} />
              <h2 className="font-bold text-sm uppercase">Thời gian áp dụng</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Bắt đầu lúc *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#007A5A] focus:outline-none font-medium"
                  value={campaignInfo.thoi_gian_bat_dau}
                  onChange={(e) =>
                    setCampaignInfo({
                      ...campaignInfo,
                      thoi_gian_bat_dau: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Kết thúc lúc *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#007A5A] focus:outline-none font-medium"
                  value={campaignInfo.thoi_gian_ket_thuc}
                  onChange={(e) =>
                    setCampaignInfo({
                      ...campaignInfo,
                      thoi_gian_ket_thuc: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm uppercase mb-4 text-gray-800">
              1. Chọn sản phẩm / Biến thể tham gia
            </h2>
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Gõ tên sản phẩm hoặc mã SKU không dấu để tìm kiếm..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#007A5A] transition-colors"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            {searchKeyword.trim() !== "" && (
              <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 flex flex-col gap-2 custom-scrollbar">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, idx) => {
                    const isBusy = busyVariants.has(product.ma_bien_the);

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg border shadow-sm ${isBusy ? "bg-orange-50 border-orange-100 opacity-60" : "bg-white border-gray-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.hinh_anh ||
                              "https://via.placeholder.com/50"
                            }
                            alt=""
                            className="w-10 h-10 rounded-md object-cover border border-gray-100"
                          />
                          <div>
                            <p className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                              {product.ten_san_pham}
                              {isBusy && (
                                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">
                                  Đang Sale
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                              {product.sku && (
                                <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                  SKU: {product.sku}
                                </span>
                              )}
                              <span>
                                Phân loại:{" "}
                                <span className="font-semibold text-[#007A5A]">
                                  {product.ten_bien_the}
                                </span>{" "}
                                | Kho: {product.ton_kho_goc}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddItem(product)}
                          disabled={isBusy}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isBusy ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-gray-400 py-4">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm uppercase text-gray-800">
                2. Cấu hình Giá & Kho chiến dịch
              </h2>
              <span className="text-xs font-bold text-[#007A5A] bg-[#e6f0ed] px-3 py-1 rounded-full">
                Đã chọn {selectedItems.length} SKU
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <AlertCircle className="text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400 font-medium">
                  Chưa có sản phẩm nào được chọn.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-gray-500">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-gray-500 text-right">
                        Giá Gốc (đ)
                      </th>
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-blue-600 text-center">
                        Giảm %
                      </th>
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-[#007A5A] text-center">
                        Giá Sau Giảm (đ)
                      </th>
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-orange-600 text-center">
                        Kho Sale
                      </th>
                      <th className="px-3 py-3 font-bold text-[11px] uppercase text-center text-gray-500">
                        Bỏ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => {
                      const isPriceError =
                        item.gia_khuyen_mai !== "" &&
                        Number(item.gia_khuyen_mai) >= Number(item.gia_goc);

                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-50 hover:bg-gray-50/50 ${isPriceError ? "bg-red-50/50" : ""}`}
                        >
                          <td className="px-3 py-3">
                            <p
                              className="font-bold text-[12px] text-gray-800 truncate max-w-[120px]"
                              title={item.ten_san_pham}
                            >
                              {item.ten_san_pham}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {item.sku && (
                                <span className="text-[10px] text-gray-600 font-mono bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">
                                  {item.sku}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {item.ten_bien_the}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-gray-400 line-through text-[12px] font-bold">
                            {Number(item.gia_goc).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              placeholder="%"
                              className="w-16 border border-blue-200 rounded-lg px-2 py-1.5 text-[13px] font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:opacity-50"
                              value={item.phan_tram_giam}
                              disabled={item.loai_giam_gia === "price"}
                              onChange={(e) =>
                                handleUpdateItemData(
                                  item.ma_bien_the,
                                  "phan_tram_giam",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  placeholder="Giá giảm"
                                  className={`w-24 border rounded-lg px-2 py-1.5 text-[13px] font-bold focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:opacity-50 ${isPriceError ? "border-red-400 text-red-600 focus:ring-red-500/20" : "border-emerald-200 text-[#007A5A] focus:ring-emerald-500/20"}`}
                                  value={item.gia_khuyen_mai}
                                  disabled={item.loai_giam_gia === "percent"}
                                  onChange={(e) =>
                                    handleUpdateItemData(
                                      item.ma_bien_the,
                                      "gia_khuyen_mai",
                                      e.target.value,
                                    )
                                  }
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateItemData(
                                      item.ma_bien_the,
                                      "reset_discount",
                                      "",
                                    )
                                  }
                                  title="Nhập lại cách giảm"
                                  className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              </div>
                              {isPriceError && (
                                <span className="text-[10px] text-red-500 font-bold">
                                  * Phải nhỏ hơn giá gốc
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                placeholder="0"
                                className="w-16 border border-orange-200 rounded-lg px-2 py-1.5 text-[13px] font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                value={item.so_luong_gioi_han}
                                max={item.ton_kho_goc}
                                onChange={(e) =>
                                  handleUpdateItemData(
                                    item.ma_bien_the,
                                    "so_luong_gioi_han",
                                    e.target.value,
                                  )
                                }
                              />
                              <span className="text-[9px] text-gray-400 mt-0.5 font-bold">
                                Tồn gốc: {item.ton_kho_goc}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.ma_bien_the)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
