// src/components/Notifications/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationPanel from './NotificationPanel';

const NotificationBell = ({ notifications, unreadCount, onMarkRead, onClearAll }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Close panel if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTriggerClick = () => {
    setPanelOpen(!panelOpen);
     // Optionally clear count when opening, or when clicking an item/clearing all
     // setUnreadCountLocal(0); // Or manage via props
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Icon Trigger */}
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="relative p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true"></span>
        )}
      </button>

      {/* Badge Count (Optional, can be combined with the dot) */}
      {/* {unreadCount > 0 && (
        <span className="ml-1 text-xs font-semibold text-red-600">({unreadCount})</span>
      )} */}

      {/* Notification Panel */}
      {panelOpen && (
        <div ref={panelRef}> {/* Attach ref here */}
          <NotificationPanel
            notifications={notifications}
            onClose={() => setPanelOpen(false)}
            onMarkRead={onMarkRead}
            onClearAll={onClearAll}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;