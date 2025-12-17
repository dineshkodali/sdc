/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// File: src/components/AdminSidebar.jsx

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// --- ICONS ---
const Icons = {
  Grid: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Chart: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  UserGroup: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Bulb: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 12 4a4.65 4.65 0 0 0-4.5 7.5c.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  ),
  Warning: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Shield: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Building: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="22.01" />
      <line x1="15" y1="22" x2="15" y2="22.01" />
      <line x1="12" y1="22" x2="12" y2="22.01" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="8" y1="6" x2="8" y2="6.01" />
      <line x1="16" y1="6" x2="16" y2="6.01" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="16" y1="14" x2="16" y2="14.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
      <line x1="16" y1="18" x2="16" y2="18.01" />
    </svg>
  ),
  Dollar: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Clipboard: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  Wrench: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Calender: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  RadioDot: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Comment: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  ),
  Briefcase: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  Notification: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />{" "}
      <path d="M13.73 21a2 2 0 0 1-3.46 0" /> <circle cx="18" cy="6" r="3" />
    </svg>
  ),
  HardHat: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13a9 9 0 0 1 18 0v3H3v-3z" />
      <path d="M12 4v6" />
      <path d="M7 7a5 5 0 0 1 10 0" />
      <path d="M3 16h18" />
    </svg>
  ),
  InfoShield: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Info: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="12" y1="7" x2="12.01" y2="7" />
    </svg>
  ),
  Education: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 4 3 6 3s6-1.5 6-3v-5" />
    </svg>
  ),
  Checklist: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <path d="M9 12l2 2 4-4" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  ),
    Person: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),

  InfoCircle: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),

  Heart: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),

  Network: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="5" y2="16" />
      <line x1="12" y1="8" x2="19" y2="16" />
    </svg>
  ),





  // SU Data Icons
  BarChart: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  PieChart: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Home: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Utensils: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  Upload: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  FileText: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),

  SubItemDot: () => (
    <span className="block w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
  ),
};

