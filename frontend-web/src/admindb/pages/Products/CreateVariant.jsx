import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Layers,
  Tag,
  DollarSign,
  Package,
  FileText,
  CheckCircle,
  Edit3,
} from "lucide-react";
import axios from "axios";

export default function AdminCreateVariant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);

  // --- STATE LƯU THÔNG TIN THƯƠNG MẠI BIẾN THỂ ---
  const [sku, setEditSku] = useState("");
  const [price, setEditPrice] = useState(0);
  const [stock, setEditStock] = useState(0);
  const [unit, setEditUnit] = useState("Chai");
  const [variantName, setEditVariantName] = useState("");
  const [saving, setSaving] = useState(false);

  // --- STATE LƯU DANH SÁCH CÁC BIẾN THỂ ĐÃ CÓ TRONG DB ---
  const [existingVariants, setExistingVariants] = useState([]);

  // --- STATE MA TRẬN THUỘC TÍNH ĐỘNG (EAV MATRIX MANAGER) ---
  const [availableAttributes, setAvailableAttributes] = useState([]);

  // State hỗ trợ form thêm nhanh thuộc tính/giá trị mới
  const [newAttrName, setNewAttrName] = useState("");
  const [newValInputs, setNewValInputs] = useState({});

  useEffect(() => {
    const fetchAllMetadata = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

        const [productResponse, matrixResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/products/${id}`),
          axios
            .get(`${apiUrl}/api/products/attributes/matrix`)
            .catch(() => ({ data: [] })),
        ]);

        let currentProductTitle = "Sản phẩm gốc";
        if (productResponse.data) {
          const data = Array.isArray(productResponse.data)
            ? productResponse.data[0]
            : productResponse.data;
          currentProductTitle = data.ten_san_pham || "Sản phẩm gốc";
          setProductName(currentProductTitle);

          // 🟢 Ưu tiên lấy variants từ location.state (trang Detail truyền sang), nếu không có mới lấy từ API
          if (location.state?.existingVariants) {
            setExistingVariants(location.state.existingVariants);
          } else if (data.bien_the && data.bien_the.length > 0) {
            setExistingVariants(data.bien_the);
          }
        }

        if (matrixResponse.data && matrixResponse.data.length > 0) {
          setAvailableAttributes(matrixResponse.data);
          const comboText = matrixResponse.data
            .map((attr) => attr.selected)
            .filter(Boolean)
            .join(" - ");
          setEditVariantName(`${currentProductTitle} - ${comboText}`);
        } else {
          const fallbackMock = [
            {
              id: 1,
              name: "Vị",
              values: ["Đào cam sả", "Ô long xoài"],
              selected: "Đào cam sả",
            },
            {
              id: 2,
              name: "Dung tích",
              values: ["350ml", "450ml", "455ml"],
              selected: "450ml",
            },
            {
              id: 3,
              name: "Quy chuẩn",
              values: ["Chai", "Thùng"],
              selected: "Chai",
            },
          ];
          setAvailableAttributes(fallbackMock);
          const comboText = fallbackMock
            .map((attr) => attr.selected)
            .filter(Boolean)
            .join(" - ");
          setEditVariantName(`${currentProductTitle} - ${comboText}`);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ cấu hình dữ liệu ma trận:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetadata();
  }, [id, location.state]);

  const updateVariantNameSuggestion = (productTitle, updatedAttributes) => {
    const comboText = updatedAttributes
      .map((attr) => attr.selected)
      .filter(Boolean)
      .join(" - ");
    setEditVariantName(`${productTitle} ${comboText ? `- ${comboText}` : ""}`);
  };

  const handleSelectAttribute = (attrId, value) => {
    const updated = availableAttributes.map((attr) =>
      attr.id === attrId ? { ...attr, selected: value } : attr,
    );
    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
  };

  const handleAddNewValueToAttribute = (attrId) => {
    const valueText = newValInputs[attrId]?.trim();
    if (!valueText) return;

    const updated = availableAttributes.map((attr) => {
      if (attr.id === attrId) {
        if (attr.values.includes(valueText)) {
          alert("Giá trị này đã tồn tại trong ma trận!");
          return attr;
        }
        return {
          ...attr,
          values: [...attr.values, valueText],
          selected: valueText,
        };
      }
      return attr;
    });

    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
    setNewValInputs((prev) => ({ ...prev, [attrId]: "" }));
  };

  const handleCreateNewAttributeGroup = () => {
    const groupName = newAttrName.trim();
    if (!groupName) return;

    if (
      availableAttributes.some(
        (a) => a.name.toLowerCase() === groupName.toLowerCase(),
      )
    ) {
      return alert("Nhóm thuộc tính này đã tồn tại trên ma trận liên kết!");
    }

    const newGroup = {
      id: Date.now().toString(),
      name: groupName,
      values: [],
      selected: "",
    };
    setAvailableAttributes([...availableAttributes, newGroup]);
    setNewAttrName("");
  };

  const handleRemoveAttributeGroup = (attrId) => {
    const updated = availableAttributes.filter((a) => a.id !== attrId);
    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
  };

  // ==============================================================================
  // 🟢 1. BỘ LỌC TÌM CÁC THUỘC TÍNH ĐÃ ĐƯỢC SỬ DỤNG TRONG DATABASE
  // ==============================================================================
  const usedAttributesMap = useMemo(() => {
    const map = {};
    existingVariants.forEach((variant) => {
      if (variant.thuoc_tinh) {
        Object.entries(variant.thuoc_tinh).forEach(([key, val]) => {
          if (!map[key]) map[key] = new Set();
          map[key].add(val);
        });
      }
    });
    return map;
  }, [existingVariants]);

  // ==============================================================================
  // 🟢 HÀM KIỂM TRA ĐỘNG: TỔ HỢP GIẢ ĐỊNH CÓ TỒN TẠI TRONG DB KHÔNG?
  // (Xử lý vụ thêm Nhóm mới hoặc chọn "Lon" thì các nút khác phải mờ đi)
  // ==============================================================================
  const checkComboExists = (groupName, value) => {
    // 1. Rút trích tổ hợp giả định nếu user click vào nút này
    const hypotheticalSelection = {};
    availableAttributes.forEach((attr) => {
      if (attr.name === groupName) {
        hypotheticalSelection[attr.name] = value; // Giá trị của chính nút đang xét
      } else if (attr.selected) {
        hypotheticalSelection[attr.name] = attr.selected; // Giữ nguyên các lựa chọn ở nhóm khác
      }
    });

    // 2. Đối chiếu với Database
    return existingVariants.some((variant) => {
      if (!variant.thuoc_tinh) return false;

      // ĐIỀU KIỆN 1: Bắt buộc biến thể trong DB phải có đủ số lượng key như cấu hình UI hiện tại.
      // -> Điều kiện này làm cho TẤT CẢ các nút cũ mờ đi ngay khi bạn vừa tạo nhóm "Khối lượng tịnh"
      if (Object.keys(variant.thuoc_tinh).length !== availableAttributes.length)
        return false;

      // ĐIỀU KIỆN 2: Bắt buộc tất cả các key giả định phải khớp hoàn toàn với DB
      return Object.entries(hypotheticalSelection).every(
        ([k, v]) => variant.thuoc_tinh[k] === v,
      );
    });
  };

  // ==============================================================================
  // 🟢 THUẬT TOÁN KIỂM TRA CHÉO (CROSS-CHECK) TỰ ĐỘNG
  // ==============================================================================
  const matchedVariant = useMemo(() => {
    // 1. Rút trích các thuộc tính đang chọn thành 1 object: { "Vị": "Đào", "Dung tích": "350ml" }
    const currentSelection = availableAttributes.reduce((acc, attr) => {
      if (attr.selected) acc[attr.name] = attr.selected;
      return acc;
    }, {});

    if (Object.keys(currentSelection).length === 0) return null;

    // 2. Tìm kiếm trong danh sách biến thể hiện có
    return existingVariants.find((variant) => {
      if (!variant.thuoc_tinh) return false;

      // Kiểm tra xem MỌI key đang chọn có tồn tại và khớp giá trị trong biến thể cũ hay không
      const isMatch = Object.keys(currentSelection).every(
        (key) => variant.thuoc_tinh[key] === currentSelection[key],
      );

      // Đồng thời số lượng key phải bằng nhau (Tránh trường hợp chọn 2 key khớp với loại có 3 key)
      const isExactLength =
        Object.keys(currentSelection).length ===
        Object.keys(variant.thuoc_tinh).length;

      return isMatch && isExactLength;
    });
  }, [availableAttributes, existingVariants]);

  // 🟢 TỰ ĐỘNG ĐIỀN DỮ LIỆU CŨ VÀO FORM KHI PHÁT HIỆN TRÙNG LẶP
  useEffect(() => {
    if (matchedVariant) {
      setEditSku(matchedVariant.sku || "");
      setEditPrice(matchedVariant.gia_ban_le || 0);
      setEditStock(matchedVariant.ton_kho || matchedVariant.so_luong_ton || 0);
      setEditUnit(matchedVariant.ten_don_vi || "Chai");
    } else {
      // Nếu là tổ hợp mới tinh, reset lại ô nhập
      setEditSku("");
      setEditPrice(0);
      setEditStock(0);
      setEditUnit("Chai");
    }
  }, [matchedVariant]);

  // ==============================================================================
  // 🟢 3. TỰ ĐỘNG TÌM & CHỌN TỔ HỢP CÒN THIẾU
  // ==============================================================================
  const handleSuggestMissingCombination = () => {
    const keys = availableAttributes.map((a) => a.name);
    const valuesArrays = availableAttributes.map((a) => a.values);

    const getCombinations = (arrays) => {
      if (arrays.length === 0) return [[]];
      let res = [];
      let rest = getCombinations(arrays.slice(1));
      for (let val of arrays[0]) {
        for (let r of rest) {
          res.push([val, ...r]);
        }
      }
      return res;
    };

    const allPossibleCombos = getCombinations(valuesArrays);
    let missingCombo = null;

    for (let combo of allPossibleCombos) {
      const comboObj = {};
      keys.forEach((k, idx) => {
        comboObj[k] = combo[idx];
      });

      const existsInDB = existingVariants.some((variant) => {
        if (!variant.thuoc_tinh) return false;
        return keys.every((k) => variant.thuoc_tinh[k] === comboObj[k]);
      });

      if (!existsInDB) {
        missingCombo = comboObj;
        break;
      }
    }

    if (missingCombo) {
      const updated = availableAttributes.map((attr) => ({
        ...attr,
        selected: missingCombo[attr.name] || attr.selected,
      }));
      setAvailableAttributes(updated);
      updateVariantNameSuggestion(productName, updated);
      setEditSku("");
      setEditPrice(0);
      setEditStock(0);
    } else {
      alert("✨ Tuyệt vời! Bạn đã tạo ĐẦY ĐỦ tất cả các tổ hợp có thể có.");
    }
  };

  // ==============================================================================
  // XỬ LÝ LƯU (CREATE HOẶC UPDATE) TÙY THEO CHẾ ĐỘ
  // ==============================================================================
  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!sku.trim()) return alert("Vui lòng điền mã định danh SKU!");
    if (price <= 0) return alert("Vui lòng nhập giá niêm yết lớn hơn 0đ!");

    setSaving(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      const payload = {
        ma_san_pham: id,
        ten_bien_the: variantName,
        sku: sku.trim().toUpperCase(),
        gia_ban_le: price,
        so_luong_ton: stock,
        ten_don_vi: unit,
        thuoc_tinh: availableAttributes.reduce((acc, attr) => {
          if (attr.selected) acc[attr.name] = attr.selected;
          return acc;
        }, {}),
      };

      if (matchedVariant) {
        // 🟢 NẾU LÀ CẬP NHẬT (GỌI API PUT)
        await axios.put(
          `${apiUrl}/api/variants/${matchedVariant.ma_bien_the}`,
          payload,
        );
        alert(`💾 Đã cập nhật thành công biến thể [${matchedVariant.sku}]`);
      } else {
        // 🟢 NẾU LÀ TẠO MỚI (GỌI API POST)
        await axios.post(`${apiUrl}/api/products/${id}/variants`, payload);
        alert(
          "🎉 Đã khởi tạo và đấu nối biến thể mới thành công vào Database!",
        );
      }

      navigate(-1);
    } catch (err) {
      console.error("Lỗi xử lý biến thể:", err);
      alert("Gặp sự cố khi lưu biến thể xuống DB. Vui lòng kiểm tra lại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang
          nạp cấu trúc dữ liệu ma trận...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#006c49] hover:text-white transition shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {matchedVariant ? "Cập nhật biến thể" : "Thêm biến thể mới"}
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              Sản phẩm cha:{" "}
              <span className="text-[#006c49]">{productName}</span>
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSaveVariant}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl"
      >
        {/* CỘT TRÁI: CHỌN TAG LIÊN KẾT */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Tag size={16} className="text-amber-500" /> Bước 1: Thiết lập ma
              trận EAV liên kết
            </h3>

            <div className="space-y-5">
              {availableAttributes.map((attr) => (
                <div
                  key={attr.id}
                  className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 relative group/box"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                      👑 Nhóm: {attr.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttributeGroup(attr.id)}
                      className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover/box:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {attr.values &&
                      attr.values.map((val) => {
                        const isSelected = attr.selected === val;
                        const isGloballyUsed =
                          usedAttributesMap[attr.name]?.has(val);
                        // Gọi hàm kiểm tra động vừa tạo ở Bước 1
                        const isComboValid = checkComboExists(attr.name, val);

                        return (
                          <button
                            type="button"
                            key={val}
                            onClick={() => handleSelectAttribute(attr.id, val)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border relative overflow-hidden ${
                              isSelected
                                ? "bg-[#006c49] text-white border-[#006c49] shadow-md scale-105" // Nút đang chọn -> Luôn sáng màu xanh
                                : isComboValid
                                  ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-sm" // Tổ hợp hợp lệ -> Sáng màu viền liền
                                  : "bg-slate-50 text-slate-400 border-dashed border-slate-300 hover:bg-white hover:border-[#006c49] hover:text-[#006c49] opacity-70" // KHÔNG TỒN TẠI (Thêm nhóm mới / Chọn Lon) -> Mờ đi, viền đứt nét
                            }`}
                          >
                            {val}

                            {/* Chấm vàng báo hiệu đây là một TỪ KHÓA MỚI TINH, chưa từng có trong DB */}
                            {!isGloballyUsed && !isSelected && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white"></span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Thêm nhanh giá trị ${attr.name}...`}
                      value={newValInputs[attr.id] || ""}
                      onChange={(e) =>
                        setNewValInputs({
                          ...newValInputs,
                          [attr.id]: e.target.value,
                        })
                      }
                      className="flex-1 bg-white border border-gray-200 focus:border-[#006c49] px-2.5 py-1 rounded-lg text-[11px] font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewValueToAttribute(attr.id)}
                      className="bg-slate-100 hover:bg-[#006c49] hover:text-white p-1.5 rounded-lg border border-gray-200 transition flex items-center justify-center text-slate-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 🟢 NÚT MAGIC TỰ ĐỘNG TÌM TỔ HỢP CÒN THIẾU */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSuggestMissingCombination}
                className="w-full bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Layers size={16} />
                Hệ thống tự động tìm & điền cấu hình còn thiếu
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                ✨ Khởi tạo nhóm thuộc tính mới
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: Màu sắc, Khối lượng..."
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] px-3 py-2 rounded-xl text-xs font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateNewAttributeGroup}
                  className="bg-[#006c49] text-white px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 hover:bg-[#005137] transition shrink-0"
                >
                  <Plus size={14} /> Tạo nhóm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: NHẬP GIÁ MỚI & XEM TRƯỚC MA TRẬN GIÁ CŨ */}
        <div className="lg:col-span-7 space-y-6">
          {/* 🟢 HIỂN THỊ CẢNH BÁO NẾU PHÁT HIỆN TRÙNG LẶP */}
          {matchedVariant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
            >
              <Edit3 size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-blue-900">
                  Phiên bản này đã tồn tại trong hệ thống!
                </h4>
                <p className="text-xs font-medium text-blue-700 mt-1">
                  Hệ thống đã tự động chuyển sang chế độ{" "}
                  <b className="font-black">Cập nhật (Update)</b>. Các thông tin
                  cũ đã được điền sẵn bên dưới để bạn dễ dàng chỉnh sửa.
                </p>
              </div>
            </motion.div>
          )}

          <div
            className={`bg-white rounded-3xl border p-6 shadow-sm space-y-5 transition-colors ${matchedVariant ? "border-blue-200" : "border-gray-200/80"}`}
          >
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layers
                size={16}
                className={matchedVariant ? "text-blue-600" : "text-[#006c49]"}
              />{" "}
              Bước 2: Thông số thương mại của phiên bản mới
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase">
                  Tên hiển thị phiên bản mới
                </label>
                <input
                  type="text"
                  required
                  value={variantName}
                  onChange={(e) => setEditVariantName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-bold text-slate-800 outline-none p-3 rounded-xl text-xs transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                    <FileText size={12} /> Mã định danh SKU
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CZ-NEW-SKU"
                    value={sku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-amber-500 font-mono font-black text-amber-800 uppercase outline-none p-3 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                    <DollarSign size={12} /> Giá bán lẻ định biên (đ)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                    <Package size={12} /> Số lượng nhập kho ban đầu
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase">
                    Quy chuẩn đóng gói
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-bold text-slate-800 outline-none p-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    <option value="Chai">Chai lẻ</option>
                    <option value="Thùng">Thùng đóng gói</option>
                    <option value="Hộp">Hộp giấy</option>
                    <option value="Gói">Gói lẻ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className={`font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 text-white ${
                  matchedVariant
                    ? "bg-blue-600 hover:bg-blue-800"
                    : "bg-[#006c49] hover:bg-[#004f36]"
                }`}
              >
                <Save size={15} />
                {saving
                  ? "Đang lưu..."
                  : matchedVariant
                    ? "Cập nhật phiên bản"
                    : "Kích hoạt tạo biến thể"}
              </button>
            </div>
          </div>

          {/* BẢNG MA TRẬN ĐỐI CHIẾU */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
              📊 Bảng đối chiếu ma trận định giá hiện hành (Existing Pricing
              Matrix)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Mã SKU</th>
                    <th className="py-2.5 px-2">Tên phiên bản hiện tại</th>
                    <th className="py-2.5 px-2 font-mono text-right">
                      Giá niêm yết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-slate-700">
                  {existingVariants.length > 0 ? (
                    existingVariants.map((v, index) => {
                      // Bôi màu highlight cho dòng đang trùng khớp
                      const isHighlighted =
                        matchedVariant?.ma_bien_the === v.ma_bien_the;

                      return (
                        <tr
                          key={index}
                          className={`transition ${isHighlighted ? "bg-blue-50/70" : "hover:bg-slate-50/80"}`}
                        >
                          <td
                            className={`py-3 px-2 font-mono ${isHighlighted ? "text-blue-700" : "text-amber-700"}`}
                          >
                            {v.sku} {isHighlighted && "📍"}
                          </td>
                          <td
                            className={`py-3 px-2 ${isHighlighted ? "text-blue-900" : "text-slate-900"}`}
                          >
                            {v.ten_bien_the}
                          </td>
                          <td
                            className={`py-3 px-2 font-mono text-right ${isHighlighted ? "text-blue-900" : "text-slate-900"}`}
                          >
                            {Number(v.gia_ban_le).toLocaleString("vi-VN")} đ
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-4 text-center text-gray-400 italic text-[11px]"
                      >
                        Sản phẩm này chưa gán cấu hình biến thể nào trước đây.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
