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

  // Đồng hồ Real-time dùng cho lúc xuất bản in
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <>
      {/* 🌟 STYLE NÀY GIẢI QUYẾT TRIỆT ĐỂ LỖI KẸT LAYOUT KHI IN */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report-template, #pdf-report-template * { visibility: visible; }
          #pdf-report-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      {/* Main Wrapper */}
      <div className="w-full min-h-screen bg-[#f8fafc] font-sans text-left text-slate-800 p-4 md:p-6 antialiased print:bg-white print:p-0">
        {/* ------------------------------------------------------------------------- */}
        {/* 1. KHU VỰC GIAO DIỆN WEB (Bị ẩn hoàn toàn khi in qua thuộc tính print:hidden) */}
        {/* ------------------------------------------------------------------------- */}
        <div className="w-full print:hidden pb-10 space-y-8 animate-fadeIn">
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
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs focus:border-[#006c49] outline-none cursor-pointer shadow-sm"
                />
              </div>

              <button
                onClick={handlePrint}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
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
                <p className="text-2xl font-black text-slate-800">
                  {stats.late}
                </p>
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
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                      Giờ Check-in
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                      Giờ Check-out
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                      Số giờ làm
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-slate-700">
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
                        className="text-center py-10 font-medium text-slate-400 italic"
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
                        <td className="px-6 py-4 text-center font-mono text-slate-700">
                          {formatTime(record.check_in_time)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-700">
                          {record.check_out_time
                            ? formatTime(record.check_out_time)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-sm text-[#006c49]">
                          {record.work_hours > 0
                            ? `${record.work_hours}h`
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {record.status === "ON_TIME" && (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-black text-[10px] uppercase">
                              Đúng giờ
                            </span>
                          )}
                          {record.status === "LATE" && (
                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-black text-[10px] uppercase">
                              Đi trễ
                            </span>
                          )}
                          {record.status === "FORGOT_CHECKOUT" && (
                            <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-black text-[10px] uppercase">
                              Quên Checkout
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
        {/* 2. KHU VỰC BẢN IN PDF (Sẽ đè nổi lên trên cùng màn hình khi ấn in) */}
        {/* ------------------------------------------------------------------------- */}
        <div
          id="pdf-report-template"
          className="hidden bg-white text-black font-serif p-8"
        >
          {/* Header Báo Cáo */}
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center w-1/2">
              <h2 className="text-sm font-bold uppercase">
                CÔNG TY TNHH DEMI MART
              </h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">
                HỆ THỐNG QUẢN LÝ NHÂN SỰ
              </p>
            </div>
            <div className="text-center w-1/2">
              <h2 className="text-sm font-bold uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h2>
              <p className="text-xs font-bold underline decoration-solid underline-offset-4">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>
          </div>

          {/* Tiêu Đề */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">
              BÁO CÁO THỐNG KÊ CHẤM CÔNG
            </h1>
            <p className="text-sm italic text-gray-700">
              Ngày làm việc: {formatDateVN(selectedDate)} - Thời điểm kết xuất:{" "}
              {currentTime.toLocaleTimeString("vi-VN")}
            </p>
          </div>

          {/* I. Thống kê */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 uppercase">
              I. Thông số Tổng Quan
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
              <li>
                Tổng số nhân sự đi làm trong ngày:{" "}
                <span className="font-bold">
                  {stats.total_checked_in} người
                </span>
              </li>
              <li>
                Số nhân sự đi làm đúng giờ:{" "}
                <span className="font-bold">{stats.on_time} người</span>
              </li>
              <li>
                Số nhân sự đi trễ:{" "}
                <span className="font-bold text-rose-600">
                  {stats.late} người
                </span>
              </li>
              <li>
                Số nhân sự đã hoàn thành ca (ra ca):{" "}
                <span className="font-bold">{stats.completed} người</span>
              </li>
            </ul>
          </div>

          {/* II. Bảng Dữ Liệu */}
          <div>
            <h3 className="font-bold text-lg mb-2 uppercase">
              II. Chi tiết Bảng Công Nhân Sự
            </h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2 text-left">
                    Tên Nhân Viên / Vai trò
                  </th>
                  <th className="border border-black px-2 py-2 w-24">
                    Giờ Check-in
                  </th>
                  <th className="border border-black px-2 py-2 w-28">
                    Giờ Check-out
                  </th>
                  <th className="border border-black px-2 py-2 w-20">
                    Số giờ công
                  </th>
                  <th className="border border-black px-2 py-2 w-24">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="border border-black px-2 py-6 text-center italic text-gray-500"
                    >
                      Chưa có dữ liệu chấm công.
                    </td>
                  </tr>
                ) : (
                  records.map((r, index) => (
                    <tr key={r.id}>
                      <td className="border border-black px-2 py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-black px-2 py-2 text-left">
                        <p className="font-semibold">
                          {r.full_name || r.username}
                        </p>
                        <p className="text-[10px] text-gray-600 italic">
                          ({r.role})
                        </p>
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {formatTime(r.check_in_time)}
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {r.check_out_time
                          ? formatTime(r.check_out_time)
                          : "--:--"}
                      </td>
                      <td className="border border-black px-2 py-2 text-center font-semibold">
                        {r.work_hours > 0 ? r.work_hours : 0}
                      </td>
                      <td className="border border-black px-2 py-2 text-center italic text-xs">
                        {r.status === "LATE"
                          ? "Đi trễ"
                          : r.status === "FORGOT_CHECKOUT"
                            ? "Thiếu Checkout"
                            : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Chữ ký */}
          <div className="flex justify-between mt-16 pt-8 px-10">
            <div className="text-center">
              <p className="text-base font-bold">Người lập bảng</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
            <div className="text-center">
              <p className="text-sm italic mb-1">
                TP. Hồ Chí Minh, ngày {currentTime.getDate()} tháng{" "}
                {currentTime.getMonth() + 1} năm {currentTime.getFullYear()}
              </p>
              <p className="text-base font-bold">Quản lý / Giám đốc</p>
              <p className="text-xs italic mt-1">(Ký và đóng dấu)</p>
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
