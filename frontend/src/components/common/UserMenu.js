import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { User, LogOut, KeyRound, Bell, ChevronDown } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function UserMenu({ textColor = "text-gray-800", unreadCount = 0 }) {
  const [user, setUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const displayName = user?.name || "Đức Anh";
  const avatarUrl = user?.avatar;
  const initial = displayName.charAt(0).toUpperCase();
  const roleName = (user?.role_name || localStorage.getItem("role") || "CUSTOMER").toUpperCase();

  return (
    <>
      <div className="relative inline-flex items-center z-50">
        <Menu as="div" className="relative">
          {/* ========== TRIGGER: Avatar + Tên + Role + Chevron ========== */}
          <Menu.Button
            className="flex items-center gap-2 focus:outline-none transition-opacity duration-200 hover:opacity-90"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-[2px] border-white/50 shadow-md"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-[2px] border-white/50 shadow-md"
                  style={{ background: "linear-gradient(135deg, #FF8C00, #FFA500)" }}
                >
                  <span className="text-white text-base font-bold leading-none select-none">
                    {initial}
                  </span>
                </div>
              )}
              {/* Badge đỏ — góc 2 giờ */}
              {unreadCount > 0 && (
                <span
                  className="absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold border-2 border-white shadow-sm"
                  style={{
                    top: "-3px",
                    right: "-3px",
                    minWidth: "18px",
                    height: "18px",
                    fontSize: "10px",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            {/* Tên + Role — CÙNG DÒNG với Avatar, KHÔNG nhảy xuống */}
            <div className="hidden sm:flex flex-col items-start leading-tight ml-1">
              <span className={`text-sm font-semibold truncate max-w-[120px] ${textColor}`}>
                {displayName}
              </span>
              <span 
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                {roleName}
              </span>
            </div>

            {/* Chevron Down */}
            <ChevronDown
              size={14}
              className={`hidden sm:block opacity-60 ${textColor}`}
            />
          </Menu.Button>

          {/* ========== DROPDOWN ========== */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95 -translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 -translate-y-1"
          >
            <Menu.Items className="absolute right-0 mt-[12px] w-60 origin-top-right rounded-[12px] bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] focus:outline-none overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">Đăng nhập với tên</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/notifications"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 no-underline group ${
                        active ? "text-[#FF8C00] bg-orange-50/50" : "text-gray-700"
                      }`}
                    >
                      <Bell size={16} className={`transition-colors duration-150 ${active ? "text-[#FF8C00]" : "text-[#64748b]"}`} />
                      Thông báo của tôi
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 no-underline group ${
                        active ? "text-[#FF8C00] bg-orange-50/50" : "text-gray-700"
                      }`}
                    >
                      <User size={16} className={`transition-colors duration-150 ${active ? "text-[#FF8C00]" : "text-[#64748b]"}`} />
                      Thông tin cá nhân
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors duration-150 group ${
                        active ? "text-[#FF8C00] bg-orange-50/50" : "text-gray-700"
                      }`}
                    >
                      <KeyRound size={16} className={`transition-colors duration-150 ${active ? "text-[#FF8C00]" : "text-[#64748b]"}`} />
                      Thay đổi mật khẩu
                    </button>
                  )}
                </Menu.Item>
              </div>

              {/* Divider + Logout */}
              <div className="border-t border-gray-100 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors duration-150 group ${
                        active ? "text-red-500 bg-red-50" : "text-red-500"
                      }`}
                    >
                      <LogOut size={16} className="text-red-400 group-hover:text-red-500 transition-colors" />
                      Đăng xuất
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        closeModal={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
