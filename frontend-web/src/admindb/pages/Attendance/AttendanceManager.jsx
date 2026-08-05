import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Download,
  Search,
} from "lucide-react";
import { authApi } from "../../../api/axios";

export default function AttendanceManager() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_checked_in: 0,
    on_time: 0,
    late: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAttendances = async (date) => {
    setLoading(true);
    try {
      const url = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/attendance/all?date=${date}`
        : `http://localhost:5001/api/v1/auth/attendance/all?date=${date}`;

      const res = await authApi.get(url);
      if (res.data && res.data.success) {
        setRecords(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách chấm công:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances(selectedDate);
  }, [selectedDate]);

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateVN = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const filteredRecords = records.filter(
    (record) =>
      record.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    // 🌟 THÊM "print:p-0 print:m-0 print:max-w-full" để gỡ bỏ mọi giới hạn ép lề khi in
    <div className="p-6 xl:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn text-left font-['Plus_Jakarta_Sans',sans-serif] print:p-0 print:m-0 print:max-w-full print:space-y-0">
      {/* ------------------------------------------------------------------------- */}
      {/* 1. KHU VỰC GIAO DIỆN WEB (Sẽ tự động ẩn đi bằng print:hidden) */}
      {/* ------------------------------------------------------------------------- */}
      <div className="space-y-8 print:hidden">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
              Quản lý Chấm Công
            </h1>
            <p className="text-xs xl:text-sm text-slate-400 font-medium mt-1">
              Theo dõi trạng thái làm việc của toàn bộ nhân sự theo ngày
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <CalendarIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs focus:border-[#006c49] outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handlePrint}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Download size={16} /> Xuất Báo Cáo
            </button>
          </div>
        </div>

        {/* THỐNG KÊ (TOP CARDS) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Đã vào ca
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.total_checked_in}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Đúng giờ
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.on_time}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Đi trễ
              </p>
              <p className="text-2xl font-black text-slate-800">{stats.late}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Đã ra ca
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-slate-700 font-medium text-xs focus:bg-white focus:border-[#006c49] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Giờ vào (Check-in)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Giờ ra (Check-out)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                    Số giờ làm
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 text-slate-400"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-10 font-medium text-slate-400"
                    >
                      Không có dữ liệu chấm công cho ngày này.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {record.avatar_url ? (
                            <img
                              src={record.avatar_url}
                              alt="avt"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-xs">
                              {(record.full_name || record.username || "A")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {record.full_name || record.username}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                              {record.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-xs text-slate-700">
                        {formatTime(record.check_in_time)}
                      </td>
                      <td className="px-6 py-4 font-bold text-xs text-slate-700">
                        {record.check_out_time
                          ? formatTime(record.check_out_time)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-sm text-slate-800">
                        {record.work_hours > 0 ? `${record.work_hours}h` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {record.status === "ON_TIME" && (
                          <span className="text-emerald-600 font-black text-[10px] uppercase">
                            Đúng giờ
                          </span>
                        )}
                        {record.status === "LATE" && (
                          <span className="text-amber-600 font-black text-[10px] uppercase">
                            Đi trễ
                          </span>
                        )}
                        {record.status === "FORGOT_CHECKOUT" && (
                          <span className="text-rose-600 font-black text-[10px] uppercase">
                            Quên Check-out
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. KHU VỰC BẢN IN (Tự động lấp đầy trang nhờ "hidden print:block") */}
      {/* ------------------------------------------------------------------------- */}
      <div className="hidden print:block bg-white text-black font-['Times_New_Roman',serif] w-full">
        {/* Header chuẩn Quốc gia */}
        <div className="flex justify-between items-start pb-4 mb-6 border-b-2 border-black">
          <div className="text-center w-1/2">
            <p className="font-bold text-[16px] uppercase tracking-wide">
              CÔNG TY TNHH DEMI MART
            </p>
            <p className="text-[14px] italic font-semibold mt-1">
              Hệ thống quản lý nhân sự
            </p>
          </div>
          <div className="text-center w-1/2">
            <p className="font-bold text-[16px] uppercase tracking-wide">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="font-bold text-[15px] underline mt-1">
              Độc lập - Tự do - Hạnh phúc
            </p>
          </div>
        </div>

        {/* Tiêu đề Báo cáo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-widest">
            BÁO CÁO THỐNG KÊ CHẤM CÔNG
          </h2>
          <p className="text-[14px] italic mt-2 text-gray-700">
            Ngày làm việc: {formatDateVN(selectedDate)} - Thời điểm xuất:{" "}
            {new Date().toLocaleTimeString("vi-VN")}
          </p>
        </div>

        {/* I. Tổng quan */}
        <div className="mb-6">
          <h3 className="font-bold text-[16px] mb-2">I. THÔNG SỐ TỔNG QUAN</h3>
          <ul className="list-disc list-inside text-[15px] pl-4 space-y-1.5">
            <li>
              Tổng số nhân sự đi làm trong ngày:{" "}
              <b>{stats.total_checked_in} người</b>
            </li>
            <li>
              Số nhân sự đi làm đúng giờ: <b>{stats.on_time} người</b>
            </li>
            <li>
              Số nhân sự đi trễ: <b>{stats.late} người</b>
            </li>
            <li>
              Số nhân sự đã hoàn thành ca (ra ca):{" "}
              <b>{stats.completed} người</b>
            </li>
          </ul>
        </div>

        {/* II. Bảng chi tiết */}
        <div>
          <h3 className="font-bold text-[16px] mb-2">
            II. CHI TIẾT BẢNG CÔNG NHÂN SỰ
          </h3>
          <table className="w-full border-collapse border border-black text-[14px] text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-3 px-2 w-[5%]">STT</th>
                <th className="border border-black py-3 px-4 w-[35%] text-left">
                  Tên Nhân Viên / Vai trò
                </th>
                <th className="border border-black py-3 px-3 w-[15%]">
                  Giờ Check-in
                </th>
                <th className="border border-black py-3 px-3 w-[15%]">
                  Giờ Check-out
                </th>
                <th className="border border-black py-3 px-3 w-[12%]">
                  Số giờ
                </th>
                <th className="border border-black py-3 px-3 w-[18%]">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, index) => (
                <tr key={r.id}>
                  <td className="border border-black py-3 px-2">{index + 1}</td>
                  <td className="border border-black py-3 px-4 text-left">
                    <span className="font-bold block">
                      {r.full_name || r.username}
                    </span>
                    <span className="italic text-[12px] text-gray-600 block">
                      ({r.role})
                    </span>
                  </td>
                  <td className="border border-black py-3 px-3">
                    {formatTime(r.check_in_time)}
                  </td>
                  <td className="border border-black py-3 px-3">
                    {r.check_out_time ? formatTime(r.check_out_time) : "--:--"}
                  </td>
                  <td className="border border-black py-3 px-3 font-bold">
                    {r.work_hours > 0 ? r.work_hours : 0}
                  </td>
                  <td className="border border-black py-3 px-3 italic">
                    {r.status === "LATE"
                      ? "Đi trễ"
                      : r.status === "FORGOT_CHECKOUT"
                        ? "Thiếu checkout"
                        : ""}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="border border-black py-6">
                    Chưa có dữ liệu chấm công.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Chữ ký */}
        <div className="flex justify-between mt-12 px-16 text-[15px]">
          <div className="text-center">
            <p className="font-bold">Người lập bảng</p>
            <p className="italic mt-1">(Ký, ghi rõ họ tên)</p>
          </div>
          <div className="text-center">
            <p className="font-bold">Quản lý / Giám đốc</p>
            <p className="italic mt-1">(Ký, đóng dấu)</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 3. CSS ĐIỀU KHIỂN LOGIC IN ẤN (@page margin) */}
      {/* ------------------------------------------------------------------------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

        @media print {
          /* Định dạng khung in A4 chuẩn với lề cách đều 15mm */
          @page { 
              size: A4 portrait; 
              margin: 15mm; 
          }
          
          /* Ép in màu nền của thead (Dải màu xám trên cùng bảng) */
          * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
