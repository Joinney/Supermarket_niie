import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, profile }) => {
  const [socket, setSocket] = useState(null);

  // 🌟 Lấy userId ra ngoài (để làm biến theo dõi)
  const userId = profile?.user_id || profile?.id;

  useEffect(() => {
    // Chỉ kết nối khi user đã đăng nhập
    if (!userId) return;

    const newSocket = io("http://localhost:5001", {
      query: { userId },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 [Demi Socket] Đã kết nối luồng Realtime!");
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 [Demi Socket] Đã ngắt kết nối.");
    });

    return () => {
      // 🌟 MẸO CHỐNG LỖI STRICT MODE:
      // Kiểm tra nếu socket đã kết nối thì ngắt, nếu đang kết nối dở thì đợi kết nối xong mới ngắt
      if (newSocket.connected) {
        newSocket.disconnect();
      } else {
        newSocket.once("connect", () => newSocket.disconnect());
      }
    };
  }, [userId]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};