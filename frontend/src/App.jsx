/* eslint-disable no-unused-vars */
/* src/App.jsx */

import React, { Component, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import axios from "axios";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Navbar from "../pages/Navbar";
import AdminDashboard from "../pages/AdminDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import StaffDashboard from "../pages/StaffDashboard";
import HotelsList from "../pages/HotelsList";
import HotelDetails from "../pages/HotelDetails";
import RoomsManager from "../pages/RoomsManager";

import Tasks from "../pages/Tasks";
import Notifications from "../pages/Notifications";
import Reports from "../pages/Reports";

import AdminAddMember from "../pages/AdminAddMember";
import Profile from "../pages/Profile";
import Users from "../pages/Users";

import StaffRooms from "../pages/StaffRooms"; 
import ManagerStaff from "../pages/ManagerStaff";

import StaffGrid from "../pages/StaffGrid";

// AdminLayout wrapper (renders AdminSidebar + outlet)
import AdminLayout from "../components/AdminLayout";

// Holidays page
import Holidays from "../pages/Holidays";

// Attendance admin page
import AttendanceAdmin from "../pages/AttendanceAdmin";

// Reports pages
import PaymentReport from "../pages/PaymentReport";
import TaskReport from "../pages/TaskReport";
import UserReport from "../pages/UserReport";
import PayslipReport from "../pages/PayslipReport";
import AttendanceReport from "../pages/AttendanceReport";
import LeaveReport from "../pages/LeaveReport";

// Daily report
import DailyReport from "../pages/DailyReport";

import Tickets from "../pages/Tickets";
import TicketDetails from "../pages/TicketDetails";

import "./index.css";

/* Ensure credentials are sent with every axios request */
axios.defaults.withCredentials = true;

/* Safe fallback helper */
function makeSafe(ComponentImport, name = "Page") {
  if (ComponentImport && (typeof ComponentImport === "function" || typeof ComponentImport === "object")) {
    return ComponentImport;
  }
  return function Missing() {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{name} not found</h2>
        <p className="text-sm text-gray-600">
          The <strong>{name}</strong> component is missing or failed to load.
        </p>
      </div>
    );
  };
}

/* safe wrappers */
const AdminDashboardSafe = makeSafe(AdminDashboard, "AdminDashboard");
const ManagerDashboardSafe = makeSafe(ManagerDashboard, "ManagerDashboard");
const StaffDashboardSafe = makeSafe(StaffDashboard, "StaffDashboard");
const HotelsListSafe = makeSafe(HotelsList, "HotelsList");
const HotelDetailsSafe = makeSafe(HotelDetails, "HotelDetails");
const RoomsManagerSafe = makeSafe(RoomsManager, "RoomsManager");
const TasksSafe = makeSafe(Tasks, "Tasks");
const NotificationsSafe = makeSafe(Notifications, "Notifications");
const ReportsSafe = makeSafe(Reports, "Reports");
const AdminAddMemberSafe = makeSafe(AdminAddMember, "AdminAddMember");
const ProfileSafe = makeSafe(Profile, "Profile");
const UsersSafe = makeSafe(Users, "Users");
const HomeSafe = makeSafe(Home, "Home");
const LoginSafe = makeSafe(Login, "Login");
const RegisterSafe = makeSafe(Register, "Register");
const NavbarSafe = makeSafe(Navbar, "Navbar");
const StaffRoomsSafe = makeSafe(StaffRooms, "StaffRooms");

const ManagerStaffSafe = makeSafe(ManagerStaff, "ManagerStaff");
const StaffGridSafe = makeSafe(StaffGrid, "StaffGrid");

const AdminLayoutSafe = makeSafe(AdminLayout, "AdminLayout");
const HolidaysSafe = makeSafe(Holidays, "Holidays");
const AttendanceAdminSafe = makeSafe(AttendanceAdmin, "AttendanceAdmin");

const TicketsSafe = makeSafe(Tickets, "Tickets");
const TicketDetailsSafe = makeSafe(TicketDetails, "TicketDetails");

