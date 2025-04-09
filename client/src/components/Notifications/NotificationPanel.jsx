// src/components/Notifications/NotificationPanel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

// Helper to format time difference
const timeSince = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};


const NotificationPanel = ({ notifications, onClose, onMarkRead, onClearAll }) => {
    const navigate = useNavigate();
     console.log("Rendering NotificationPanel with notifications:", notifications);
    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            onMarkRead(notification._id); // Mark as read when clicked
        }
        if (notification.link) {
            navigate(notification.link); // Navigate if link exists
        }
        onClose(); // Close panel after interaction
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="py-1">
                <div className="flex justify-between items-center px-4 py-2 border-b">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                         <button
                            onClick={onClearAll}
                            className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
                            title="Clear all notifications"
                         >
                            <TrashIcon className="h-5 w-5"/>
                         </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No new notifications</p>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`block px-4 py-3 text-sm text-gray-700 border-b cursor-pointer hover:bg-gray-100 ${!notification.isRead ? 'bg-indigo-50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <p className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {timeSince(notification.createdAt)}
                                     {/* Optional: Mark as read button */}
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMarkRead(notification._id); }}
                                            className="ml-2 text-indigo-500 hover:text-indigo-700 inline-flex items-center"
                                            title="Mark as read"
                                        >
                                            <EyeIcon className="h-4 w-4 mr-1" /> Read
                                        </button>
                                    )}
                                </p>
                            </div>
                        ))
                    )}
                </div>
                 {/* Optional Footer */}
                {/* <div className="px-4 py-2 border-t">
                     <button className="text-sm text-indigo-600 hover:text-indigo-800 w-full text-center">
                         View All Notifications
                     </button>
                 </div> */}
            </div>
        </div>
    );
};

export default NotificationPanel;