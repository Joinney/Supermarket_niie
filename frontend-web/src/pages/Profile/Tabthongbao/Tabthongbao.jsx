import React, { useEffect, useState } from "react";
import { Package, BellOff, CheckCheck } from "lucide-react";
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

  // Lấy userId hiện tại từ LocalStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = savedUser.id || savedUser._id || "1";
    setUserId(currentUserId);
  }, []);

  // 1. Tải danh sách thông báo qua API Gateway (Sử dụng notificationApi từ axios.js)
  useEffect(() => {
    if (!userId) return;

    const fetchNotificationHistory = async () => {
      try {
        // Tự động gọi: /api/v1/notifications/user/{userId} qua Gateway
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

          setNotifications((prev) => [newNoti, ...prev]);
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

  // 3. Đánh dấu một thông báo là đã đọc (Sử dụng notificationApi)
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

  // 4. Đánh dấu tất cả là đã đọc (Sử dụng notificationApi)
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Thông báo trung tâm</h2>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
          >
            <CheckCheck size={16} />
            Đọc tất cả
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BellOff size={48} className="mb-3 stroke-1" />
          <p className="text-sm">Không có thông báo nào mới.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((noti) => {
            const isRead = checkIfRead(noti);
            const notiId = getNotificationId(noti);

            return (
              <div
                key={notiId || Math.random().toString()}
                onClick={() => !isRead && handleMarkAsRead(noti)}
                className={`p-4 rounded-xl border transition cursor-pointer flex gap-4 items-start ${
                  isRead
                    ? "bg-gray-50 border-gray-100 text-gray-500"
                    : "bg-emerald-50/40 border-emerald-100/70 text-gray-800 hover:bg-emerald-50/70"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${
                    isRead ? "bg-gray-100 text-gray-400" : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <h4 className="font-semibold text-sm truncate">{noti.title}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {noti.createdAt 
                        ? new Date(noti.createdAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          }).replace(`,`, ` -`)
                        : "Vừa xong"
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{noti.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tabthongbao;