// NotificationButton.jsx
import { useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationButton({
  notifications = [],
  loading,
  error,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="relative ml-auto">
      <button
        className="text-white relative"
        onClick={() => setShowNotifications((prev) => !prev)}
      >
        <Bell size={24} className="w-6 h-6 md:w-7 md:h-7" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 w-[420px] bg-white text-black rounded-md shadow-lg max-h-[400px] overflow-y-auto z-50">
          <h3 className="font-semibold px-4 py-2 border-b">Notifications</h3>

          {loading ? (
            <p className="px-4 py-2">Loading...</p>
          ) : error ? (
            <p className="px-4 py-2 text-red-500">
              Error loading notifications
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-2">No new notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex justify-between items-center bg-gray-200 rounded-md px-4 py-2 mb-2 mx-2"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">{notif.title}</p>
                  <p className="text-sm text-gray-700 truncate">
                    {notif.message}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600 whitespace-nowrap px-4">
                  <p>{notif.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
