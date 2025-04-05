// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// import authAPI from '../api/auth'; // Adjust path as needed
import authAPI from '@/api/auth';
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = authAPI.getCurrentUser();

  const markAsRead = useCallback((notificationId) => {
    // TODO: Implement API call to mark notification as read on the backend if needed
    // For now, just update frontend state
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
    );
    // Recalculate unread count
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    console.log(`Marked notification ${notificationId} as read (frontend only)`);
  }, []);

  const clearAll = useCallback(() => {
     // TODO: Implement API call to mark all as read or delete on backend if needed
     setNotifications([]);
     setUnreadCount(0);
     console.log('Cleared all notifications (frontend only)');
  }, []);

 console.log("useNotifications hook initialized", currentUser.id);
  useEffect(() => {
    if (!currentUser?._id) {
      console.warn("No user ID found, skipping socket connection.");
      return;
    }

    // Ensure previous socket is disconnected if user changes
    let socket;
    const connectSocket = () => {
        // Connect to the Socket.IO server
        // Replace with your actual backend URL/port
        socket = io(import.meta.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
          query: { userId: currentUser.id },
           reconnectionAttempts: 5, // Optional: Limit reconnection attempts
           reconnectionDelay: 3000, // Optional: Delay between attempts
        });

        console.log(`Attempting to connect socket for user ${currentUser.id}...`);

        socket.on("connect", () => {
          console.log(`Socket connected: ${socket.id} for user ${currentUser.id}`);
          setIsConnected(true);
           // TODO: Fetch initial notifications from an API endpoint upon connection if needed
           // e.g., fetchUnreadNotifications().then(data => { setNotifications(data.notifications); setUnreadCount(data.unreadCount); });
        });

        socket.on("disconnect", (reason) => {
          console.log(`Socket disconnected: ${reason}`);
          setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        // Listen for new notifications from the server
        socket.on("new_notification", (notification) => {
          console.log("Received new notification:", notification);
          setNotifications((prevNotifications) => [notification, ...prevNotifications]);
          if (!notification.isRead) {
            setUnreadCount((prevCount) => prevCount + 1);
          }
        });
    };

    connectSocket();

    // Cleanup function
    return () => {
      if (socket) {
          console.log("Disconnecting socket...");
          socket.disconnect();
          setIsConnected(false);
      }
    };
  }, [currentUser?.id]); // Depend only on userId

  return { notifications, unreadCount, isConnected, markAsRead, clearAll };
};