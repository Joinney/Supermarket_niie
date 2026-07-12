import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { warehouseApi } from "../../../../api/axios"; // Đường dẫn thực tế của bạn

const KhoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy mã kho từ URL (nếu đang ở trang Edit)
  const isEditMode = Boolean(id); // Nếu có ID thì là chế độ Sửa, ngược lại là Tạo

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ma_kho: "",
    ten_kho: "",
    dia_chi: "",
    hinh_anh: null,
    hinh_anh_preview: "",
  });

  // 🎯 NẾU LÀ CHẾ ĐỘ SỬA: Gọi API lấy thông tin kho cũ đắp lên Form
  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      // Gọi API danh sách kho để tìm kho đang cần sửa
      warehouseApi
        .get("/warehouses")
        .then((res) => {
          let data = [];
          if (res && Array.isArray(res)) data = res;
          else if (res?.data && Array.isArray(res.data)) data = res.data;
          else if (res?.data?.data && Array.isArray(res.data.data))
            data = res.data.data;

          const currentKho = data.find((w) => w.ma_kho === id);
          if (currentKho) {
            setFormData({
              ma_kho: currentKho.ma_kho,
              ten_kho: currentKho.ten_kho,
              dia_chi: currentKho.dia_chi,
              hinh_anh: null,
              hinh_anh_preview: "", // Backend chưa lưu ảnh nên tạm để trống
            });
          } else {
            alert("Không tìm thấy thông tin kho hàng!");
            navigate(-1); // Quay lại trang trước
          }
        })
        .catch((err) => console.error("Lỗi lấy dữ liệu kho:", err))
        .finally(() => setLoading(false));
    }
  }, [id, navigate, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        hinh_anh: file,
        hinh_anh_preview: URL.createObjectURL(file),
      }));
    }
  };

  // 🎯 SUBMIT DỮ LIỆU TỚI BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // API SỬA (Theo struct backend chỉ lấy ten_kho và dia_chi)
        await warehouseApi.put(`/warehouses/${id}`, {
          ten_kho: formData.ten_kho,
          dia_chi: formData.dia_chi,
        });
        alert("Cập nhật thông tin kho thành công!");
      } else {
        // API TẠO (Cần đẩy đủ ma_kho, ten_kho, dia_chi)
        await warehouseApi.post("/warehouses", {
          ma_kho: formData.ma_kho,
          ten_kho: formData.ten_kho,
          dia_chi: formData.dia_chi,
        });
        alert("Tạo kho hàng mới thành công!");
      }

      // Quay về trang danh sách kho sau khi thành công
      navigate("/admin/inventory/warehouse-list");
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
      if (error.response && error.response.status === 409) {
        alert("Mã kho này đã tồn tại trong hệ thống. Vui lòng nhập mã khác!");
      } else {
        alert(
          "Lỗi khi lưu thông tin kho: " +
            (error.response?.data?.error || error.message),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] p-4 font-sans text-gray-800 antialiased flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-4 text-left">
        {/* ---------------- TIÊU ĐỀ FORM ---------------- */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? `Chỉnh sửa kho: ${id}` : "Tạo kho hàng mới"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditMode
                ? "Cập nhật các thông tin vận hành của kho"
                : "Vui lòng điền đầy đủ thông tin cấu trúc kho hàng dưới đây"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ---------------- KHU VỰC ĐIỀN THÔNG TIN FORM ---------------- */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Trường: Mã kho */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mã kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ma_kho"
                required
                disabled={isEditMode} // Không cho sửa mã kho nếu đang ở chế độ Edit
                placeholder="Ví dụ: KHO-HCM-01"
                value={formData.ma_kho}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none font-mono font-bold transition ${isEditMode ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-[#006c49] focus:border-[#006c49]"}`}
              />
            </div>

            {/* 2. Trường: Tên kho */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tên kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ten_kho"
                required
                placeholder="Ví dụ: Kho Tổng Quận 1"
                value={formData.ten_kho}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#006c49] font-semibold transition"
              />
            </div>

            {/* 3. Trường: Địa chỉ */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dia_chi"
                required
                placeholder="Nhập số nhà, tên đường, phường, quận, thành phố..."
                value={formData.dia_chi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#006c49] font-medium transition"
              />
            </div>

            {/* 4. Trường: Hình ảnh (UI Only - BE chưa lưu) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Hình ảnh minh họa kho
              </label>
              <div className="flex items-center gap-4 border border-dashed border-gray-200 p-4 rounded-lg bg-slate-50/30">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#006c49] hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Hệ thống chấp nhận các định dạng phổ biến: JPG, PNG, WEBP
                  </p>
                </div>

                {formData.hinh_anh_preview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-inner flex-shrink-0">
                    <img
                      src={formData.hinh_anh_preview}
                      alt="Xem trước"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- KHU VỰC NÚT ĐIỀU HƯỚNG CHÂN FORM ---------------- */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#006c49] hover:bg-[#005237] cursor-pointer"}`}
            >
              {loading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  {isEditMode ? "Cập nhật kho" : "Lưu thông tin kho"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KhoForm;
