import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  X,
  Database
} from "lucide-react";
import axios from "axios";

// Hàm lấy Base ID (VD: từ MSP893020726001 lấy ra 020726001)
const getBaseId = (fullId) => {
  if (!fullId) return "NEW";
  const digits = fullId.replace(/\D/g, "");
  return digits.length > 9
    ? digits.slice(-9)
    : digits.length > 0
      ? digits
      : "NEW";
};

// Component Wrapper an toàn đề phòng môi trường chạy thử thiếu React Router Context
function SafeApp() {
  let params = {};
  let navigate = () => {};
  let location = { state: null };

  try {
    params = useParams();
    navigate = useNavigate();
    location = useLocation();
  } catch (e) {
    console.warn("Router context not found, running on preview safe-mode");
  }

  const id = params.id || "MSP893020726001";
  const variantId = params.variantId || null;

  const fileInputRef = useRef(null);
  const unitRef = useRef(null);

  // --- TRẠNG THÁI THÔNG BÁO CAO CẤP CHUYÊN BIỆT (TOASTS) ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- HỆ THỐNG STATE QUẢN LÝ SẢN PHẨM CHA & BIẾN THỂ ---
  const [parentProductImage, setParentProductImage] = useState("");
  const [productMedia, setProductMedia] = useState([]);
  const [units, setUnits] = useState([]);
  const [productName, setProductName] = useState("");
  const [productCountry, setProductCountry] = useState("VN");
  const [loading, setLoading] = useState(true);

  const [activeVariantId, setActiveVariantId] = useState(variantId || null);
  const [isVariantMode, setIsVariantMode] = useState(
    location.state?.targetVariantType === "GROUP",
  );

  // --- CÁC TRẠNG THÁI MODAL & DROPDOWN ---
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitDesc, setNewUnitDesc] = useState("");
  const [isSubmittingUnit, setIsSubmittingUnit] = useState(false);

  // --- TRẠNG THÁI BIÊN TẬP FORM HIỆN TẠI ---
  const [sku, setEditSku] = useState("");
  const [price, setEditPrice] = useState(0);
  const [stock, setEditStock] = useState(0);
  const [unit, setEditUnit] = useState("Chai");
  const [variantName, setEditVariantName] = useState("");
  const [variantImageUrl, setVariantImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- TRẠNG THÁI MA TRẬN THUỘC TÍNH SẢN PHẨM ---
  const [existingVariants, setExistingVariants] = useState([]);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [simpleForm, setSimpleForm] = useState({
    ten_bien_the: "",
    sku: "",
    gia_ban_le: 0,
    so_luong_ton: 0,
    ten_don_vi: "Chai",
  });

  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [newValInputs, setNewValInputs] = useState({});

  // =========================================================================
  // 🌟 HÀM GỌI XUỐNG BACKEND ĐỂ LẤY SKU CHỐNG TRÙNG LẶP (QUÉT DB THỰC TẾ)
  // =========================================================================
  const fetchSafeSkuFromDB = async (isGroup, attrs, country = "VN") => {
    try {
      const baseSuffix = getBaseId(id);
      let baseSku = `${country}-${baseSuffix}`;

      if (isGroup) {
        const attrParts = attrs
          .map((a) =>
            a.selected
              ? a.selected
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .substring(0, 3)
                  .toUpperCase()
              : "",
          )
          .filter(Boolean)
          .join("-");
        if (attrParts) baseSku += `-${attrParts}`;
      }

      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const res = await axios.post(`${apiUrl}/api/products/generate-sku`, {
        baseSku,
      });

      if (res.data.success) {
        return res.data.safeSku;
      }
      return `${baseSku}-001`;
    } catch (error) {
      console.error("Lỗi lấy SKU từ DB:", error);
      return `${country}-${getBaseId(id)}-001`;
    }
  };

  const handleSelectExistingVariant = (v) => {
    setActiveVariantId(v.ma_bien_the);
    const hasAttributes = v.thuoc_tinh && Object.keys(v.thuoc_tinh).length > 0;
    setIsVariantMode(hasAttributes);

    setEditSku(v.sku || "");
    setEditPrice(v.gia_ban_le || 0);
    setEditStock(v.ton_kho || v.so_luong_ton || 0);
    setEditUnit(v.ten_don_vi || "Chai");
    setEditVariantName(v.ten_bien_the || "");

    const specificMedia = productMedia.find(
      (m) => m.ma_bien_the === v.ma_bien_the,
    );
    const specificImgUrl = specificMedia
      ? specificMedia.duong_dan_url
      : v.hinh_anh_url || v.duong_dan_url;
    setVariantImageUrl(specificImgUrl || parentProductImage || "");

    if (hasAttributes && availableAttributes.length > 0) {
      const updatedAttributes = availableAttributes.map((attr) => ({
        ...attr,
        selected: v.thuoc_tinh[attr.name] || "",
      }));
      setAvailableAttributes(updatedAttributes);
    }
    showToast(`Đã chọn cấu hình phiên bản: ${v.sku}`, "info");
  };

  const matchedVariant = useMemo(() => {
    if (!activeVariantId) return null;
    return (
      existingVariants.find((v) => v.ma_bien_the === activeVariantId) || null
    );
  }, [activeVariantId, existingVariants]);

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

          setProductName(data.ten_san_pham || "Sản phẩm gốc");
          setProductCountry(data.ma_quoc_gia || "VN");

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
              return {
                id: `attr_${index}_${Date.now()}`,
                name: attrName,
                values: Array.from(valuesSet),
                selected: "",
              };
            },
          );

          setAvailableAttributes(dynamicMatrix);

          if (variantId && variantsList.length > 0) {
            const target = variantsList.find(
              (v) => v.ma_bien_the === variantId,
            );
            if (target) handleSelectExistingVariant(target);
          } else {
            if (location.state && location.state.targetVariantType) {
              setIsVariantMode(location.state.targetVariantType === "GROUP");
            } else if (dynamicMatrix.length > 0) {
              setIsVariantMode(true);
            } else {
              setIsVariantMode(false);
            }
          }
        }

        if (globalAttrResponse.data) {
          const names = globalAttrResponse.data
            .map((attr) => attr.name || attr.ten_thuoc_tinh)
            .filter(Boolean);
          setGlobalAttributes(names);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu hệ thống:", err);
        showToast("Lỗi liên kết tới dịch vụ sản phẩm", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  useEffect(() => {
    const updateSkuAsync = async () => {
      if (activeVariantId) return;

      if (isVariantMode && availableAttributes.length > 0) {
        const comboText = availableAttributes
          .map((attr) => attr.selected)
          .filter(Boolean)
          .join(" - ");
        setEditVariantName(
          `${productName} ${comboText ? `- ${comboText}` : ""}`,
        );

        const safeSku = await fetchSafeSkuFromDB(
          true,
          availableAttributes,
          productCountry,
        );
        setEditSku(safeSku);
      } else if (!isVariantMode && !activeVariantId) {
        const safeSku = await fetchSafeSkuFromDB(false, [], productCountry);
        setEditSku(safeSku);
        setEditVariantName(productName);
      }
    };

    updateSkuAsync();
  }, [
    availableAttributes,
    isVariantMode,
    productName,
    activeVariantId,
    productCountry,
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (unitRef.current && !unitRef.current.contains(event.target)) {
        setIsUnitOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveSimpleVariant = async () => {
    if (!simpleForm.ten_bien_the || !simpleForm.sku) {
      return showToast("Vui lòng điền tên và mã SKU khởi tạo!", "error");
    }

    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const res = await axios.post(`${apiUrl}/api/products/variants/simple`, {
        ma_san_pham: id,
        ...simpleForm,
        gia_ban_le: 0,
        so_luong_ton: 0,
      });

      const newVariant = res.data.data;
      setExistingVariants([newVariant, ...existingVariants]);
      setShowSimpleModal(false);

      handleSelectExistingVariant(newVariant);

      setSimpleForm({
        ten_bien_the: "",
        sku: "",
        gia_ban_le: 0,
        so_luong_ton: 0,
        ten_don_vi: "Chai",
      });
      showToast("Khởi tạo vỏ biến thể thành công! Có thể cập nhật thông số ngay.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const handleSelectAttribute = (attrId, value) => {
    setActiveVariantId(null);
    const updated = availableAttributes.map((attr) =>
      attr.id === attrId ? { ...attr, selected: value } : attr,
    );
    setAvailableAttributes(updated);
  };

  const handleAddNewValueToAttribute = (attrId) => {
    const valueText = newValInputs[attrId]?.trim();
    if (!valueText) return;

    const updated = availableAttributes.map((attr) => {
      if (attr.id === attrId) {
        if (attr.values.includes(valueText)) {
          showToast("Giá trị thuộc tính này đã tồn tại trên ma trận!", "warning");
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
    setActiveVariantId(null);
    setNewValInputs((prev) => ({ ...prev, [attrId]: "" }));
  };

  const handleAddOrCreateAttributeGroup = async (targetName = "") => {
    const finalName = (
      typeof targetName === "string" ? targetName : newAttrName
    ).trim();
    if (!finalName) return;

    if (
      availableAttributes.some(
        (a) => a.name.toLowerCase() === finalName.toLowerCase(),
      )
    ) {
      return showToast("Nhóm thuộc tính này đã tồn tại trên sản phẩm!", "warning");
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
          showToast(`Đã thêm mới nhóm thuộc tính [${finalName}] vào DB`, "success");
        }
      } catch (err) {
        showToast("Gặp sự cố khi lưu nhóm thuộc tính mới xuống DB", "error");
      }
    }
  };

  const handleRemoveAttributeGroup = (attrId) => {
    const updated = availableAttributes.filter((a) => a.id !== attrId);
    setAvailableAttributes(updated);
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
          if (val) map[key].add(val);
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

  const handleLocalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return showToast("Vui lòng chọn tệp tin hình ảnh hợp lệ!", "warning");
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const response = await axios.post(
        `${apiUrl}/api/products/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (response.data && response.data.url) {
        setVariantImageUrl(response.data.url);
        showToast("Tải ảnh biến thể lên máy chủ thành công!", "success");
      }
    } catch (err) {
      showToast("Gặp sự cố khi upload ảnh lên Cloudinary", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSuggestMissingCombination = () => {
    if (
      availableAttributes.length === 0 ||
      availableAttributes.some((a) => a.values.length === 0)
    ) {
      return showToast("Hãy khởi tạo nhóm thuộc tính và nhãn giá trị trước!", "warning");
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
      setActiveVariantId(null);
      showToast("Đã đề xuất một tổ hợp biến thể trống chưa cấu hình!", "info");
    } else {
      showToast("✨ Bạn đã thiết lập bao phủ đầy đủ toàn bộ ma trận biến thể!", "success");
    }
  };

  const openSimpleModal = async () => {
    const safeSku = await fetchSafeSkuFromDB(false, [], productCountry);
    setSimpleForm({
      ten_bien_the: "",
      sku: safeSku,
      gia_ban_le: 0,
      so_luong_ton: 0,
      ten_don_vi: units[0]?.ten_don_vi || "Chai",
    });
    setShowSimpleModal(true);
  };

  const handleResetToCreateNew = async () => {
    setActiveVariantId(null);
    const safeSku = await fetchSafeSkuFromDB(
      isVariantMode,
      availableAttributes,
      productCountry,
    );

    setEditSku(safeSku);
    setEditPrice(0);
    setEditStock(0);
    setVariantImageUrl(parentProductImage);
    setEditVariantName("");

    const clearedAttrs = availableAttributes.map((attr) => ({
      ...attr,
      selected: "",
    }));
    setAvailableAttributes(clearedAttrs);
    showToast("Đã dọn dẹp form để sẵn sàng thêm phiên bản mới", "info");
  };

  const handleToggleMode = async (isSwitchingToGroup) => {
    if (isSwitchingToGroup === isVariantMode) return;

    if (isSwitchingToGroup === false) {
      if (availableAttributes.length > 0 || existingVariants.length > 0) {
        if (
          confirm(
            "Chuyển về Sản phẩm Đơn sẽ LƯU TRỮ (ẩn) toàn bộ các phiên bản và thuộc tính hiện tại. Bạn có chắc chắn muốn thiết lập lại thành 1 phiên bản duy nhất?",
          )
        ) {
          try {
            const apiUrl =
              import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
            await axios.delete(`${apiUrl}/api/products/${id}/variants-all`);
            setAvailableAttributes([]);
            setExistingVariants([]);
            setIsVariantMode(false);

            const safeSku = await fetchSafeSkuFromDB(false, [], productCountry);
            setEditSku(safeSku);
            setEditPrice(0);
            setEditStock(0);
            setVariantImageUrl(parentProductImage);
            setEditVariantName("");
            setActiveVariantId(null);
            showToast("Đã dọn dẹp & hoàn trả về cấu hình Biến thể Đơn", "success");
          } catch (err) {
            showToast("Lỗi khi chuyển đổi chế độ đơn", "error");
          }
        }
      } else {
        setIsVariantMode(false);
      }
    } else {
      if (sku || price > 0) {
        if (
          confirm(
            "Chuyển sang sản phẩm Nhóm sẽ yêu cầu bạn thiết lập các thuộc tính mới. Tiếp tục?",
          )
        ) {
          setIsVariantMode(true);
          handleResetToCreateNew();
        }
      } else {
        setIsVariantMode(true);
        handleResetToCreateNew();
      }
    }
  };

  const handleAddNewUnitSubmit = async () => {
    if (!newUnitName.trim()) return showToast("Vui lòng nhập tên đơn vị tính!", "warning");
    setIsSubmittingUnit(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const res = await axios.post(`${apiUrl}/api/products/units`, {
        ten_don_vi: newUnitName.trim(),
        mo_ta: newUnitDesc.trim(),
      });
      if (res.data) {
        setUnits([...units, res.data]);
        setEditUnit(res.data.ten_don_vi);
        setIsAddUnitModalOpen(false);
        setNewUnitName("");
        setNewUnitDesc("");
        showToast("Thêm đơn vị mới thành công", "success");
      }
    } catch (err) {
      showToast("Lỗi hệ thống khi thêm đơn vị tính mới", "error");
    } finally {
      setIsSubmittingUnit(false);
    }
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!sku.trim()) return showToast("Vui lòng điền mã định danh SKU!", "warning");
    if (price < 0) return showToast("Giá niêm yết không hợp lệ!", "warning");

    if (isVariantMode) {
      if (
        availableAttributes.length === 0 ||
        !availableAttributes.some((a) => a.selected)
      ) {
        return showToast(
          "🛑 Vui lòng tạo ít nhất 1 nhóm thuộc tính (Ví dụ: Màu Sắc - Đỏ)!",
          "error",
        );
      }
      const missingSelections = availableAttributes.filter(
        (attr) => !attr.selected || attr.selected.trim() === "",
      );
      if (missingSelections.length > 0) {
        const missingNames = missingSelections.map((a) => a.name).join(", ");
        return showToast(
          `🛑 Chưa chọn nhãn giá trị cho nhóm thuộc tính: [${missingNames}]`,
          "error",
        );
      }
    }

    setSaving(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      const filterAttributesPayload =
        isVariantMode && availableAttributes.length > 0
          ? availableAttributes.reduce((acc, attr) => {
              if (
                attr.name !== "ten_bien_the" &&
                attr.selected &&
                attr.selected.trim() !== ""
              ) {
                acc[attr.name] = attr.selected;
              }
              return acc;
            }, {})
          : {};

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
        showToast(`💾 Đã lưu & đồng bộ thành công biến thể [${matchedVariant.sku}]`, "success");

        setExistingVariants((prev) =>
          prev.map((v) =>
            v.ma_bien_the === matchedVariant.ma_bien_the
              ? { ...v, ...payload }
              : v,
          ),
        );
      } else {
        const res = await axios.post(
          `${apiUrl}/api/products/${id}/variants`,
          payload,
        );
        showToast("🎉 Đã khởi tạo biến thể mới vào cơ sở dữ liệu!", "success");
        const newVariantData = {
          ...res.data.data,
          thuoc_tinh: filterAttributesPayload,
        };
        setExistingVariants([newVariantData, ...existingVariants]);
        setActiveVariantId(newVariantData.ma_bien_the);
      }
    } catch (err) {
      console.error("Lỗi xử lý lưu dữ liệu biến thể:", err);
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-[#006c49] font-black text-sm animate-pulse">
          <Database size={20} className="animate-spin text-[#006c49]" />
          <span>Đang truy xuất cấu trúc dữ liệu sản phẩm Cozy...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-4 md:p-8 font-sans text-left relative"
    >
      
      {/* SYSTEM TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-bold text-xs ${
              toast.type === "error"
                ? "bg-rose-600"
                : toast.type === "warning"
                  ? "bg-amber-500 text-slate-900"
                  : toast.type === "info"
                    ? "bg-[#006c49]"
                    : "bg-[#006c49]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={16} />
            ) : (
              <Check size={16} />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-0.5 hover:bg-white/20 rounded-full transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#006c49] hover:text-white hover:border-[#006c49] transition shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {matchedVariant ? "Chỉnh sửa phiên bản SKU" : "Khởi tạo tổ hợp biến thể mới"}
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              Sản phẩm liên kết:{" "}
              <span className="text-[#006c49] font-black">{productName || "Sản phẩm cha"}</span>
            </p>
          </div>
        </div>

        {matchedVariant && (
          <button
            type="button"
            onClick={handleResetToCreateNew}
            className="px-4 py-2 bg-slate-100 hover:bg-[#e6f0ed] text-slate-600 hover:text-[#006c49] rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 border border-transparent hover:border-[#006c49]/30"
          >
            <Plus size={14} /> + Chuyển sang Tạo Mới
          </button>
        )}
      </div>

      <form onSubmit={handleSaveVariant} className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ==========================================================
              CỘT TRÁI (COL-SPAN-5): GOM CHUNG BƯỚC 1 & BƯỚC 3 THÀNH KHỐI
             ========================================================== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
              
              {/* PHẦN TRÊN: BƯỚC 1: PHÂN LOẠI */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={16} className="text-[#006c49]" /> Bước 1: Phân loại
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Xây dựng ma trận thuộc tính</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isVariantMode && (
                      <button
                        type="button"
                        onClick={openSimpleModal}
                        className="text-[10px] bg-emerald-50 text-[#006c49] border border-emerald-150 font-black px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition shadow-sm"
                      >
                        + Thêm vỏ đơn
                      </button>
                    )}

                    <select
                      value={isVariantMode ? "GROUP" : "SINGLE"}
                      onChange={(e) => handleToggleMode(e.target.value === "GROUP")}
                      className="bg-slate-50 border border-gray-200 text-[#006c49] font-bold text-[11px] px-2.5 py-1.5 rounded-lg outline-none cursor-pointer hover:border-[#006c49] transition focus:bg-white focus:border-[#006c49]"
                    >
                      <option value="SINGLE">Sản phẩm Đơn</option>
                      <option value="GROUP">Sản phẩm Nhóm</option>
                    </select>
                  </div>
                </div>

                {!isVariantMode ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {existingVariants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {existingVariants.map((v) => {
                          const isSelected = activeVariantId === v.ma_bien_the;
                          return (
                            <div
                              key={v.ma_bien_the}
                              onClick={() => handleSelectExistingVariant(v)}
                              className={`px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                                isSelected
                                  ? "bg-[#006c49] text-white border-[#006c49] shadow-md scale-105"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-[#006c49]/30"
                              }`}
                            >
                              {v.ten_bien_the} {isSelected && "📍"}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-[#006c49] text-white px-4 py-2.5 rounded-xl text-xs font-black w-fit shadow-md">
                        {variantName || productName || "Chưa đặt tên"}
                      </div>
                    )}
                    {!sku && existingVariants.length === 0 && (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[11px] font-bold">
                        Đang ở chế độ Biến thể Đơn. <br /> Nhấn nút{" "}
                        <b className="text-[#006c49]">+ Thêm vỏ biến thể đơn</b> ở trên để tạo.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {availableAttributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 relative group/box hover:border-[#006c49]/20 transition"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#006c49]" /> Nhóm: {attr.name}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttributeGroup(attr.id)}
                            className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover/box:opacity-100 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {attr.values?.map((val) => {
                            const isSelected = attr.selected === val;
                            const isGloballyUsed =
                              usedAttributesMap[attr.name]?.has(val);
                            const isComboValid = checkComboExists(attr.name, val);
                            return (
                              <button
                                type="button"
                                key={val}
                                onClick={() => handleSelectAttribute(attr.id, val)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border relative overflow-hidden ${
                                  isSelected
                                    ? "bg-[#006c49] text-white border-[#006c49] shadow-sm scale-105"
                                    : isComboValid
                                      ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-[#006c49]/30 shadow-sm"
                                      : "bg-slate-50 text-slate-400 border-dashed border-slate-300 opacity-60"
                                }`}
                              >
                                {val}
                                {!isGloballyUsed && !isSelected && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c49]"></span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={`Thêm giá trị cho ${attr.name}...`}
                            value={newValInputs[attr.id] || ""}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewValueToAttribute(attr.id);
                              }
                            }}
                            onChange={(e) =>
                              setNewValInputs({
                                ...newValInputs,
                                [attr.id]: e.target.value,
                              })
                            }
                            className="flex-1 bg-white border border-gray-200 focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 px-2.5 py-1.5 rounded-xl text-[11px] font-medium outline-none transition shadow-inner focus:shadow-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNewValueToAttribute(attr.id)}
                            className="bg-slate-100 hover:bg-[#006c49] p-2 rounded-xl border border-gray-200 text-slate-600 hover:text-white transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {availableAttributes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSuggestMissingCombination}
                        className="w-full bg-[#006c49]/5 border border-[#006c49]/15 text-[#006c49] hover:bg-[#006c49]/10 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-sm active:scale-[0.98]"
                      >
                        <Layers size={14} /> Gợi ý cấu hình còn thiếu
                      </button>
                    )}

                    <div className="pt-4 border-t border-gray-100 space-y-2 relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        Khởi tạo nhóm thuộc tính (Ví dụ: Dung tích, Vị...)
                      </label>
                      <div className="flex gap-2 relative">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm hoặc thêm mới..."
                            value={newAttrName}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() =>
                              setTimeout(() => setShowDropdown(false), 200)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOrCreateAttributeGroup();
                              }
                            }}
                            onChange={(e) => setNewAttrName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 px-3 py-2 rounded-xl text-xs font-bold outline-none transition"
                          />
                          {showDropdown && (
                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-xl divide-y divide-gray-50 text-left">
                              {filteredGlobalAttributes.length > 0 ? (
                                filteredGlobalAttributes.map((name, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={() =>
                                      handleAddOrCreateAttributeGroup(name)
                                    }
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#006c49]/10 hover:text-[#006c49] transition text-left flex items-center justify-between"
                                  >
                                    <span>📦 {name}</span>
                                    <span className="text-[9px] bg-emerald-50 text-[#006c49] px-1.5 py-0.5 rounded font-black">
                                      Có sẵn
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-[11px] text-gray-400 italic">
                                  Gõ enter để tạo mới nhóm thuộc tính.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!newAttrName.trim() || isAlreadyInProductMatrix}
                          onClick={() => handleAddOrCreateAttributeGroup()}
                          className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition shrink-0 text-white shadow-sm ${
                            isAlreadyInProductMatrix
                              ? "bg-gray-300 cursor-not-allowed"
                              : isExistingInGlobal
                                ? "bg-amber-500 hover:bg-amber-600"
                                : "bg-[#006c49] hover:bg-[#005137]"
                          }`}
                        >
                          <Plus size={14} />
                          {isExistingInGlobal ? "Chọn" : "Tạo mới"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PHẦN DƯỚI: BƯỚC 3: HÌNH ẢNH RIÊNG */}
              <div className="bg-slate-50/60 p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={16} className="text-[#006c49]" /> Bước 3: Hình ảnh riêng (Không bắt buộc)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Đặt hình ảnh đại diện đặc thù cho phiên bản SKU này</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4 flex justify-center">
                    <div className="w-28 h-28 rounded-2xl border border-dashed border-slate-200 hover:border-[#006c49]/50 bg-white flex flex-col items-center justify-center overflow-hidden relative group/img shadow-sm transition">
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
                        <div className="flex flex-col items-center gap-1 text-slate-400 p-3 text-center">
                          <ImageIcon size={18} className="stroke-1.5 text-[#006c49]/60" />
                          <span className="text-[9px] font-bold text-gray-400">Ảnh SP cha</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">
                        Đường dẫn liên kết (Image URL)
                      </label>
                      <input
                        type="url"
                        placeholder="Nhập hoặc dán địa chỉ link ảnh..."
                        value={variantImageUrl}
                        onChange={(e) => setVariantImageUrl(e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 outline-none p-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
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
                        className="bg-white hover:bg-[#006c49]/5 border border-gray-200 hover:border-[#006c49]/30 text-slate-700 hover:text-[#006c49] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Upload size={13} className="text-[#006c49]" />{" "}
                        {uploadingImage ? "Đang tải lên..." : "Tải lên tệp ảnh"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ==========================================================
              CỘT PHẢI (COL-SPAN-7): PHÂN BỔ NGANG BƯỚC 2 & BẢNG ĐỐI CHIẾU
             ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {matchedVariant && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#006c49]/5 border border-[#006c49]/20 p-4 rounded-2xl flex items-start gap-3 shadow-sm"
              >
                <Edit3 size={18} className="text-[#006c49] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-[#006c49] uppercase tracking-wide">
                    Hệ thống đang ở chế độ Cập nhật
                  </h4>
                  <p className="text-[11px] font-semibold text-[#006c49]/90 mt-1">
                    Các thay đổi của bạn sẽ cập nhật & ghi đè trực tiếp lên SKU [<b>{matchedVariant.sku}</b>] này.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bố cục chia đôi song song: Cấu hình chỉ số & Bảng đối soát */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* PHÂN KHU 2A: THÔNG SỐ THƯƠNG MẠI */}
              <div
                className={`bg-white rounded-3xl border p-5 shadow-sm space-y-5 flex flex-col justify-between transition-colors ${
                  matchedVariant ? "border-[#006c49]/40" : "border-gray-200/80"
                }`}
              >
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-[#006c49]">
                      <Layers size={15} /> Bước 2: Thông số thương mại
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Đặt cấu hình định lượng kho hàng</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">
                        Tên hiển thị (Tự động Gợi ý)
                      </label>
                      <input
                        type="text"
                        required
                        value={variantName}
                        onChange={(e) => setEditVariantName(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 font-bold text-slate-800 outline-none p-2.5 rounded-xl text-xs transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <FileText size={11} /> Mã định danh SKU
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mã SKU định danh..."
                        value={sku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 font-mono font-black text-amber-800 uppercase outline-none p-2.5 rounded-xl text-xs transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <DollarSign size={11} /> Giá bán lẻ định biên (đ)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 font-mono font-black text-slate-900 outline-none p-2.5 rounded-xl text-xs transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <Package size={11} /> Số lượng tồn
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 font-mono font-bold text-slate-800 outline-none p-2.5 rounded-xl text-xs transition-all"
                        />
                      </div>

                      <div className="space-y-1 relative" ref={unitRef}>
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Đơn vị tính
                        </label>
                        <div
                          onClick={() => setIsUnitOpen(!isUnitOpen)}
                          className="w-full bg-slate-50 border border-gray-200 hover:border-[#006c49] font-bold text-slate-800 p-2.5 rounded-xl text-xs transition cursor-pointer flex justify-between items-center"
                        >
                          <span className="truncate">{unit || "Chọn ĐV"}</span>
                          <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${
                            isUnitOpen ? "rotate-180 text-[#006c49]" : ""
                          }`}>
                            ▼
                          </span>
                        </div>
                        {isUnitOpen && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                              {units.map((u) => (
                                <div
                                  key={u.id || u.ma_don_vi || u.ten_don_vi}
                                  onClick={() => {
                                    setEditUnit(u.ten_don_vi);
                                    setIsUnitOpen(false);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                    unit === u.ten_don_vi
                                      ? "bg-[#e6f0ed] text-[#006c49]"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {u.ten_don_vi}
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-gray-100 p-1">
                              <div
                                onClick={() => {
                                  setIsUnitOpen(false);
                                  setIsAddUnitModalOpen(true);
                                }}
                                className="px-2 py-1.5 text-[10px] font-black text-[#006c49] bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                              >
                                + Bổ sung đơn vị...
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition active:scale-[0.98] disabled:opacity-50 text-white bg-[#006c49] hover:bg-[#005137]"
                  >
                    <Save size={14} />{" "}
                    {saving
                      ? "Đang lưu..."
                      : matchedVariant
                        ? "Cập nhật thay đổi"
                        : "Kích hoạt phiên bản"}
                  </button>
                </div>
              </div>

              {/* PHÂN KHU 2B: BẢNG ĐỐI CHIẾU CÁC BIẾN THỂ HIỆN CÓ */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between self-stretch">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-[#006c49] bg-emerald-50 border border-emerald-150 px-3 py-2 rounded-xl flex items-center gap-1.5">
                    📊 Bảng đối chiếu danh mục SKU
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold pl-1">
                    Chọn nhanh bản ghi có sẵn để chỉnh sửa hàng loạt
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 flex-1 flex flex-col min-h-[200px]">
                  <div className="overflow-y-auto max-h-[220px] custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="border-b border-gray-150 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="py-2 px-3">Mã SKU</th>
                          <th className="py-2 px-3 text-right">Giá bán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-[11px] font-bold text-slate-700">
                        {existingVariants.length > 0 ? (
                          existingVariants.map((v, index) => {
                            const isHighlighted = activeVariantId === v.ma_bien_the;
                            return (
                              <tr
                                key={index}
                                onClick={() => handleSelectExistingVariant(v)}
                                className={`cursor-pointer transition duration-150 ${
                                  isHighlighted ? "bg-[#006c49]/5 text-[#006c49]" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className={`py-2 px-3 font-mono ${
                                  isHighlighted ? "text-[#006c49] font-black" : "text-amber-750"
                                }`}>
                                  {v.sku} {isHighlighted && "📍"}
                                </td>
                                <td className="py-2 px-3 font-mono text-right">
                                  {v.gia_ban_le
                                    ? Number(v.gia_ban_le).toLocaleString("vi-VN")
                                    : 0}đ
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              className="py-12 text-center text-gray-400 italic text-[11px]"
                            >
                              Sản phẩm cha chưa được gán bất kì biến thể SKU nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span>
                  Tổng quan hệ thống: <span className="text-slate-800 font-black">{existingVariants.length} phiên bản đang kết nối.</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </form>

      {/* POPUP THÊM ĐƠN VỊ MỚI */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#006c49]/5">
              <h2 className="text-sm font-black text-[#006c49] uppercase tracking-wider">
                Thêm Đơn Vị Đo Lường Mới
              </h2>
              <button
                onClick={() => setIsAddUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Tên đơn vị <span className="text-red-500">*</span>
                </label>
                <input
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  type="text"
                  placeholder="VD: Thùng, Lốc, Khay..."
                  className="w-full bg-slate-50 border border-gray-200 focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49]/20 p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddNewUnitSubmit}
                disabled={isSubmittingUnit}
                className="px-5 py-2 bg-[#006c49] text-white text-xs font-black rounded-lg shadow-md hover:bg-[#005137] transition"
              >
                Lưu lại
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* POPUP THÊM VỎ BIẾN THỂ ĐƠN */}
      {showSimpleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowSimpleModal(false)}
          ></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl relative z-10 border border-slate-100"
          >
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Plus size={16} className="text-[#006c49]" /> Thêm vỏ biến thể đơn
            </h3>
            <div className="space-y-3">
              <input
                placeholder="Tên biến thể hàng"
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#006c49]"
                value={simpleForm.ten_bien_the}
                onChange={(e) =>
                  setSimpleForm({ ...simpleForm, ten_bien_the: e.target.value })
                }
              />
              <input
                placeholder="Mã SKU"
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#006c49]"
                value={simpleForm.sku}
                onChange={(e) =>
                  setSimpleForm({ ...simpleForm, sku: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowSimpleModal(false)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-slate-800 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSimpleVariant}
                className="flex-1 py-2 bg-[#006c49] text-white rounded-lg text-xs font-black shadow-lg hover:bg-[#005137] transition"
              >
                Khởi tạo vỏ
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}

// Export default chính App component để hệ thống compiler vận hành chuẩn xác
export default function App() {
  return <SafeApp />;
}