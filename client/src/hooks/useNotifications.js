// // src/hooks/useNotifications.js
// import { useState, useEffect, useCallback } from 'react';
// import { io } from 'socket.io-client';

// // import authAPI from '../api/auth'; // Adjust path as needed
// import authAPI from '@/api/auth';
// export const useNotifications = () => {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isConnected, setIsConnected] = useState(false);
//   const currentUser = authAPI.getCurrentUser();

//   const markAsRead = useCallback((notificationId) => {
//     // TODO: Implement API call to mark notification as read on the backend if needed
//     // For now, just update frontend state
//     setNotifications((prev) =>
//       prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
//     );
//     // Recalculate unread count
//     setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
//     console.log(`Marked notification ${notificationId} as read (frontend only)`);
//   }, []);

//   const clearAll = useCallback(() => {
//      // TODO: Implement API call to mark all as read or delete on backend if needed
//      setNotifications([]);
//      setUnreadCount(0);
//      console.log('Cleared all notifications (frontend only)');
//   }, []);

//  console.log("useNotifications hook initialized", currentUser.id);
//   useEffect(() => {
//     if (!currentUser?._id) {
//       console.warn("No user ID found, skipping socket connection.");
//       return;
//     }

//     // Ensure previous socket is disconnected if user changes
//     let socket;
//     const connectSocket = () => {
//         // Connect to the Socket.IO server
//         // Replace with your actual backend URL/port
//         socket = io(import.meta.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
//           query: { userId: currentUser.id },
//            reconnectionAttempts: 5, // Optional: Limit reconnection attempts
//            reconnectionDelay: 3000, // Optional: Delay between attempts
//         });

//         console.log(`Attempting to connect socket for user ${currentUser.id}...`);

//         socket.on("connect", () => {
//           console.log(`Socket connected: ${socket.id} for user ${currentUser.id}`);
//           setIsConnected(true);
//            // TODO: Fetch initial notifications from an API endpoint upon connection if needed
//            // e.g., fetchUnreadNotifications().then(data => { setNotifications(data.notifications); setUnreadCount(data.unreadCount); });
//         });

//         socket.on("disconnect", (reason) => {
//           console.log(`Socket disconnected: ${reason}`);
//           setIsConnected(false);
//         });

//         socket.on("connect_error", (error) => {
//           console.error("Socket connection error:", error);
//           setIsConnected(false);
//         });

//         // Listen for new notifications from the server
//         socket.on("new_notification", (notification) => {
//           console.log("Received new notification:", notification);
//           setNotifications((prevNotifications) => [notification, ...prevNotifications]);
//           if (!notification.isRead) {
//             setUnreadCount((prevCount) => prevCount + 1);
//           }
//         });
//     };

//     connectSocket();

//     // Cleanup function
//     return () => {
//       if (socket) {
//           console.log("Disconnecting socket...");
//           socket.disconnect();
//           setIsConnected(false);
//       }
//     };
//   }, [currentUser?.id]); // Depend only on userId

//   return { notifications, unreadCount, isConnected, markAsRead, clearAll };
// };