const PaymentReportSafe = makeSafe(PaymentReport, "PaymentReport");
const TaskReportSafe = makeSafe(TaskReport, "TaskReport");
const UserReportSafe = makeSafe(UserReport, "UserReport");
const PayslipReportSafe = makeSafe(PayslipReport, "PayslipReport");
const AttendanceReportSafe = makeSafe(AttendanceReport, "AttendanceReport");
const LeaveReportSafe = makeSafe(LeaveReport, "LeaveReport");
const DailyReportSafe = makeSafe(DailyReport, "DailyReport");

/* --------------------------
   Error boundary
   -------------------------- */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in App tree:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-2xl bg-white shadow rounded p-6">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* --------------------------
   Route guards
   -------------------------- */
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ user, allowed = [], children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RedirectToAdminTicket() {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin/tickets" replace />;
  return <Navigate to={`/admin/tickets/${encodeURIComponent(id)}`} replace />;
}

/* --------------------------
   App component
   -------------------------- */
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const validate = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        if (mounted && res?.data) {
          setUser(res.data);
        }
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    validate();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // --- Layout Wrappers ---

  // 1. For strictly Admin pages (Roles: Admin)
  const AdminLayoutWrapper = ({ children }) => (
    <RoleRoute user={user} allowed={["admin"]}>
      <AdminLayoutSafe user={user}>{children}</AdminLayoutSafe>
    </RoleRoute>
  );

  // 2. For General Protected pages (Home, Profile, Tasks) - so they get the sidebar too!
  const GeneralLayoutWrapper = ({ children }) => (
    <ProtectedRoute user={user}>
      <AdminLayoutSafe user={user}>{children}</AdminLayoutSafe>
    </ProtectedRoute>
  );

  return (
    <ErrorBoundary>
      <Router>
        {/* GLOBAL APP CONTAINER: Flex column with fixed height */}
        <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
          
          {/* TOP NAVIGATION: Fixed Height, non-scrolling */}
          <div className="shrink-0 z-50">
            <NavbarSafe user={user} setUser={setUser} />
          </div>

          {/* MAIN CONTENT CONTAINER: Fills remaining height */}
          <div className="flex-1 overflow-hidden relative z-0">
            <Routes>
              
              {/* --- PUBLIC ROUTES --- */}
              <Route path="/login" element={<LoginSafe setUser={setUser} />} />
              <Route path="/register" element={<RegisterSafe setUser={setUser} />} />


              {/* --- GENERAL PROTECTED ROUTES (Now wrapped in Sidebar Layout) --- */}
              
              {/* Home / Main Dashboard */}
              <Route path="/" element={
                <GeneralLayoutWrapper>
                  <HomeSafe user={user} setUser={setUser} />
                </GeneralLayoutWrapper>
              } />

              {/* Common Modules */}
              <Route path="/profile" element={
                <GeneralLayoutWrapper>
                  <ProfileSafe user={user} />
                </GeneralLayoutWrapper>
              } />

              <Route path="/tasks" element={
                <GeneralLayoutWrapper>
                   <TasksSafe />
                </GeneralLayoutWrapper>
              } />

              <Route path="/notifications" element={
                <GeneralLayoutWrapper>
                   <NotificationsSafe />
                </GeneralLayoutWrapper>
              } />

              <Route path="/hotels" element={
                <GeneralLayoutWrapper>
                  <HotelsListSafe user={user} />
                </GeneralLayoutWrapper>
              } />
              
              <Route path="/hotels/:id" element={
                <GeneralLayoutWrapper>
                   <HotelDetailsSafe user={user} />
                </GeneralLayoutWrapper>
              } />


              {/* --- ADMIN ROUTES --- */}
              <Route path="/admin/*" element={
                 <AdminLayoutWrapper>
                   <Routes>
                      <Route index element={<AdminDashboardSafe user={user} />} />
                      <Route path="hotels" element={<HotelsListSafe user={user} />} />
                      <Route path="users" element={<UsersSafe user={user} />} />
                      <Route path="add-member" element={<AdminAddMemberSafe user={user} />} />
                      <Route path="staff-grid" element={<StaffGridSafe user={user} />} />
                      <Route path="tickets" element={<TicketsSafe user={user} />} />
                      <Route path="tickets/:id" element={<TicketDetailsSafe user={user} />} />
                      
                      {/* Nested Reports */}
                      <Route path="reports">
                        <Route index element={<ReportsSafe />} />
                        <Route path="payment" element={<PaymentReportSafe />} />
                        <Route path="task" element={<TaskReportSafe />} />
                        <Route path="user" element={<UserReportSafe />} />
                        <Route path="payslips" element={<PayslipReportSafe />} />
                        <Route path="attendance" element={<AttendanceReportSafe />} />
                        <Route path="leaves" element={<LeaveReportSafe />} />
                        <Route path="daily" element={<DailyReportSafe />} />
                      </Route>
                   </Routes>
                 </AdminLayoutWrapper>
              } />

              {/* Explicit Admin Holiday Routes */}
              <Route path="/admin/holidays" element={<AdminLayoutWrapper><HolidaysSafe user={user} /></AdminLayoutWrapper>} />
              <Route path="/admin/holidays/add" element={<AdminLayoutWrapper><HolidaysSafe user={user} mode="add" /></AdminLayoutWrapper>} />
              <Route path="/admin/holidays/:id" element={<AdminLayoutWrapper><HolidaysSafe user={user} /></AdminLayoutWrapper>} />

              {/* Explicit Admin Attendance Routes */}
              <Route path="/admin/attendance" element={<AdminLayoutWrapper><AttendanceAdminSafe user={user} /></AdminLayoutWrapper>} />
              <Route path="/admin/attendance/:id" element={<AdminLayoutWrapper><AttendanceAdminSafe user={user} /></AdminLayoutWrapper>} />


              {/* --- MANAGER ROUTES --- */}
              {/* Manager dashboard uses its own internal logic, but we can wrap it if we want sidebar there too. 
                  If ManagerDashboard has its own layout, keep as RoleRoute. 
                  Below assumes ManagerDashboard is a standalone page or handles layout internally. */}
              <Route path="/manager" element={
                <RoleRoute user={user} allowed={["manager"]}>
                  <ManagerDashboardSafe user={user} />
                </RoleRoute>
              } />
              
              <Route path="/manager/staff" element={
                <RoleRoute user={user} allowed={["manager"]}>
                  <ManagerStaffSafe user={user} />
                </RoleRoute>
              } />

              <Route path="/manager/reports/*" element={
                <RoleRoute user={user} allowed={["manager"]}>
                   <Routes>
                      <Route index element={<ReportsSafe />} />
                      <Route path="payment" element={<PaymentReportSafe />} />
                      <Route path="task" element={<TaskReportSafe />} />
                      <Route path="user" element={<UserReportSafe />} />
                      <Route path="payslips" element={<PayslipReportSafe />} />
                      <Route path="attendance" element={<AttendanceReportSafe />} />
                      <Route path="leaves" element={<LeaveReportSafe />} />
                      <Route path="daily" element={<DailyReportSafe />} />
                   </Routes>
                </RoleRoute>
              } />

              {/* --- STAFF ROUTES --- */}
              <Route path="/staff" element={
                <RoleRoute user={user} allowed={["staff"]}>
                  <StaffDashboardSafe user={user} />
                </RoleRoute>
              } />
              
              <Route path="/staff/rooms" element={
                <RoleRoute user={user} allowed={["staff"]}>
                  <StaffRoomsSafe />
                </RoleRoute>
              } />

              {/* Shared Room Manager */}
              <Route path="/hotels/:hotelId/rooms" element={
                <RoleRoute user={user} allowed={["admin", "manager", "staff"]}>
                  <RoomsManagerSafe user={user} />
                </RoleRoute>
              } />

              {/* Redirects */}
              <Route path="/attendance" element={<Navigate to="/admin/attendance" replace />} />
              <Route path="/tickets" element={<Navigate to="/admin/tickets" replace />} />
              <Route path="/tickets/:id" element={<RedirectToAdminTicket />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />

            </Routes>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}