export default function AdminSidebar(props) {
  const user = props?.user || {};
  const location = useLocation();
  // include search so paths with query params are considered active
  const cur = (location?.pathname || "") + (location?.search || "");
  const navigate = useNavigate();

  // Menu Definition
  const menuStructure = [
    {
      id: "dashboard",
      icon: <Icons.Grid />,
      label: "Dashboards",
      items: [
        { path: "/", label: "Main Dashboard", icon: <Icons.Chart /> },
        {
          path: user?.role === "admin" ? "/admin" : "/manager",
          label: "Widget Dashboard",
          icon: <Icons.Grid />,
        },
      ],
    },
    {
      id: "su_data",
      icon: <Icons.UserGroup />,
      label: "SU Data",
      items: [
        // --- Service Users List (Links to ServiceUsersList.jsx) ---
        {
          path: "/su/users",
          label: "Service Users",
          icon: <Icons.UserGroup />,
        },
        // --- REMOVED "Add Service User" button here ---

        { path: "/su/analytics", label: "Analytics", icon: <Icons.BarChart /> },
        {
          path: "/su/demographics",
          label: "Demographics",
          icon: <Icons.PieChart />,
        },
        {
          path: "/su/accommodation",
          label: "Accommodation",
          icon: <Icons.Clock />,
        },
        { path: "/su/move-in-out", label: "Move-In/Out", icon: <Icons.Home /> },
        { path: "/su/meals", label: "Meals", icon: <Icons.Utensils /> },
        { path: "/su/ppar", label: "PPAR Upload", icon: <Icons.Upload /> },
        { path: "/su/reports", label: "Reports", icon: <Icons.FileText /> },
      ],
    },
    {
      id: "company",
      icon: <Icons.Building />,
      label: "Property",
      items: [
        {
          path: user?.role === "manager" ? "/hotels" : "/admin/hotels",
          label: "Properties",
          icon: <Icons.Building />,
        },
        {
          path: user?.role === "manager" ? "/hotels" : "/admin/bookings",
          label: "Bookings",
          icon: <Icons.Calender />,
        },
        {
          path: user?.role === "manager" ? "/manager/staff" : "/admin/users",
          label: "Employees List",
          icon: <Icons.UserGroup />,
        },
        {
          path: "/admin/staff-grid",
          label: "Employee Grid",
          icon: <Icons.SubItemDot />,
        },
        {
          path: "/admin/staff-details",
          label: "Employee Details",
          icon: <Icons.SubItemDot />,
        },
      ],
    },
    {
      id: "inspections",
      icon: <Icons.Clipboard />,
      label: "Operation Hub",
      items: [
        {
          path: "/admin/inspections",
          label: "Inspections",
          icon: <Icons.Clipboard />,
        },
        {
          path: "/admin/incidents",
          label: "Incidents",
          icon: <Icons.Warning />,
        },
        {
          path: "/admin/compliance",
          label: "Compliance",
          icon: <Icons.Shield />,
        },
        // maintenance item uses fallback paths logic in render
        {
          path: "/admin/maintenance",
          label: "Maintenance",
          icon: <Icons.Wrench />,
        },
        {
          path: "/admin/aire-tasks",
          label: "AIRE Tasks",
          icon: <Icons.Clipboard />,
        },
        {
          label: "Safeguarding",
          icon: <Icons.Shield />,
          children: [
            {
              path: "/admin/safeguarding/referrals",
              label: "Referrals",
              icon: <Icons.Person />,
            },
            {
              path: "/admin/safeguarding/risk-assessment",
              label: "Risk Assessment",
              icon: <Icons.Warning />,
            },
            {
              path: "/admin/safeguarding/vulnerable-users",
              label: "Vulnerable Users",
              icon: <Icons.Heart />,
            },
            {
              path: "/admin/safeguarding/multi-agency",
              label: "Multi-Agency",
              icon: <Icons.Briefcase />,
            },
          ],
        },

        {
          path: "/admin/migranthelp",
          label: "Migrant Help",
          icon: <Icons.RadioDot />,
        },
      ],
    },
    {
      id: "esclations",
      icon: <Icons.Warning />,
      label: "Escalations",
      items: [
        {
          path: "/admin/incidents",
          label: "Incidents",
          icon: <Icons.Warning />,
        },
        {
          path: "/admin/complaints",
          label: "Complaints",
          icon: <Icons.Comment />,
        },
        {
          path: "/admin/vcsorganizations",
          label: "VCS Organizations",
          icon: <Icons.Building />,
        },
        // maintenance item uses fallback paths logic in render
        {
          path: "/admin/casemanagement",
          label: "Case Management",
          icon: <Icons.Briefcase />,
        },
        {
          path: "/admin/emergencyprotocols",
          label: "Emergency Protocols",
          icon: <Icons.Notification />,
        },
      ],
    },
    {
      id: "hse",
      icon: <Icons.HardHat />,
      label: "HSE",
      items: [
        {
          path: "/admin/hseincidents",
          label: "HSE Incidents",
          icon: <Icons.InfoShield />,
        },
        {
          path: "/admin/riskmanagement",
          label: "Risk Management",
          icon: <Icons.Info />,
        },
        {
          path: "/admin/training",
          label: "Training",
          icon: <Icons.Education />,
        },
        { path: "/admin/audits", label: "Audits", icon: <Icons.Checklist /> },
      ],
    },
    {
      id: "projects",
      icon: <Icons.Bulb />,
      label: "Projects",
      items: [
        {
          path:
            (user?.role === "manager" ? "/manager/reports" : "/admin/reports") +
            "/task",
          label: "Task Report",
          icon: <Icons.SubItemDot />,
        },
        {
          path:
            (user?.role === "manager" ? "/manager/reports" : "/admin/reports") +
            "/daily",
          label: "Daily Report",
          icon: <Icons.SubItemDot />,
        },
        { path: "/admin/tickets", label: "Tickets", icon: <Icons.Warning /> },
        { path: "/tasks", label: "My Tasks", icon: <Icons.SubItemDot /> },
      ],
    },
    {
      id: "hr",
      icon: <Icons.UserGroup />,
      label: "HR",
      items: [
        {
          path:
            user?.role === "manager" ? "/manager/holidays" : "/admin/holidays",
          label: "Holidays",
          icon: <Icons.SubItemDot />,
        },
        {
          path: "/admin/attendance",
          label: "Attendance",
          icon: <Icons.SubItemDot />,
        },
        {
          path: "/admin/timesheets",
          label: "Timesheets",
          icon: <Icons.SubItemDot />,
        },
        { path: "/performance", label: "Performance", icon: <Icons.Chart /> },
        { path: "/training", label: "Training", icon: <Icons.SubItemDot /> },
      ],
    },
    {
      id: "finance",
      icon: <Icons.Dollar />,
      label: "Finance",
      items: [
        {
          path: "/admin/overtime",
          label: "Overtime",
          icon: <Icons.SubItemDot />,
        },
        {
          path: "/admin/payroll",
          label: "Payroll",
          icon: <Icons.SubItemDot />,
        },
      ],
    },
    {
      id: "system",
      icon: <Icons.Shield />,
      label: "System",
      items: [
        { path: "/profile", label: "Profile", icon: <Icons.SubItemDot /> },
        {
          path: "/notifications",
          label: "Notifications",
          icon: <Icons.SubItemDot />,
        },
        { path: "/settings", label: "Settings", icon: <Icons.SubItemDot /> },
      ],
    },
  ];

  // State defaults to null (CLOSED)
  const [activeCategory, setActiveCategory] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);

  // Toggle Logic
  const handleToggle = (id) => {
    if (activeCategory === id) setActiveCategory(null);
    else setActiveCategory(id);
  };

  const isCategoryRouteActive = (items) => {
    if (!Array.isArray(items)) return false;
    return items.some(
      (item) =>
        item &&
        item.path &&
        (cur === item.path || (item.path !== "/" && cur.startsWith(item.path)))
    );
  };

  const getSubLinkClass = (path) => {
    const isActive = cur === path || (path !== "/" && cur.startsWith(path));
    return isActive
      ? "text-[#EA580C] font-semibold bg-orange-50"
      : "text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50";
  };

  // Generic fallback navigator: try multiple candidate paths and stop when router matches one.
  const tryNavigateWithFallbacks = async (candidates = []) => {
    const list = Array.from(new Set((candidates || []).filter(Boolean)));

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      try {
        navigate(p);
      } catch (e) {
        try {
          window.location.href = p;
        } catch (_) {}
      }
      await new Promise((res) => setTimeout(res, 120));
      const current = window.location.pathname || "";
      if (current === p || (p !== "/" && current.startsWith(p))) {
        setTimeout(() => setActiveCategory(null), 80);
        return;
      }
    }
    setTimeout(() => setActiveCategory(null), 80);
  };

  return (
    <div className="flex h-full bg-white relative z-40">
      {/* ICON RAIL */}
      <div className="w-[80px] border-r border-gray-200 flex flex-col items-center py-5 bg-white z-50 shrink-0 h-full">
        <div className="flex flex-col gap-6 w-full items-center">
          {menuStructure.map((cat) => {
            const isOpen = activeCategory === cat.id;
            const isContextActive = isCategoryRouteActive(cat.items);

            return (
              <button
                key={cat.id}
                onClick={() => handleToggle(cat.id)}
                title={cat.label}
                className="relative group focus:outline-none"
              >
                {(isOpen || isContextActive) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#EA580C] rounded-full border-2 border-white translate-x-1 -translate-y-1 z-10"></span>
                )}

                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                    ${
                      isOpen
                        ? "bg-orange-50 text-[#EA580C] shadow-sm ring-1 ring-orange-100"
                        : isContextActive
                        ? "text-[#EA580C] bg-gray-50"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  {cat.icon}
                </div>

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

      {/* SLIDE-OUT PANEL */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          activeCategory ? "w-64 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="w-64 flex flex-col h-full">
          <div className="h-[70px] flex items-center px-6 border-b border-gray-50 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">
              {menuStructure.find((m) => m.id === activeCategory)?.label ||
                "Menu"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
            {(() => {
              const menu = menuStructure.find((m) => m.id === activeCategory);
              if (!menu || !Array.isArray(menu.items))
                return <div className="text-xs text-gray-400">No items</div>;

              return menu.items.map((item, idx) => {
                const hasChildren = Array.isArray(item.children);
                const lowerLabel = (item.label || "").toLowerCase();
                const lowerPath = (item.path || "").toLowerCase();

                const isMaintenance =
                  lowerLabel.includes("maintenance") ||
                  lowerPath.includes("maintenance");

                const isCompliance =
                  lowerLabel.includes("compliance") ||
                  lowerPath.includes("compliance");

                return (
                  <div key={idx}>
                    {/* ================= MAIN ITEM ================= */}
                    <button
                      onClick={() => {
                        // 🔽 SAFEGUARDING TOGGLE (NEW)
                        if (item.children && item.children.length > 0) {
                          setOpenSubMenu(
                            openSubMenu === item.label ? null : item.label
                          );
                          return;
                        }

                        // 🔧 MAINTENANCE (OLD – PRESERVED)
                        if (isMaintenance) {
                          const fallbacks = [
                            item.path,
                            "/admin/maintenance",
                            "/maintenance",
                            "/ops/maintenance",
                            "/maintenance-page",
                            "/admin/ops/maintenance",
                          ];
                          tryNavigateWithFallbacks(fallbacks);
                          return;
                        }

                        // 🛡 COMPLIANCE (OLD – PRESERVED)
                        if (isCompliance) {
                          const fallbacks = [
                            item.path,
                            "/admin/compliance",
                            "/compliance",
                            "/property/compliance",
                            "/admin/property/compliance",
                          ];
                          tryNavigateWithFallbacks(fallbacks);
                          return;
                        }

                        // 🚀 DEFAULT NAV (OLD – PRESERVED)
                        try {
                          navigate(item.path);
                        } catch (e) {
                          try {
                            window.location.href = item.path;
                          } catch (_) {}
                        }
                        setTimeout(() => setActiveCategory(null), 80);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm transition-colors mb-1 whitespace-nowrap ${
                        item.children
                          ? "text-gray-700 font-medium hover:bg-gray-50"
                          : getSubLinkClass(item.path)
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 shrink-0 opacity-80">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {/* ▼ DROPDOWN ARROW (ONLY FOR SAFEGUARDING) */}
                      {item.children && (
                        <span
                          className={`text-xs transition-transform ${
                            openSubMenu === item.label ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      )}
                    </button>

                    {/* ================= SUB MENU (SAFEGUARDING) ================= */}
                    {item.children && openSubMenu === item.label && (
                      <div className="ml-9 mt-1 space-y-1">
                        {item.children.map((sub, sidx) => (
                          <button
                            key={sidx}
                            onClick={() => {
                              try {
                                navigate(sub.path);
                              } catch (e) {
                                window.location.href = sub.path;
                              }
                              setOpenSubMenu(null);
                              setActiveCategory(null);
                            }}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${getSubLinkClass(
                              sub.path
                            )}`}
                          >
                            <span className="text-[10px] opacity-60">●</span>
                            <span>{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <div className="p-4 border-t border-gray-50 text-xs text-gray-400 shrink-0">
            © 2025 SD Commercial
          </div>
        </div>
      </div>
    </div>
  );
}
