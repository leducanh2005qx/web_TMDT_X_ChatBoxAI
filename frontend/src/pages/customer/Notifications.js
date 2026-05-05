import React, { useEffect, useState } from "react";
import { getNotifications, markNotificationsAsRead } from "../../services/api";
import { Bell, Package, Tag, MessageCircle } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API lấy danh sách và đồng thời đánh dấu đã đọc
    const fetchAndMark = async () => {
      try {
        const res = await getNotifications();
        setNotifications(res.notifications || []);
        
        // Đánh dấu đã đọc
        await markNotificationsAsRead();
        
        // Cập nhật lại giao diện (ẩn badge) bằng cách trigger một event hoặc để Header tự reload
        // Ở đây Header đang dùng isLogin để fetch 1 lần, chúng ta có thể cần reload hoặc dispatch event.
        // Tuy nhiên cách đơn giản nhất là kệ nó, khi đổi trang hoặc reload sẽ tự mất badge.
        // Để realtime hơn:
        window.dispatchEvent(new Event("notifications_read"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndMark();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "order": return <Package className="text-blue-500" />;
      case "voucher": return <Tag className="text-green-500" />;
      case "message": return <MessageCircle className="text-purple-500" />;
      default: return <Bell className="text-[#FF8C00]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="text-[#FF8C00]" /> Thông báo của tôi
      </h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải thông báo...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Bạn chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li 
                key={notif.id} 
                className={`p-4 hover:bg-orange-50 transition-colors flex gap-4 ${notif.is_read ? 'opacity-70' : 'bg-orange-50/30'}`}
              >
                <div className="mt-1 bg-white p-2 rounded-full border border-gray-100 shadow-sm h-fit">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="flex items-center">
                    <span className="h-2.5 w-2.5 bg-[#FF8C00] rounded-full"></span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
