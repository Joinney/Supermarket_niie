import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Package, Tag, Info, CheckCheck, BellOff, X } from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";
import toast from "react-hot-toast";

// --- XỬ LÝ LẤY URL ĐỘNG TỪ BIẾN MÔI TRƯỜNG AN TOÀN CHO RENDER (HTTPS) ---
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_BACKEND_URL = isLocalhost
  ? "http://localhost:8085"
  : (import.meta.env.VITE_NOTIFICATION_API_URL || import.meta.env.VITE_AUTH_API_URL || "https://authservice-sz4p.onrender.com");

const NOTIFICATION_API_BASE = `${BASE_BACKEND_URL}/api/v1/notifications`;
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || `${BASE_BACKEND_URL}/ws-notification`;

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");
  const notiRef = useRef(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = savedUser.id || savedUser._id || "1";
    setUserId(currentUserId);
  }, []);

  // 1. Tải danh sách thông báo từ API (Có bọc try-catch chống crash)
  useEffect(() => {
    if (!userId) return;

    const fetchNotificationHistory = async () => {
      try {
        const response = await axios.get(`${NOTIFICATION_API_BASE}/user/${userId}`);
        setNotifications(response.data || []);
      } catch (error) {
        console.warn("Lỗi hoặc chưa kết nối được Notification Service:", error);
      }
    };

    fetchNotificationHistory();
  }, [userId]);

  // 🔔 Hàm hiển thị Toast nổi trên màn hình
  const showToastNotification = (noti) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
          } transition-all duration-300 max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border-l-4 border-l-[#006c49] z-[999999]`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006c49] flex items-center justify-center font-bold">
                  <Bell size={20} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {noti.title || "Thông báo mới"}
                </p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {noti.description || noti.message || ""}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-100 ml-3 pl-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none p-1 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ),
      { duration: 4000, position: "top-right" }
    );
  };

  // 2. Kết nối WebSocket & Bật Popup Toast (Bọc try-catch chống SecurityError)
  useEffect(() => {
    if (!userId) return;

    let stompClient = null;

    try {
      const socket = new SockJS(WEBSOCKET_URL);
      stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 10000, // Tăng delay reconnect lên 10s
        debug: (str) => {
          // Bỏ comment nếu muốn debug websocket: console.log(str);
        },
      });

      stompClient.onConnect = () => {
        console.log("WebSocket connected thành công!");
        stompClient.subscribe(`/topic/user/${userId}`, (message) => {
          if (message.body) {
            try {
              const newNoti = JSON.parse(message.body);
              setNotifications((prev) => [newNoti, ...prev]);
              showToastNotification(newNoti);
            } catch (e) {
              console.error("Lỗi parse dữ liệu WebSocket:", e);
            }
          }
        });
      };

      stompClient.onStompError = (frame) => {
        console.warn("Lỗi STOMP WebSocket:", frame.headers["message"]);
      };

      stompClient.activate();
    } catch (err) {
      console.warn("Không thể khởi tạo SockJS trên môi trường HTTPS hiện tại:", err);
    }

    return () => {
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [userId]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkIfRead = (noti) => noti.isRead === true || noti.read === true;
  const getNotificationId = (noti) => noti.id || noti._id;
  const unreadCount = notifications.filter((n) => !checkIfRead(n)).length;

  const markAsRead = async (noti) => {
    const notiId = getNotificationId(noti);
    if (!notiId || checkIfRead(noti)) return;

    try {
      await axios.put(`${NOTIFICATION_API_BASE}/${notiId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          getNotificationId(n) === notiId
            ? { ...n, isRead: true, read: true }
            : n
        )
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đã đọc:", error);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0 || unreadCount === 0) return;

    try {
      await axios.put(`${NOTIFICATION_API_BASE}/user/${userId}/read-all`);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return "Vừa xong";
    try {
      return new Date(createdAt)
        .toLocaleDateString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(",", " -");
    } catch (e) {
      return "Vừa xong";
    }
  };

  return (
    <div className="relative" ref={notiRef}>
      {/* Nút quả chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => {
          e.preventDefault();
          showToastNotification({
            title: "Thông báo thử nghiệm",
            description: "Toast nổi hoạt động bình thường và sẽ tự ẩn sau 4 giây!",
          });
        }}
        className="p-2 md:p-2.5 rounded-full text-slate-700 hover:bg-slate-100 transition-all relative active:scale-95 flex items-center justify-center"
        title="Thông báo (Nhấn chuột phải để test thử Toast)"
      >
        <Bell size={20} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menu Dropdown Thông báo */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn border-t-4 border-t-[#006c49]">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="bg-[#e6f0ed] text-[#006c49] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-[#006c49] hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const isRead = checkIfRead(item);
                const notiId = getNotificationId(item);

                return (
                  <div
                    key={notiId || Math.random().toString()}
                    onClick={() => markAsRead(item)}
                    className={`p-3.5 flex gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                      !isRead ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === "promo" ? (
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Tag size={16} />
                        </div>
                      ) : item.type === "system" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#006c49] flex items-center justify-center">
                          <Info size={16} />
                        </div>
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isRead
                              ? "bg-slate-100 text-slate-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <Package size={16} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            !isRead
                              ? "font-black text-slate-900"
                              : "font-semibold text-slate-600"
                          }`}
                        >
                          {item.title}
                        </p>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#006c49] flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        {formatTime(item.createdAt || item.time)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <BellOff size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Chưa có thông báo nào mới</p>
              </div>
            )}
          </div>

          <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100">
            <Link
              to="/profile/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#006c49] hover:underline block"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}