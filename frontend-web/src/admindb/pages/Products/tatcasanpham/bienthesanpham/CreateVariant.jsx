import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Edit3,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import axios from "axios";

export default function AdminCreateVariant() {
  const { id, variantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [parentProductImage, setParentProductImage] = useState("");
  const [productMedia, setProductMedia] = useState([]);
  const [units, setUnits] = useState([]);
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);

  // --- STATE LƯU THÔNG TIN THƯƠNG MẠI BIẾN THỂ ---
  const [sku, setEditSku] = useState("");
  const [price, setEditPrice] = useState(0);
  const [stock, setEditStock] = useState(0);
  const [unit, setEditUnit] = useState("Chai");
  const [variantName, setEditVariantName] = useState("");
  const [variantImageUrl, setVariantImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- STATE LƯU DANH SÁCH CÁC BIẾN THỂ ĐÃ CÓ ---
  const [existingVariants, setExistingVariants] = useState([]);

  // --- STATE MA TRẬN EAV ---
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [newValInputs, setNewValInputs] = useState({});

  // Chế độ Ma trận: "group" (Nhóm thuộc tính) hoặc "single" (Thuộc tính đơn)
  const [matrixType, setMatrixType] = useState("group");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

        const [productResponse, globalAttrResponse, unitsResponse] =
          await Promise.all([
            axios.get(`${apiUrl}/api/products/${id}`),
            axios
              .get(`${apiUrl}/api/products/attributes/matrix`)
              .catch(() => ({ data: [] })),
            axios
              .get(`${apiUrl}/api/products/units`)
              .catch(() => ({ data: [] })),
          ]);

        if (unitsResponse.data) setUnits(unitsResponse.data);

        if (productResponse.data) {
          const data = Array.isArray(productResponse.data)
            ? productResponse.data[0]
            : productResponse.data;
          const currentProductTitle = data.ten_san_pham || "Sản phẩm gốc";
          setProductName(currentProductTitle);

          const mainImg =
            data.hinh_anh_chinh ||
            (data.media && data.media.length > 0
              ? data.media[0].duong_dan_url
              : "");
          setParentProductImage(mainImg);
          setProductMedia(data.media || []);

          let variantsList =
            location.state?.existingVariants || data.bien_the || [];
          setExistingVariants(variantsList);

          const matrixMap = {};
          variantsList.forEach((variant) => {
            if (variant.thuoc_tinh) {
              Object.entries(variant.thuoc_tinh).forEach(([key, val]) => {
                if (!matrixMap[key]) matrixMap[key] = new Set();
                if (val) matrixMap[key].add(val);
              });
            }
          });

          const dynamicMatrix = Object.entries(matrixMap).map(
            ([attrName, valuesSet], index) => {
              const valuesArray = Array.from(valuesSet);
              return {
                id: `attr_${index}_${Date.now()}`,
                name: attrName,
                values: valuesArray,
                selected: valuesArray[0] || "",
              };
            },
          );

          let targetVar = null;
          if (variantId && variantsList.length > 0) {
            targetVar = variantsList.find(
              (v) => v.ma_bien_the === variantId,
            );
            if (targetVar && targetVar.thuoc_tinh) {
              dynamicMatrix.forEach((attr) => {
                if (targetVar.thuoc_tinh[attr.name]) {
                  attr.selected = targetVar.thuoc_tinh[attr.name];
                }
              });
            }
          }
          setAvailableAttributes(dynamicMatrix);

          if (dynamicMatrix.length === 1 && dynamicMatrix[0].name === "ten_bien_the") {
            setMatrixType("single");
          } else if (dynamicMatrix.length <= 1) {
            setMatrixType("single");
          } else {
            setMatrixType("group");
          }

          const comboText = dynamicMatrix
            .map((attr) => attr.selected)
            .filter(Boolean)
            .join(" - ");
          setEditVariantName(
            targetVar ? targetVar.ten_bien_the : `${currentProductTitle} ${comboText ? `- ${comboText}` : ""}`
          );
        }

        if (globalAttrResponse.data) {
          const names = globalAttrResponse.data
            .map((attr) => attr.name || attr.ten_thuoc_tinh)
            .filter(Boolean);
          setGlobalAttributes(names);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ cấu hình dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id, variantId, location.state]);

  const updateVariantNameSuggestion = (productTitle, updatedAttributes) => {
    if (matrixType === "single") return;
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
          alert("Giá trị này đã tồn tại trong ma trận sản phẩm!");
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

  const handleAddOrCreateAttributeGroup = async (targetName = "") => {
    const finalName = (targetName || newAttrName).trim();
    if (!finalName) return;

    if (
      availableAttributes.some(
        (a) => a.name.toLowerCase() === finalName.toLowerCase(),
      )
    ) {
      return alert(
        "Nhóm thuộc tính này đã tồn tại trên ma trận liên kết của sản phẩm!",
      );
    }

    const isExistingGlobal = globalAttributes.some(
      (name) => name.toLowerCase() === finalName.toLowerCase(),
    );

    if (isExistingGlobal) {
      const newGroup = {
        id: `attr_global_${Date.now()}`,
        name: finalName,
        values: [],
        selected: "",
      };
      setAvailableAttributes([...availableAttributes, newGroup]);
      setNewAttrName("");
      setShowDropdown(false);
    } else {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        const response = await axios.post(`${apiUrl}/api/products/attributes`, {
          ten_thuoc_tinh: finalName,
        });

        if (response.data) {
          const dbAttribute = response.data;
          const newGroup = {
            id: dbAttribute.ma_thuoc_tinh || `attr_new_${Date.now()}`,
            name: dbAttribute.ten_thuoc_tinh || finalName,
            values: [],
            selected: "",
          };
          setAvailableAttributes([...availableAttributes, newGroup]);
          setGlobalAttributes((prev) => [...prev, newGroup.name]);
          setNewAttrName("");
          setShowDropdown(false);
        }
      } catch (err) {
        alert(
          "Gặp sự cố khi lưu nhóm thuộc tính mới xuống DB. Vui lòng thử lại!",
        );
      }
    }
  };

  const handleRemoveAttributeGroup = (attrId) => {
    const updated = availableAttributes.filter((a) => a.id !== attrId);
    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
  };

  const filteredGlobalAttributes = useMemo(() => {
    const query = newAttrName.trim().toLowerCase();
    if (!query) return globalAttributes;
    return globalAttributes.filter((name) =>
      name.toLowerCase().includes(query),
    );
  }, [newAttrName, globalAttributes]);

  const isAlreadyInProductMatrix = useMemo(
    () =>
      availableAttributes.some(
        (a) => a.name.toLowerCase() === newAttrName.trim().toLowerCase(),
      ),
    [newAttrName, availableAttributes],
  );
  const isExistingInGlobal = useMemo(
    () =>
      globalAttributes.some(
        (name) => name.toLowerCase() === newAttrName.trim().toLowerCase(),
      ),
    [newAttrName, globalAttributes],
  );

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

  const checkComboExists = (groupName, value) => {
    const hypotheticalSelection = {};
    availableAttributes.forEach((attr) => {
      if (attr.name === groupName) hypotheticalSelection[attr.name] = value;
      else if (attr.selected) hypotheticalSelection[attr.name] = attr.selected;
    });

    return existingVariants.some((variant) => {
      if (!variant.thuoc_tinh) return false;
      if (Object.keys(variant.thuoc_tinh).length !== availableAttributes.length)
        return false;
      return Object.entries(hypotheticalSelection).every(
        ([k, v]) => variant.thuoc_tinh[k] === v,
      );
    });
  };

  const matchedVariant = useMemo(() => {
    if (availableAttributes.length === 0) {
      const defaultVariant = existingVariants.find(
        (variant) =>
          !variant.thuoc_tinh || Object.keys(variant.thuoc_tinh).length === 0,
      );
      return defaultVariant || null;
    }

    const currentSelection = availableAttributes.reduce((acc, attr) => {
      if (attr.selected) acc[attr.name] = attr.selected;
      return acc;
    }, {});

    if (Object.keys(currentSelection).length === 0) return null;

    return existingVariants.find((variant) => {
      if (!variant.thuoc_tinh) return false;
      const isMatch = Object.keys(currentSelection).every(
        (key) => variant.thuoc_tinh[key] === currentSelection[key],
      );
      const isExactLength =
        Object.keys(currentSelection).length ===
        Object.keys(variant.thuoc_tinh).length;
      return isMatch && isExactLength;
    });
  }, [availableAttributes, existingVariants]);

  useEffect(() => {
    if (matchedVariant) {
      setEditSku(matchedVariant.sku || "");
      setEditPrice(matchedVariant.gia_ban_le || 0);
      setEditStock(matchedVariant.ton_kho || matchedVariant.so_luong_ton || 0);
      setEditUnit(matchedVariant.ten_don_vi || units[0]?.ten_don_vi || "Chai");
      setEditVariantName(matchedVariant.ten_bien_the || "");

      const specificMedia = productMedia.find(
        (m) => m.ma_bien_the === matchedVariant.ma_bien_the,
      );
      const specificImgUrl = specificMedia
        ? specificMedia.duong_dan_url
        : matchedVariant.hinh_anh_url || matchedVariant.duong_dan_url;
      setVariantImageUrl(specificImgUrl || parentProductImage || "");

      if (variantId !== matchedVariant.ma_bien_the) {
        navigate(
          `/admin/products/create-variant/${id}/${matchedVariant.ma_bien_the}`,
          { replace: true, state: location.state },
        );
      }
    } else {
      setEditPrice(0);
      setEditStock(0);
      setVariantImageUrl(parentProductImage || "");

      if (availableAttributes.length > 0 && matrixType === "group") {
        const idSuffix = id ? id.replace(/\D/g, "").slice(-3) : "NEW";
        const attrParts = availableAttributes
          .map((a) => {
            if (!a.selected) return "";
            return a.selected
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "")
              .substring(0, 3)
              .toUpperCase();
          })
          .filter(Boolean)
          .join("-");
        setEditSku(`SKU-${idSuffix}${attrParts ? "-" + attrParts : ""}`);
      } else if (matrixType === "single" && variantName) {
        const idSuffix = id ? id.replace(/\D/g, "").slice(-3) : "NEW";
        const namePart = variantName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .substring(0, 4)
          .toUpperCase();
        setEditSku(`SKU-${idSuffix}-${namePart}`);
      } else {
        setEditSku("");
      }

      if (variantId) {
        navigate(`/admin/products/create-variant/${id}`, {
          replace: true,
          state: location.state,
        });
      }
    }
  }, [
    matchedVariant,
    parentProductImage,
    productMedia,
    id,
    variantId,
    navigate,
    location.state,
    availableAttributes,
    units,
    matrixType,
    variantName,
  ]);

  const handleLocalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/"))
      return alert("Vui lòng chọn tệp tin hình ảnh hợp lệ!");

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const response = await axios.post(
        `${apiUrl}/api/products/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data && response.data.url) {
        setVariantImageUrl(response.data.url);
      } else {
        alert("Upload thất bại, vui lòng thử lại!");
      }
    } catch (err) {
      alert("Gặp sự cố khi upload ảnh lên Cloudinary!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSuggestMissingCombination = () => {
    if (
      availableAttributes.length === 0 ||
      availableAttributes.some((a) => a.values.length === 0)
    ) {
      return alert(
        "Vui lòng khởi tạo nhóm thuộc tính và giá trị trước khi tìm tổ hợp thiếu!",
      );
    }

    const keys = availableAttributes.map((a) => a.name);
    const valuesArrays = availableAttributes.map((a) => a.values);

    const getCombinations = (arrays) => {
      if (arrays.length === 0) return [[]];
      let res = [];
      let rest = getCombinations(arrays.slice(1));
      for (let val of arrays[0]) {
        for (let r of rest) res.push([val, ...r]);
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
    } else {
      alert(
        "✨ Tuyệt vời! Bạn đã bao phủ ĐẦY ĐỦ tất cả các tổ hợp biến thể của sản phẩm này.",
      );
    }
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!sku.trim()) return alert("Vui lòng điền mã định danh SKU!");
    if (price < 0) return alert("Giá niêm yết không hợp lệ!");

    setSaving(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      let filterAttributesPayload = {};
      if (matrixType === "group") {
        filterAttributesPayload = availableAttributes.reduce((acc, attr) => {
          if (attr.selected && attr.selected.trim() !== "") {
            acc[attr.name] = attr.selected;
          }
          return acc;
        }, {});
      } else {
        const finalValue = variantName.trim() || productName || "Phiên bản gốc";
        filterAttributesPayload = {
          ten_bien_the: finalValue,
        };
      }

      const payload = {
        ma_san_pham: id,
        ten_bien_the: variantName || productName || "Phiên bản mặc định",
        sku: sku.trim().toUpperCase(),
        gia_ban_le: price,
        so_luong_ton: stock,
        ten_don_vi: unit,
        thuoc_tinh: filterAttributesPayload,
        hinh_anh_url: variantImageUrl,
      };

      if (matchedVariant) {
        await axios.put(
          `${apiUrl}/api/products/variants/${matchedVariant.ma_bien_the}`,
          payload,
        );
        alert(`💾 Đã cập nhật thành công biến thể [${matchedVariant.sku}]`);
      } else {
        const res = await axios.post(
          `${apiUrl}/api/products/${id}/variants`,
          payload,
        );
        alert("🎉 Đã khởi tạo biến thể mới thành công vào Database!");

        const newVariantData = {
          ...res.data.data,
          thuoc_tinh: filterAttributesPayload,
        };
        setExistingVariants([newVariantData, ...existingVariants]);
        setEditSku("");
        setEditPrice(0);
        setVariantImageUrl("");
      }
    } catch (err) {
      console.error("Lỗi xử lý lưu dữ liệu biến thể:", err);
      alert("Gặp sự cố khi lưu biến thể xuống DB. Mã SKU có thể đã bị trùng!");
    } finally {
      setSaving(false);
    }
  };

  // 🌟 NÂNG CẤP BẢO MẬT: Xử lý chuyển đổi chế độ ma trận kèm theo ràng buộc bắt buộc xóa sạch dữ liệu
  const handleMatrixTypeChange = (e) => {
    const nextType = e.target.value;
    
    // Nếu chuyển sang Đơn khi đang có các Group thuộc tính hiện hành
    if (matrixType === "group" && availableAttributes.length > 0) {
      alert("🛑 Ràng buộc cấu hình: Bạn đang chạy ma trận 'Nhóm thuộc tính'. Hãy xóa tất cả các nhóm thuộc tính hiện tại bên dưới trước khi đổi sang chế độ 'Thuộc tính đơn'!");
      return;
    }
    
    // Nếu chuyển sang Nhóm khi đang tồn tại dữ liệu thuộc tính Đơn lẻ (variantName có chữ)
    if (matrixType === "single" && variantName.trim() !== "") {
      alert("🛑 Ràng buộc cấu hình: Bạn đang lưu dữ liệu 'Thuộc tính đơn'. Vui lòng xóa sạch chuỗi định danh (Tên hiển thị biến thể) ở cột bên phải trước khi chuyển đổi sang 'Nhóm thuộc tính'!");
      return;
    }

    setMatrixType(nextType);
    setAvailableAttributes([]);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang
          tải cấu trúc dữ liệu...
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
              {matchedVariant ? "Cập nhật phiên bản (SKU)" : "Tạo biến thể mới"}
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
        {/* CỘT TRÁI: QUẢN LÝ MA TRẬN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Tag size={16} className="text-amber-500" /> Bước 1: Ma trận EAV
              </h3>
              
              <select
                value={matrixType}
                onChange={handleMatrixTypeChange}
                className="bg-slate-50 border border-gray-200 focus:border-[#006c49] text-[11px] font-black text-[#006c49] px-2.5 py-1.5 rounded-xl outline-none cursor-pointer transition shadow-sm"
              >
                <option value="group">📦 Nhóm thuộc tính</option>
                <option value="single">🧩 Thuộc tính đơn</option>
              </select>
            </div>

            {/* 🌟 ĐỒNG BỘ GIAO DIỆN HOÀN TOÀN GIỐNG HÌNH image_34c8dc.png CHO CẢ HAI CHẾ ĐỘ */}
            <div className="space-y-2 relative pt-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                ✨ {matrixType === "group" ? "Khởi tạo nhóm thuộc tính (Ví dụ: Màu sắc, Kích thước)" : "Khởi tạo thuộc tính đơn (Ví dụ: Tên mặt hàng)"}
              </label>
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Tìm hoặc nhập mới..."
                    value={newAttrName}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onChange={(e) => {
                      setNewAttrName(e.target.value);
                      if (matrixType === "single") setEditVariantName(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] px-3 py-2.5 rounded-xl text-xs font-bold outline-none"
                  />
                  {showDropdown && matrixType === "group" && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-xl divide-y divide-gray-50 text-left">
                      {filteredGlobalAttributes.length > 0 ? (
                        filteredGlobalAttributes.map((name, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => handleAddOrCreateAttributeGroup(name)}
                            className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#006c49]/10 hover:text-[#006c49] transition text-left flex items-center justify-between"
                          >
                            <span>📦 {name}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                              Có sẵn
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-[11px] text-gray-400 italic">
                          Gõ nút phía bên để tạo mới.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={matrixType === "group" ? (!newAttrName.trim() || isAlreadyInProductMatrix) : !newAttrName.trim()}
                  onClick={() => {
                    if (matrixType === "group") {
                      handleAddOrCreateAttributeGroup();
                    } else {
                      setEditVariantName(newAttrName.trim());
                      setNewAttrName("");
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition shrink-0 text-white ${matrixType === "group" && isAlreadyInProductMatrix ? "bg-gray-300 cursor-not-allowed" : isExistingInGlobal && matrixType === "group" ? "bg-amber-500 hover:bg-amber-600" : "bg-[#006c49] hover:bg-[#005137]"}`}
                >
                  <Plus size={14} />
                  Tạo mới
                </button>
              </div>
            </div>

            {/* KHU VỰC HIỂN THỊ ĐỘNG KẾT QUẢ DỰA TRÊN CHẾ ĐỘ MA TRẬN */}
            {matrixType === "group" ? (
              // HIỂN THỊ CHẾ ĐỘ NHÓM THUỘC TÍNH
              <div className="space-y-5 pt-2">
                {availableAttributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 relative group/box shadow-sm"
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
                          const isGloballyUsed = usedAttributesMap[attr.name]?.has(val);
                          const isComboValid = checkComboExists(attr.name, val);

                          return (
                            <button
                              type="button"
                              key={val}
                              onClick={() => handleSelectAttribute(attr.id, val)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border relative overflow-hidden ${
                                isSelected
                                  ? "bg-[#006c49] text-white border-[#006c49] shadow-md scale-105"
                                  : isComboValid
                                    ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm"
                                    : "bg-slate-50 text-slate-400 border-dashed border-slate-300 opacity-60"
                              }`}
                            >
                              {val}
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
                        placeholder={`Thêm giá trị ${attr.name}...`}
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
                        className="bg-slate-100 hover:bg-[#006c49] p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:text-white transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {availableAttributes.length === 0 && (
                  <div className="text-center text-gray-400 italic text-[11px] py-8 bg-slate-50 rounded-2xl border border-dashed border-gray-200 px-4">
                    Sản phẩm này hiện tại không chia theo nhóm ma trận.
                    <br />
                    Hệ thống sẽ mặc định lưu cấu hình dưới dạng Sản phẩm đơn (Một phiên bản duy nhất).
                  </div>
                )}
              </div>
            ) : (
              // 🧩 HIỂN THỊ BIẾN THỂ ĐƠN KÈM NÚT XÓA THUỘC TÍNH ĐƠN
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="inline-flex items-center rounded-full bg-[#006c49] px-4 py-1.5 text-xs font-black text-white shadow-sm max-w-[75%] truncate">
                  {variantName.trim() || productName || "Chưa nhập tên"}
                </div>
                
                {/* NÚT XÓA THUỘC TÍNH ĐƠN */}
                <button
                  type="button"
                  onClick={() => {
                    if(window.confirm("Bạn có chắc chắn muốn xóa thuộc tính đơn lẻ này không?")) {
                      setEditVariantName("");
                    }
                  }}
                  className="bg-white hover:bg-red-500 border border-gray-200 text-slate-500 hover:text-white p-2 rounded-xl transition shadow-sm shrink-0"
                  title="Xóa thuộc tính đơn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {matrixType === "single" && (
              <div className="text-center text-gray-400 italic text-[11px] py-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200 px-4 mt-2">
                Hệ thống tự động sử dụng cột: <span className="text-[#006c49] font-black">"ten_bien_the"</span> làm cấu trúc dữ liệu chính xác khi đồng bộ xuống Database.
              </div>
            )}

            {matrixType === "group" && availableAttributes.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSuggestMissingCombination}
                  className="w-full bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Layers size={16} /> Gợi ý cấu hình còn thiếu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG SỐ */}
        <div className="lg:col-span-7 space-y-6">
          {matchedVariant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
            >
              <Edit3 size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-blue-900">
                  Phiên bản này đã tồn tại!
                </h4>
                <p className="text-xs font-medium text-blue-700 mt-1">
                  Hệ thống đang ở chế độ <b>Cập nhật (Update)</b>. Các thay đổi của bạn sẽ ghi đè lên SKU hiện tại.
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
              Bước 2: Thông số thương mại của phiên bản
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase">
                  Tên hiển thị (Tự động Gợi ý)
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
                    min="0"
                    value={price}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                    <Package size={12} /> Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase">
                    Quy chuẩn / Đơn vị
                  </label>
                  <select
                    value={unit}
                    onChange={async (e) => {
                      if (e.target.value === "ADD_NEW_UNIT") {
                        const newUnit = window.prompt(
                          "Nhập đơn vị mới (VD: Lốc, Khay...):",
                        );
                        if (newUnit && newUnit.trim() !== "") {
                          try {
                            const apiUrl =
                              import.meta.env.VITE_API_PRODUCT_URL ||
                              "http://localhost:5002";
                            const res = await axios.post(
                              `${apiUrl}/api/products/units`,
                              { ten_don_vi: newUnit.trim() },
                            );
                            if (res.data) {
                              setUnits([...units, res.data]);
                              setEditUnit(res.data.ten_don_vi);
                            }
                          } catch (err) {
                            alert("Lỗi hệ thống khi thêm đơn vị!");
                          }
                        }
                      } else {
                        setEditUnit(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] font-bold text-slate-800 outline-none p-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    {units.length > 0 ? (
                      units.map((u) => (
                        <option key={u.id} value={u.ten_don_vi}>
                          {u.ten_don_vi}
                        </option>
                      ))
                    ) : (
                      <option value="Chai">Chai lẻ</option>
                    )}
                    <option
                      value="ADD_NEW_UNIT"
                      className="font-black text-[#006c49] bg-emerald-50"
                    >
                      ➕ Bổ sung đơn vị mới...
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK HÌNH ẢNH */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <ImageIcon size={16} className="text-[#006c49]" /> Bước 3: Hình ảnh riêng (Không bắt buộc)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-4 flex justify-center">
                <div className="w-32 h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group/img shadow-inner">
                  {variantImageUrl ? (
                    <>
                      <img
                        src={variantImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/400x400?text=Lỗi+Ảnh";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setVariantImageUrl("")}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase transition-all duration-150"
                      >
                        Gỡ bỏ ảnh
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 p-3 text-center">
                      <ImageIcon size={20} className="stroke-1.5" />
                      <span className="text-[10px] font-bold">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-8 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase">
                    Đường dẫn liên kết (Image URL)
                  </label>
                  <input
                    type="url"
                    placeholder="Dán link ảnh từ hệ thống..."
                    value={variantImageUrl}
                    onChange={(e) => setVariantImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] outline-none p-3 rounded-xl text-xs font-medium transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLocalImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-100 hover:bg-slate-200 border border-gray-200 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Upload size={13} />{" "}
                    {uploadingImage ? "Đang tải..." : "Tải ảnh từ máy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className={`font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 text-white ${matchedVariant ? "bg-blue-600 hover:bg-blue-800" : "bg-[#006c49] hover:bg-[#004f36]"}`}
              >
                <Save size={15} />{" "}
                {saving
                  ? "Đang xử lý..."
                  : matchedVariant
                    ? "Cập nhật phiên bản"
                    : "Lưu phiên bản mới"}
              </button>
            </div>
          </div>

          {/* BẢNG EXISTING VARIANTS */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
              📊 Bảng đối chiếu ma trận hiện hành của sản phẩm
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[280px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider bg-slate-50/80">
                    <th className="py-3 px-3">Mã SKU</th>
                    <th className="py-3 px-3">Tên phiên bản</th>
                    <th className="py-3 px-3 font-mono text-right">
                      Giá niêm yết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-slate-700">
                  {existingVariants.length > 0 ? (
                    existingVariants.map((v, index) => {
                      const isHighlighted =
                        matchedVariant?.ma_bien_the === v.ma_bien_the;
                      return (
                        <tr
                          key={index}
                          className={`transition duration-150 ${isHighlighted ? "bg-blue-50/70" : "hover:bg-slate-50"}`}
                        >
                          <td
                            className={`py-3 px-3 font-mono ${isHighlighted ? "text-blue-700 font-black" : "text-amber-700"}`}
                          >
                            {v.sku} {isHighlighted && "📍"}
                          </td>
                          <td
                            className={`py-3 px-3 ${isHighlighted ? "text-blue-900" : "text-slate-800"}`}
                          >
                            {v.ten_bien_the}
                          </td>
                          <td
                            className={`py-3 px-3 font-mono text-right ${isHighlighted ? "text-blue-900" : "text-slate-900"}`}
                          >
                            {v.gia_ban_le
                              ? Number(v.gia_ban_le).toLocaleString("vi-VN")
                              : 0}{" "}
                            đ
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-8 text-center text-gray-400 italic text-[11px]"
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