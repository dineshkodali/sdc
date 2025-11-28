/* eslint-disable no-unused-vars */
/* src/pages/Users.jsx */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

axios.defaults.withCredentials = true;

export default function Users() {
  const outlet = useOutletContext();
  const { user } = outlet || {};

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // --- EXISTING LOGIC & HANDLERS (UNCHANGED) ---

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/users", { withCredentials: true });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete user? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      console.error("delete user error:", err);
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const getStaffId = (u) => u?.staff_id || u?.emp_id || u?.employee_id || u?.id || "—";
  const getPhone = (u) => u?.phone || u?.mobile || u?.contact || "—";
  const getStatus = (u) => {
    if (u?.status) return u.status;
    if (typeof u?.active === "boolean") return u.active ? "Active" : "Inactive";
    if (u?.account_status) return u.account_status;
    return "Active"; // Default for UI matching
  };
  const getJoinDateRaw = (u) => u?.joining_date || u?.joined_on || u?.join_date || u?.created_at || u?.createdAt || null;
  const formatJoinDate = (u) => {
    const d = getJoinDateRaw(u);
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  // Edit Handlers
  const openEdit = async (id) => {
    setEditingId(id);
    setIsEditOpen(true);
    setEditUser(null);
    setAvatarPreview(null);
    setAvatarFile(null);

    try {
      const res = await axios.get(`/api/admin/users/${id}`, { withCredentials: true });
      const u = res.data.user || res.data || {};
      const payload = {
        id: u.id,
        first_name: u.first_name || u.firstName || (u.name ? u.name.split(" ")[0] : ""),
        last_name: u.last_name || u.lastName || (u.name ? u.name.split(" ").slice(1).join(" ") : ""),
        staff_id: u.staff_id || u.emp_id || u.employee_id || u.id,
        username: u.username || u.user_name || u.email,
        email: u.email || "",
        phone: u.phone || u.mobile || u.contact || "",
        joining_date: getJoinDateRaw(u) ? new Date(getJoinDateRaw(u)).toISOString().substr(0, 10) : "",
        branch: u.branch || u.company || u.organisation || u.org || "",
        role: u.role || u.user_role || "",
        status: getStatus(u),
        avatar: u.avatar || u.photo || u.image || null,
      };
      setEditUser(payload);
      if (payload.avatar) setAvatarPreview(payload.avatar);
    } catch (err) {
      console.error("fetch user details error:", err);
      alert("Failed to load user details");
      setIsEditOpen(false);
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingId(null);
    setEditUser(null);
    setAvatarPreview(null);
    setAvatarFile(null);
    setSaving(false);
  };

  const onEditChange = (key, value) => {
    setEditUser((s) => ({ ...s, [key]: value }));
  };

  const onAvatarChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editUser || !editingId) return;
    setSaving(true);
    try {
      const fullName = `${(editUser.first_name || "").trim()} ${(editUser.last_name || "").trim()}`.trim();
      const form = new FormData();
      if (fullName) form.append("name", fullName);
      if (editUser.email !== undefined) form.append("email", editUser.email || "");
      if (editUser.password) form.append("password", editUser.password);
      if (editUser.branch !== undefined) form.append("branch", editUser.branch || "");
      if (editUser.role !== undefined) form.append("role", editUser.role || "");
      if (editUser.status !== undefined) form.append("status", editUser.status || "");
      if (editUser.phone !== undefined) form.append("phone", editUser.phone || "");
      if (avatarFile) form.append("avatar", avatarFile);

      await axios.put(`/api/admin/users/${editingId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      await fetchUsers();
      closeEdit();
      alert("Saved successfully");
    } catch (err) {
      console.error("save user error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to save";
      alert(msg);
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  // --- CALCULATE STATS FOR UI ---
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => String(getStatus(u)).toLowerCase() === 'active').length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  // Mock 'new joiners' logic simply to populate the UI card
  const newJoiners = users.length > 0 ? Math.ceil(users.length * 0.1) : 0; 

  /* -------------------------
       RENDER (UI MATCHING SCREENSHOT)
     ------------------------- */
  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 font-sans text-slate-800">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee</h1>
          <nav className="flex items-center text-sm text-gray-500 mt-1">
            <span className="hover:text-blue-500 cursor-pointer">⌂</span>
            <span className="mx-2">/</span>
            <span className="hover:text-blue-500 cursor-pointer">Employee</span>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Employee List</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-50 text-sm font-medium">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             Export
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <button 
            onClick={() => window.location.href = "/admin/add-member"}
            className="bg-[#EA580C] hover:bg-[#c2410b] text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">＋</div>
            Add Employee
          </button>
        </div>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Employee */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Employee</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalEmployees}</h3>
            </div>
          </div>
          <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded font-medium">~ +19.01%</span>
        </div>

        {/* Active */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
               {/* RESTORED THE ORIGINAL USER ICON (matches original design) */}
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                 <circle cx="12" cy="7" r="4"></circle>
               </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Active</p>
              <h3 className="text-2xl font-bold text-slate-800">{activeEmployees}</h3>
            </div>
          </div>
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded font-medium">~ +19.01%</span>
        </div>

        {/* InActive */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
             </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">InActive</p>
              <h3 className="text-2xl font-bold text-slate-800">{inactiveEmployees}</h3>
            </div>
          </div>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-medium">~ +19.01%</span>
        </div>

        {/* New Joiners */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
             </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">New Joiners</p>
              <h3 className="text-2xl font-bold text-slate-800">{newJoiners}</h3>
            </div>
          </div>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-medium">~ +19.01%</span>
        </div>
      </div>

      {/* 3. Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        
        {/* Filter Bar Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">Plan List</h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            {/* Date Range */}
            <div className="relative">
                <input type="text" defaultValue="11/18/2025 - 11/24/2025" className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 w-48 focus:outline-none focus:border-orange-500" />
            </div>

            {/* Dropdowns */}
            <select className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-500">
              <option>Designation</option>
            </select>
            <select className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-500">
              <option>Select Status</option>
            </select>
            <select className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-orange-500">
              <option>Sort By : Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Search & Rows Per Page */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
             <span>Row Per Page</span>
             <select className="border border-gray-200 rounded p-1 focus:outline-none">
               <option>10</option>
               <option>20</option>
             </select>
             <span>Entries</span>
          </div>
          
          <div className="relative">
             <input type="text" placeholder="Search" className="border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-orange-500" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] text-slate-800 text-sm font-semibold">
                <th className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="p-4">Staff ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.map((u, index) => (
                <tr key={u.id || index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 text-sm font-medium text-slate-700">{getStaffId(u)}</td>
                  <td className="p-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                           {u.avatar || u.photo ? (
                             <img src={u.avatar || u.photo} alt="" className="w-full h-full object-cover"/>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                               {(u.name || "U").substring(0,2).toUpperCase()}
                             </div>
                           )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{u.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{u.branch || u.role || "Employee"}</div>
                        </div>
                     </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{u.email}</td>
                  <td className="p-4 text-sm text-gray-600">{getPhone(u)}</td>
                  <td className="p-4">
                     <div className="inline-flex items-center gap-1 border border-gray-200 rounded px-3 py-1 text-sm text-gray-600 bg-white">
                        {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Staff"}
                     </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{formatJoinDate(u)}</td>
                  <td className="p-4">
                     <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-white ${
                        getStatus(u).toLowerCase() === 'active' ? 'bg-[#22c55e]' : 'bg-red-500'
                     }`}>
                       <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                       {getStatus(u)}
                     </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => openEdit(u.id)} className="text-gray-400 hover:text-blue-600 border border-gray-200 p-1.5 rounded bg-white">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                       </button>
                       <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-600 border border-gray-200 p-1.5 rounded bg-white">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer (Visual) */}
        <div className="p-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
             <div>Showing {users.length > 0 ? 1 : 0} to {users.length} of {users.length} entries</div>
             <div className="flex gap-1">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border rounded bg-[#EA580C] text-white">1</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
             </div>
        </div>

        {error && <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>}
      </div>


      {/* -------------------------
           EDIT MODAL (Kept Functional, styled cleanly)
         ------------------------- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-slate-800">Edit Employee Details</h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={saveEdit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-dashed border-gray-300">
                  <div className="w-24 h-24 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-300 font-bold">{(editUser?.first_name || "U").charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        if (f) onAvatarChange(f);
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-400">Recommended: Square JPG/PNG, max 4MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input value={editUser?.first_name || ""} onChange={(e) => onEditChange("first_name", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input value={editUser?.last_name || ""} onChange={(e) => onEditChange("last_name", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                    <input value={editUser?.staff_id || ""} onChange={(e) => onEditChange("staff_id", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={editUser?.email || ""} onChange={(e) => onEditChange("email", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={editUser?.phone || ""} onChange={(e) => onEditChange("phone", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation / Role</label>
                    <select value={editUser?.role || ""} onChange={(e) => onEditChange("role", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all">
                      <option value="">Select Role</option>
                      <option value="staff">Staff / Developer</option>
                      <option value="manager">Manager</option>
                      {/* <option value="executive">Executive</option>
                      <option value="finance">Finance</option> */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={editUser?.status || ""} onChange={(e) => onEditChange("status", e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={closeEdit} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#EA580C] text-white text-sm font-medium hover:bg-[#c2410b] shadow-lg shadow-orange-200 transition-all disabled:opacity-50">
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}