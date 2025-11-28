/* eslint-disable no-unused-vars */
// File: src/components/AdminSidebar.jsx

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";


// --- ICONS ---
const Icons = {
  Grid: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Chart: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>,
  UserGroup: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bulb: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 12 4a4.65 4.65 0 0 0-4.5 7.5c.76.76 1.23 1.52 1.41 2.5"/></svg>,
  Warning: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Building: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="22" x2="12" y2="22.01"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>,
  Dollar: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  SubItemDot: () => <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
};

export default function AdminSidebar(props) {
  const user = props?.user || {};
  const location = useLocation();
  const cur = location?.pathname || "";

  // Menu Definition
  const menuStructure = [
    {
      id: "dashboard",
      icon: <Icons.Grid />,
      label: "Dashboards",
      items: [
        { path: "/", label: "Main Dashboard", icon: <Icons.Chart /> },
        { path: user?.role === 'admin' ? "/admin" : "/manager", label: "Widget Dashboard", icon: <Icons.Grid /> },
      ]
    },
    {
      id: "company",
      icon: <Icons.Building />,
      label: "Company",
      items: [
        { path: user?.role === 'manager' ? "/hotels" : "/admin/hotels", label: "Companies", icon: <Icons.Building /> },
        { path: user?.role === 'manager' ? "/manager/staff" : "/admin/users", label: "Employees List", icon: <Icons.UserGroup /> },
        { path: "/admin/staff-grid", label: "Employee Grid", icon: <Icons.SubItemDot /> },
        { path: "/admin/staff-details", label: "Employee Details", icon: <Icons.SubItemDot /> },
      ]
    },
    {
      id: "projects",
      icon: <Icons.Bulb />,
      label: "Projects",
      items: [
        { path: (user?.role === 'manager' ? "/manager/reports" : "/admin/reports") + "/task", label: "Task Report", icon: <Icons.SubItemDot /> },
        { path: (user?.role === 'manager' ? "/manager/reports" : "/admin/reports") + "/daily", label: "Daily Report", icon: <Icons.SubItemDot /> },
        { path: "/admin/tickets", label: "Tickets", icon: <Icons.Warning /> },
        { path: "/tasks", label: "My Tasks", icon: <Icons.SubItemDot /> },
      ]
    },
    {
      id: "hr",
      icon: <Icons.UserGroup />,
      label: "HR",
      items: [
        { path: user?.role === 'manager' ? "/manager/holidays" : "/admin/holidays", label: "Holidays", icon: <Icons.SubItemDot /> },
        { path: "/admin/attendance", label: "Attendance", icon: <Icons.SubItemDot /> },
        { path: "/admin/timesheets", label: "Timesheets", icon: <Icons.SubItemDot /> },
        { path: "/performance", label: "Performance", icon: <Icons.Chart /> },
        { path: "/training", label: "Training", icon: <Icons.SubItemDot /> },
      ]
    },
    {
      id: "finance",
      icon: <Icons.Dollar />,
      label: "Finance",
      items: [
         { path: "/admin/overtime", label: "Overtime", icon: <Icons.SubItemDot /> },
         { path: "/admin/payroll", label: "Payroll", icon: <Icons.SubItemDot /> },
      ]
    },
    {
      id: "system",
      icon: <Icons.Shield />,
      label: "System",
      items: [
        { path: "/profile", label: "Profile", icon: <Icons.SubItemDot /> },
        { path: "/notifications", label: "Notifications", icon: <Icons.SubItemDot /> },
        { path: "/settings", label: "Settings", icon: <Icons.SubItemDot /> },
      ]
    },
  ];

  // FIX 1: State defaults to null (CLOSED) instead of checking URL on mount
  const [activeCategory, setActiveCategory] = useState(null);

  // FIX 2: Removed the useEffect that auto-opened the menu. 
  // Now the sidebar always starts closed.

  // Toggle Logic: Clicking icon toggles that menu
  const handleToggle = (id) => {
    if (activeCategory === id) {
      setActiveCategory(null); // Close if clicking active
    } else {
      setActiveCategory(id); // Open if clicking new
    }
  };

  // Function to check if a category is active based on URL (for icon styling only)
  const isCategoryRouteActive = (items) => {
    return items.some(item => cur === item.path || (item.path !== '/' && cur.startsWith(item.path)));
  };

  const getSubLinkClass = (path) => {
    const isActive = cur === path || (path !== "/" && cur.startsWith(path));
    return isActive 
      ? "text-[#EA580C] font-semibold bg-orange-50" 
      : "text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50";
  };

  return (
    <div className="flex h-full bg-white relative z-40">
      
      {/* =======================
          COLUMN 1: ICON RAIL
          ======================= */}
      <div className="w-[80px] border-r border-gray-200 flex flex-col items-center py-5 bg-white z-50 shrink-0 h-full">
        
        {/* Top Logo (SD) */}
        {/* <div className="mb-8 cursor-pointer" onClick={() => window.location.href = "/"}>
          <img src={logo} alt="SD" className="w-9 h-9 object-contain" /> 
        </div> */}

        {/* Icons */}
        <div className="flex flex-col gap-6 w-full items-center">
          {menuStructure.map((cat) => {
            // Icon is "active" if the drawer is open for it OR if we are currently on a page inside it
            const isOpen = activeCategory === cat.id;
            const isContextActive = isCategoryRouteActive(cat.items);

            return (
              <button
                key={cat.id}
                onClick={() => handleToggle(cat.id)}
                title={cat.label}
                className="relative group focus:outline-none"
              >
                {/* Active Indicator Dot (Top Right) */}
                {(isOpen || isContextActive) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#EA580C] rounded-full border-2 border-white translate-x-1 -translate-y-1 z-10"></span>
                )}

                {/* Icon Box */}
                <div 
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isOpen 
                      ? "bg-orange-50 text-[#EA580C] shadow-sm ring-1 ring-orange-100" // Open State
                      : isContextActive 
                        ? "text-[#EA580C] bg-gray-50" // Context Active (Closed but on page)
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50" // Default
                    }
                  `}
                >
                  {cat.icon}
                </div>
                
                {/* Hover Tooltip (Only visible if panel is closed) */}
                {!activeCategory && (
                   <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {cat.label}
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================
          COLUMN 2: SLIDE-OUT PANEL
          ======================= */}
      <div 
        className={`
          bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${activeCategory ? "w-64 opacity-100" : "w-0 opacity-0"}
        `}
      >
        {/* Content Wrapper */}
        <div className="w-64 flex flex-col h-full">
            
            {/* Header */}
            <div className="h-[70px] flex items-center px-6 border-b border-gray-50 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 truncate">
                    {menuStructure.find(m => m.id === activeCategory)?.label || "Menu"}
                </h2>
            </div>

            {/* Sub Menu Links */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
                {menuStructure.find(m => m.id === activeCategory)?.items.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.path}
                      onClick={() => setActiveCategory(null)} // FIX 3: Close sidebar on click
                      className={`
                          flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors mb-1 whitespace-nowrap
                          ${getSubLinkClass(item.path)}
                      `}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${cur === item.path ? 'text-[#EA580C]' : 'text-gray-400'}`}>
                          {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-gray-50 text-xs text-gray-400 shrink-0">
                © 2025 SD Commercial
            </div>
        </div>
      </div>

    </div>
  );
}