// src/hooks/useNotifications.js (Modified Snippet)
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import authAPI from '@/api/auth'; // Assuming this path is correct
// import apiClient from '@/api/axios'; // Assuming you have an axios instance or use fetch
import apiClient from '@/APi/index'; // Adjust the import path as needed
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const currentUser = authAPI.getCurrentUser();
    const userToken = authAPI.getToken(); // Get token for API calls

    // --- Function to fetch initial notifications ---
    const fetchInitialNotifications = useCallback(async () => {
        if (!userToken) return; // Don't fetch if no token
        console.log('Fetching initial notifications...');
        try {
            // Use your preferred method to call the backend API (fetch, axios)
            // Ensure you include the Authorization header
            const response = await apiClient.get('/notifications', { // Use your API client instance
                 headers: {
                     Authorization: `Bearer ${userToken}`
                 }
            });
            // Assuming backend sends { status: 'success', unreadCount: X, data: { notifications: [...] }}
            if (response.data && response.data.status === 'success') {
                 console.log('Fetched notifications:', response.data);
                 setNotifications(response.data.data.notifications || []);
                 setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
             console.error("Error fetching initial notifications:", error.response?.data?.message || error.message);
             // Handle error appropriately (e.g., show error message to user)
             setNotifications([]); // Clear notifications on error? Or keep stale ones?
             setUnreadCount(0);
        }
    }, [userToken]); // Depend on userToken


    // Effect for Socket Connection
    useEffect(() => {
        if (!currentUser?._id) {
            console.warn("No user ID found (_id), skipping socket connection.");
            return;
        }

        let socket;
        const connectSocket = () => {
            const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
            socket = io(socketUrl, {
                query: { userId: currentUser._id },
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            });

            console.log(`Attempting to connect socket for user ${currentUser._id} to ${socketUrl}...`);

            socket.on("connect", () => {
                console.log(`Socket connected: ${socket.id} for user ${currentUser._id}`);
                setIsConnected(true);
                // <<<--- FETCH NOTIFICATIONS ON CONNECT --->>>
                fetchInitialNotifications();
            });

            socket.on("disconnect", (reason) => {
                 console.log(`Socket disconnected: ${reason}`);
                 setIsConnected(false);
            });

            socket.on("connect_error", (error) => {
                 console.error("Socket connection error:", error.message);
                 setIsConnected(false);
            });

            // Listen for new notifications (keep as is)
            socket.on("new_notification", (notification) => {
                 console.log("Received new notification:", notification);
                 setNotifications((prevNotifications) => [notification, ...prevNotifications]);
                 if (!notification.isRead) {
                     setUnreadCount((prevCount) => prevCount + 1);
                 }
            });

             // Optional: Listen for updates after marking read via API
             // socket.on('notification_read_update', (data) => {
             //   console.log('Received read update:', data);
             //   setUnreadCount(data.unreadCount);
             // });

        };

        connectSocket();

        // Cleanup
        return () => {
            if (socket) {
                console.log("Disconnecting socket...");
                socket.disconnect();
                setIsConnected(false);
            }
        };
    // Depend on _id and the fetch function (which depends on token)
    }, [currentUser?._id, fetchInitialNotifications]);

    // --- Modify markAsRead and clearAll to call backend API ---
     const markAsRead = useCallback(async (notificationId) => {
        // Optimistic UI update (update frontend state immediately)
        const previousNotifications = notifications;
        const targetIndex = notifications.findIndex(n => n._id === notificationId);
        if (targetIndex === -1 || notifications[targetIndex].isRead) return; // Already read or not found

        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => prev > 0 ? prev - 1 : 0);

        try {
            // Call backend API
            await apiClient.patch(`/notifications/${notificationId}/read`, {}, { // Empty body for PATCH
                headers: { Authorization: `Bearer ${userToken}` }
            });
            console.log(`Marked notification ${notificationId} as read on backend.`);
        } catch (error) {
            console.error("Error marking notification as read on backend:", error);
            // Revert UI changes if API call fails
            setNotifications(previousNotifications);
            setUnreadCount(prev => prev + 1); // Add count back
            // Optionally show error to user
        }
    }, [notifications, userToken]); // Depend on notifications state and token

    const clearAll = useCallback(async () => {
        // Optimistic UI update
        const previousNotifications = notifications;
        const previousCount = unreadCount;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); // Mark all as read visually
        setUnreadCount(0);

        try {
             // Call backend API to mark all as read
             await apiClient.patch('/notifications/readall', {}, {
                 headers: { Authorization: `Bearer ${userToken}` }
             });
             console.log('Cleared all notifications on backend (marked as read).');
             // Optionally remove them from frontend state after backend success if desired
             // setNotifications([]);
        } catch (error) {
            console.error("Error clearing all notifications on backend:", error);
            // Revert UI changes
            setNotifications(previousNotifications);
            setUnreadCount(previousCount);
        }
    }, [notifications, unreadCount, userToken]); // Depend on state and token


    // Return updated functions
    return { notifications, unreadCount, isConnected, markAsRead, clearAll };
};