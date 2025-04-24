import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import useNotifications from "../../assets/hooks/useNotifications";

export default function GlobalNotification() {
  const { notifications, loading, error } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const sortedNotifications = notifications?.slice().sort((a, b) => {
    const aDate = new Date(`${a.date} ${a.time}`);
    const bDate = new Date(`${b.date} ${b.time}`);
    return bDate - aDate;
  });

  return (
    <div className="relative ml-auto">
      <button
        className="text-[#1A4D2E] relative"
        onClick={() => setShowNotifications((prev) => !prev)}
      >
        <Bell size={24} className="w-6 h-6 md:w-7 md:h-7" />
        {notifications?.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 w-[500px] bg-white text-black rounded-md shadow-lg max-h-[400px] overflow-y-auto z-50">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {notifications?.length > 0 && (
              <span className="text-sm bg-[#1a4d2e] text-white px-2 py-1 rounded-full">
                {notifications.length} new
              </span>
            )}
          </div>

          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a4d2e]"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-500 text-center">
                Error loading notifications
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No new notifications
              </div>
            ) : (
              <div className="space-y-2">
                {sortedNotifications?.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-3 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-[#1a4d2e] mb-1">
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[#1a4d2e]/70 bg-[#1a4d2e]/10 px-2 py-1 rounded-full">
                          {notif.time}
                        </span>
                        <span className="text-xs text-gray-500">
                          {notif.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
