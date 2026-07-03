import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

// HÀM LOẠI BỎ DẤU TIẾNG VIỆT ĐỂ TÌM KIẾM
const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
};

export default function TaoGiamGia() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [campaignInfo, setCampaignInfo] = useState({
    ten_chuong_trinh: "",
    mo_ta: "",
    thoi_gian_bat_dau: "",
    thoi_gian_ket_thuc: "",
  });

  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Lấy danh sách sản phẩm và bóc tách TOÀN BỘ biến thể (Bao gồm Tải bù & Khớp đúng tên cột DB)
  useEffect(() => {
    const fetchProductsForSelection = async () => {
      try {
        const res = await productApi.get("/products?role=admin&limit=100");

        if (res.data && res.data.products) {
          const flatVariants = [];
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
            const detailPromises = groupedProductIds.map((id) =>
              productApi.get(`/products/${id}?role=admin`).catch(() => null),
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

          setAvailableProducts(flatVariants);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
      }
    };

    fetchProductsForSelection();
  }, []);

  const handleAddItem = (variant) => {
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

    const hasEmptyPrice = selectedItems.some((item) => !item.gia_khuyen_mai);
    if (hasEmptyPrice) {
      alert("Vui lòng thiết lập giá khuyến mãi cho tất cả sản phẩm đã chọn!");
      return;
    }

    try {
      setLoading(true);
      const createRes = await promotionApi.post(
        "/admin/flash-sale",
        campaignInfo,
      );

      if (createRes.data.success) {
        const newPromoId = createRes.data.data.ma_khuyen_mai;
        const itemsPayload = selectedItems.map((item) => ({
          ma_san_pham: item.ma_san_pham,
          ma_bien_the: item.ma_bien_the,
          gia_khuyen_mai: item.gia_khuyen_mai,
          so_luong_gioi_han: item.so_luong_gioi_han,
        }));

        await promotionApi.post(`/admin/flash-sale/${newPromoId}/items`, {
          items: itemsPayload,
        });

        alert("Tạo chương trình giảm giá thành công!");
        navigate("/admin/promotions/danh-sach");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi khi lưu chương trình!");
    } finally {
      setLoading(false);
    }
  };

  const searchKeywordNormalized = removeVietnameseTones(
    searchKeyword.toLowerCase(),
  );
  const filteredProducts = availableProducts.filter((p) => {
    const nameNormalized = removeVietnameseTones(p.ten_san_pham.toLowerCase());
    const skuNormalized = p.sku
      ? removeVietnameseTones(p.sku.toLowerCase())
      : "";
    return (
      nameNormalized.includes(searchKeywordNormalized) ||
      skuNormalized.includes(searchKeywordNormalized)
    );
  });

  return (
    <div className="w-full text-gray-800 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/promotions/danh-sach"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Tạo Chiến Dịch Mới
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Thiết lập thông tin và chọn sản phẩm áp dụng giảm giá.
            </p>
          </div>
        </div>
        <button
          onClick={handleSaveCampaign}
          disabled={loading}
          className="bg-[#007A5A] hover:bg-[#006349] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save size={18} /> {loading ? "Đang lưu..." : "Lưu Chiến Dịch"}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#007A5A] focus:outline-none"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#007A5A] focus:outline-none resize-none"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#007A5A] focus:outline-none"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#007A5A] focus:outline-none"
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
                  filteredProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            product.hinh_anh || "https://via.placeholder.com/50"
                          }
                          alt=""
                          className="w-10 h-10 rounded-md object-cover border border-gray-100"
                        />
                        <div>
                          <p className="text-[13px] font-bold text-gray-800">
                            {product.ten_san_pham}
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
                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))
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
                    {selectedItems.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
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
                        <td className="px-3 py-3 text-right text-gray-400 line-through text-[12px]">
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
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              placeholder="Giá giảm"
                              className="w-24 border border-emerald-200 rounded-lg px-2 py-1.5 text-[13px] font-bold text-[#007A5A] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-gray-100 disabled:opacity-50"
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
                            <span className="text-[9px] text-gray-400 mt-0.5">
                              Tồn: {item.ton_kho_goc}
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
                    ))}
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
