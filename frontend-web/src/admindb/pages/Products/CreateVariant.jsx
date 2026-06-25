import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Plus, Trash2, Save, Layers, Tag, DollarSign, Package, FileText, CheckCircle
} from "lucide-react";
import axios from "axios";

export default function AdminCreateVariant() {
  const { id } = useParams(); // ID của sản phẩm cha
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);

  // --- STATE LƯU THÔNG TIN THƯƠNG MẠI BIẾN THỂ MỚI ĐANG KHỞI TẠO ---
  const [sku, setEditSku] = useState("");
  const [price, setEditPrice] = useState(0);
  const [stock, setEditStock] = useState(0);
  const [unit, setEditUnit] = useState("Chai");
  const [variantName, setEditVariantName] = useState("");
  const [saving, setSaving] = useState(false);

  // --- 🌟 STATE LƯU DANH SÁCH CÁC BIẾN THỂ ĐÃ CÓ TRONG DB ĐỂ HIỂN THỊ GIÁ ---
  const [existingVariants, setExistingVariants] = useState([]);

  // --- STATE MA TRẬN THUỘC TÍNH ĐỘNG (EAV MATRIX MANAGER) ---
  const [availableAttributes, setAvailableAttributes] = useState([]);

  // State hỗ trợ form thêm nhanh thuộc tính/giá trị mới trực tiếp trên UI
  const [newAttrName, setNewAttrName] = useState("");
  const [newValInputs, setNewValInputs] = useState({});

  useEffect(() => {
    const fetchAllMetadata = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        
        // Gọi song song API thông tin sản phẩm và API Ma trận nhãn thuộc tính thực tế từ DB
        const [productResponse, matrixResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/products/${id}`),
          axios.get(`${apiUrl}/api/products/attributes/matrix`).catch(() => ({ data: [] }))
        ]);

        let currentProductTitle = "Sản phẩm gốc";
        if (productResponse.data) {
          const data = Array.isArray(productResponse.data) ? productResponse.data[0] : productResponse.data;
          currentProductTitle = data.ten_san_pham || "Sản phẩm gốc";
          setProductName(currentProductTitle);
          
          // 🌟 BỐC DANH SÁCH BIẾN THỂ ĐÃ CÓ VÀ GIÁ TIỀN CỦA CHÚNG ĐỂ LÀM BẢNG TRA CỨU
          if (data.bien_the && data.bien_the.length > 0) {
            setExistingVariants(data.bien_the);
          }
        }

        // Xử lý nạp ma trận nhãn từ DB hoặc dùng bộ khung dự phòng nếu DB hoàn toàn trống
        if (matrixResponse.data && matrixResponse.data.length > 0) {
          setAvailableAttributes(matrixResponse.data);
          const comboText = matrixResponse.data.map(attr => attr.selected).filter(Boolean).join(" - ");
          setEditVariantName(`${currentProductTitle} - ${comboText}`);
        } else {
          const fallbackMock = [
            { id: 1, name: "Vị", values: ["Đào cam sả", "Ô long xoài"], selected: "Đào cam sả" },
            { id: 2, name: "Dung tích", values: ["350ml", "450ml", "455ml"], selected: "450ml" },
            { id: 3, name: "Quy chuẩn", values: ["Chai", "Thùng"], selected: "Chai" }
          ];
          setAvailableAttributes(fallbackMock);
          const comboText = fallbackMock.map(attr => attr.selected).filter(Boolean).join(" - ");
          setEditVariantName(`${currentProductTitle} - ${comboText}`);
        }

      } catch (err) {
        console.error("Lỗi đồng bộ cấu hình dữ liệu ma trận:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetadata();
  }, [id]);

  const updateVariantNameSuggestion = (productTitle, updatedAttributes) => {
    const comboText = updatedAttributes.map(attr => attr.selected).filter(Boolean).join(" - ");
    setEditVariantName(`${productTitle} ${comboText ? `- ${comboText}` : ""}`);
  };

  const handleSelectAttribute = (attrId, value) => {
    const updated = availableAttributes.map(attr => 
      attr.id === attrId ? { ...attr, selected: value } : attr
    );
    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
  };

  const handleAddNewValueToAttribute = (attrId) => {
    const valueText = newValInputs[attrId]?.trim();
    if (!valueText) return;

    const updated = availableAttributes.map(attr => {
      if (attr.id === attrId) {
        if (attr.values.includes(valueText)) {
          alert("Giá trị này đã tồn tại trong ma trận!");
          return attr;
        }
        return { ...attr, values: [...attr.values, valueText], selected: valueText };
      }
      return attr;
    });

    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
    setNewValInputs(prev => ({ ...prev, [attrId]: "" }));
  };

  const handleCreateNewAttributeGroup = () => {
    const groupName = newAttrName.trim();
    if (!groupName) return;
    
    if (availableAttributes.some(a => a.name.toLowerCase() === groupName.toLowerCase())) {
      return alert("Nhóm thuộc tính này đã tồn tại trên ma trận liên kết!");
    }

    const newGroup = { id: Date.now().toString(), name: groupName, values: [], selected: "" };
    setAvailableAttributes([...availableAttributes, newGroup]);
    setNewAttrName("");
  };

  const handleRemoveAttributeGroup = (attrId) => {
    const updated = availableAttributes.filter(a => a.id !== attrId);
    setAvailableAttributes(updated);
    updateVariantNameSuggestion(productName, updated);
  };

  const handleCreateVariant = async (e) => {
    e.preventDefault();
    if (!sku.trim()) return alert("Vui lòng điền mã định danh SKU!");
    if (price <= 0) return alert("Vui lòng nhập giá niêm yết lớn hơn 0đ!");

    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      
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
        }, {})
      };

      await axios.post(`${apiUrl}/api/products/${id}/variants`, payload);
      alert("🎉 Đã khởi tạo và đấu nối biến thể mới thành công vào Database!");
      navigate(-1);
    } catch (err) {
      console.error("Lỗi khởi tạo biến thể:", err);
      alert("Gặp sự cố khi lưu biến thể xuống DB. Vui lòng kiểm tra mã SKU trùng lặp!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang nạp cấu trúc dữ liệu ma trận...
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
      {/* HEADER QUAY LẠI */}
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thêm biến thể mới</h1>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              Sản phẩm cha: <span className="text-[#006c49]">{productName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* LAYOUT CHÍNH: 2 CỘT */}
      <form onSubmit={handleCreateVariant} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl">
        
        {/* CỘT TRÁI: CHỌN TAG LIÊN KẾT */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Tag size={16} className="text-amber-500" /> Bước 1: Thiết lập ma trận EAV liên kết
            </h3>
            
            <div className="space-y-5">
              {availableAttributes.map((attr) => (
                <div key={attr.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 relative group/box">
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
                    {attr.values && attr.values.map(val => {
                      const isSelected = attr.selected === val;
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => handleSelectAttribute(attr.id, val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            isSelected ? "bg-[#006c49] text-white border-[#006c49] shadow-sm" : "bg-white text-slate-600 border-gray-200 hover:bg-slate-100"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Thêm nhanh giá trị ${attr.name}...`}
                      value={newValInputs[attr.id] || ""}
                      onChange={(e) => setNewValInputs({ ...newValInputs, [attr.id]: e.target.value })}
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

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">✨ Khởi tạo nhóm thuộc tính mới</label>
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

        {/* CỘT PHẢI: NHẬP GIÁ MỚI & XEM TRƯỚC MA TRẬN GIÁ CŨ ĐÃ CÓ */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ô nhập thông số thương mại của phiên bản mới */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layers size={16} className="text-[#006c49]" /> Bước 2: Thông số thương mại của phiên bản mới
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase">Tên hiển thị phiên bản mới</label>
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
                  <label className="text-[11px] font-black text-gray-400 uppercase">Quy chuẩn đóng gói</label>
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
                className="bg-[#006c49] hover:bg-[#004f36] text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} /> {saving ? "Đang khởi tạo..." : "Kích hoạt tạo biến thể"}
              </button>
            </div>
          </div>

          {/* 🌟 3. BẢNG MA TRẬN ĐỐI CHIẾU GIÁ CỦA CÁC BIẾN THỂ ĐÃ CÓ TRONG HỆ THỐNG */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
              📊 Bảng đối chiếu ma trận định giá hiện hành (Existing Pricing Matrix)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Mã SKU</th>
                    <th className="py-2.5 px-2">Tên phiên bản hiện tại</th>
                    <th className="py-2.5 px-2 font-mono text-right">Giá niêm yết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-slate-700">
                  {existingVariants.length > 0 ? (
                    existingVariants.map((v, index) => (
                      <tr key={index} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-2 font-mono text-amber-700">{v.sku}</td>
                        <td className="py-3 px-2 text-slate-900">{v.ten_bien_the}</td>
                        <td className="py-3 px-2 font-mono text-right text-slate-900">
                          {Number(v.gia_ban_le).toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-400 italic text-[11px]">
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