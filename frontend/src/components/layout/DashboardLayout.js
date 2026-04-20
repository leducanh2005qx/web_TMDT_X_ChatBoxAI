import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, LogOut, LayoutDashboard, Users, UserCog,
  FileText, Package, ShoppingCart, PlusCircle, DollarSign,
  ClipboardCheck, Clock, CalendarDays, FileWarning, Ticket
} from 'lucide-react';

const ADMIN_MENU = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/admin/stats", label: "Doanh thu", icon: <DollarSign size={20} /> },
  { path: "/admin/users", label: "Người dùng", icon: <UserCog size={20} /> },
  { path: "/admin/system-logs", label: "Nhật ký hệ thống", icon: <FileWarning size={20} /> },
];

const MANAGER_MENU = [
  { path: "/manager/workspace", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/manager/orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
  { path: "/manager/inventory", label: "Kho", icon: <Package size={20} /> },
  { path: "/manager/add-product", label: "Thêm SP", icon: <PlusCircle size={20} /> },
  { path: "/manager/payroll", label: "Lương", icon: <DollarSign size={20} /> },
  { path: "/manager/approvals", label: "Duyệt đơn", icon: <ClipboardCheck size={20} /> },
  { path: "/manager/attendance", label: "Sửa chấm công", icon: <Clock size={20} /> },
  { path: "/manager/staff", label: "Nhân viên", icon: <Users size={20} /> },
  { path: "/manager/shifts", label: "Lịch ca", icon: <CalendarDays size={20} /> },
  { path: "/manager/vouchers", label: "Mã Giảm Giá", icon: <Ticket size={20} /> },
];

const STAFF_MENU = [
  { path: "/staff/workspace", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
  { path: "/staff/orders", label: "Đơn hàng", icon: <ShoppingCart size={20} /> },
  { path: "/staff/attendance", label: "Chấm công", icon: <Clock size={20} /> },
  { path: "/staff/requests", label: "Đơn xin", icon: <FileText size={20} /> },
  { path: "/staff/shifts", label: "Ca làm", icon: <CalendarDays size={20} /> },
  { path: "/staff/payroll", label: "Lương", icon: <DollarSign size={20} /> },
];

export default function DashboardLayout({ children, explicitRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Xử lý Role
  const currentRole = explicitRole || localStorage.getItem("role") || "USER";
  const userStr = localStorage.getItem("user");
  const userName = userStr ? JSON.parse(userStr).name : currentRole;

  let menuItems = [];
  if (currentRole.toUpperCase() === "ADMIN") menuItems = ADMIN_MENU;
  else if (currentRole.toUpperCase() === "MANAGER") menuItems = MANAGER_MENU;
  else if (currentRole.toUpperCase() === "STAFF") menuItems = STAFF_MENU;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside 
        className={`transition-all duration-300 ease-in-out bg-gray-900 text-white flex flex-col ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800 shrink-0">
          <div className="font-bold text-orange-500 tracking-wider flex items-center gap-2">
            <span className="text-2xl">🐯</span>
            {!collapsed && <span>TIGER SHOP</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-orange-500 text-white" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`
                }
                title={collapsed ? item.label : ""}
              >
                <div className="shrink-0">{item.icon}</div>
                {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">
          {!collapsed && <span>© 2026 TigerShop</span>}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-gray-800 hidden sm:block">
              {currentRole.toUpperCase()} PANEL
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm text-right">
                <div className="font-semibold text-gray-800">{userName}</div>
                <div className="text-xs text-gray-500">{currentRole.toUpperCase()}</div>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gray-200 mx-1"></div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-100"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
