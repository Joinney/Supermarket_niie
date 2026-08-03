import React, { useEffect, useState } from "react";
import { Package, BellOff, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Import notificationApi đã được cấu hình tự động nhận diện Gateway & Refresh Token
import { notificationApi } from "../../../api/axios";

// Hàm tự động xác định WebSocket URL dựa trên domain hiện tại của trình duyệt
const getWebSocketUrl = () => {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (isLocal) {
    return "http://localhost:8085/ws-notification";
  }
  
  // Trên Render Cloud: Kết nối trực tiếp qua HTTPS của Notification Service
  return "https://notification-service-sz4p.onrender.com/ws-notification";
};

const Tabthongbao = () => {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");

  // 🌟 STATE QUẢN LÝ PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Mặc định 5 thông báo / trang

  // Lấy userId hiện tại từ LocalStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = savedUser.id || savedUser._id || "1";
    setUserId(currentUserId);
  }, []);

  // 1. Tải danh sách thông báo qua API Gateway
  useEffect(() => {
    if (!userId) return;

    const fetchNotificationHistory = async () => {
      try {
        const response = await notificationApi.get(`/notifications/user/${userId}`);
        setNotifications(response.data || []);
      } catch (error) {
        console.error("Lỗi khi tải lịch sử thông báo:", error);
      }
    };

    fetchNotificationHistory();
  }, [userId]);

  // 2. Lắng nghe thông báo thời gian thực qua WebSockets (STOMP / SockJS)
  useEffect(() => {
    if (!userId) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()),
      reconnectDelay: 5000,
      debug: (str) => {
        if (window.location.hostname === "localhost") console.log(str);
      },
    });

    stompClient.onConnect = () => {
      console.log("🚀 WebSocket Notification connected!");

      stompClient.subscribe(`/topic/user/${userId}`, (message) => {
        if (message.body) {
          const newNoti = JSON.parse(message.body);
          console.log("🔔 Nhận được thông báo mới:", newNoti);

          // Thêm thông báo mới lên đầu và nhảy về trang 1
          setNotifications((prev) => [newNoti, ...prev]);
          setCurrentPage(1);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("🔥 Lỗi kết nối STOMP:", frame.headers["message"]);
    };

    stompClient.activate();

    return () => {
      if (stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [userId]);

  // Kiểm tra xem thông báo đã đọc hay chưa
  const checkIfRead = (noti) => {
    return noti.isRead === true || noti.read === true;
  };

  // Lấy ID chính xác từ DB
  const getNotificationId = (noti) => {
    return noti.id || noti._id;
  };

  // 3. Đánh dấu một thông báo là đã đọc
  const handleMarkAsRead = async (noti) => {
    const notiId = getNotificationId(noti);
    if (!notiId) return;

    try {
      await notificationApi.put(`/notifications/${notiId}/read`);
      setNotifications((prev) =>
        prev.map((n) => {
          const currentId = getNotificationId(n);
          if (currentId === notiId) {
            return { ...n, isRead: true, read: true };
          }
          return n;
        })
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đã đọc:", error);
    }
  };

  // 4. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      await notificationApi.put(`/notifications/user/${userId}/read-all`);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  const hasUnread = notifications.some((n) => !checkIfRead(n));

  // 🌟 LOGIC CẮT MẢNG DỮ LIỆU ĐỂ HỂN THỊ THEO TRANG (PAGINATION CALCULATION)
  const totalPages = Math.ceil(notifications.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans text-left">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Thông báo trung tâm</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Tổng số: <b className="text-emerald-700 font-bold">{notifications.length}</b> thông báo
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-2 px-3 rounded-xl border border-emerald-200/60 transition active:scale-95 cursor-pointer"
          >
            <CheckCheck size={16} />
            Đánh dấu đọc tất cả
          </button>
        )}
      </div>

      {/* Danh sách thông báo */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <BellOff size={48} className="mb-3 stroke-1 text-gray-300" />
          <p className="text-sm font-semibold">Không có thông báo nào mới.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentNotifications.map((noti) => {
            const isRead = checkIfRead(noti);
            const notiId = getNotificationId(noti);

            return (
              <div
                key={notiId || Math.random().toString()}
                onClick={() => !isRead && handleMarkAsRead(noti)}
                className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex gap-4 items-start shadow-xs ${
                  isRead
                    ? "bg-white border-gray-100 text-gray-500 hover:bg-gray-50/80"
                    : "bg-emerald-50/40 border-emerald-100/80 text-gray-800 hover:bg-emerald-50/70"
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    isRead ? "bg-gray-100 text-gray-400" : "bg-emerald-100 text-[#006c49]"
                  }`}
                >
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <h4 className="font-bold text-sm truncate">{noti.title}</h4>
                    <span className="text-[10px] text-gray-400 font-mono font-bold whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      {noti.createdAt 
                        ? new Date(noti.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).replace(`,`, ` -`)
                        : "Vừa xong"
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">{noti.description}</p>
                </div>
              </div>
            );
          })}

          {/* 🌟 THANH BẢNG ĐIỀU KHIỂN PHÂN TRANG (PAGINATION BAR) */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500">
            {/* Đổi số lượng item / trang */}
            <div className="flex items-center gap-2">
              <span>Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset về trang 1 khi đổi limit
                }}
                className="bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-lg px-2.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={5}>5 thông báo / trang</option>
                <option value={10}>10 thông báo / trang</option>
                <option value={20}>20 thông báo / trang</option>
              </select>
            </div>

            {/* Nút điều hướng trang */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-bold">
                Trang <b className="text-gray-800">{currentPage}</b> / {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tabthongbao;