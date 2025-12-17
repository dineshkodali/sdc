/* eslint-disable no-unused-vars */
// src/pages/StaffGrid.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

axios.defaults.withCredentials = true;

/* Avatar Component */
function Avatar({ user, size = 20 }) {
  const src = user?.avatar || user?.avatar_url || user?.photo || user?.picture || user?.profile_url || user?.image;
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dim = size;
  // Use wrapper style to enforce dimensions strictly
  const style = { width: `${dim}px`, height: `${dim}px`, minWidth: `${dim}px`, minHeight: `${dim}px` };
  const fontSize = Math.floor(dim / 2.4);

  if (src) {
    return (
      <div className="rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-gray-200" style={style}>
        <img src={src} alt={user?.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold shrink-0"
      style={{ ...style, fontSize: `${fontSize}px` }}
    >
      {initials}
    </div>
  );
}

/* Staff Detail Panel */
function StaffDetailPanel({ open, onClose, user, loading }) {
  if (!open) return null;

  const name = user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Unknown";
  const avatar = user?.avatar || user?.photo || user?.image || null;
  const email = user?.email || "—";
  const phone = user?.phone || "—";
  const role = user?.role || "—";
  const joiningDate = user?.joining_date
    ? new Date(user.joining_date).toLocaleDateString()
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "—";

  const dob = user?.dob ? new Date(user.dob).toLocaleDateString() : (user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "—");
  const gender = user?.gender || "—";
  const nationality = user?.nationality || "—";
  const religion = user?.religion || "—";
  const marital_status = user?.marital_status || "—";

  const address = user?.address || user?.addr || "—";
  const city = user?.city || "—";
  const state = user?.state || "—";
  const country = user?.country || "—";

  const resumeUrl = user?.resume_url || user?.resume || user?.cv || null;

  return (
    // FIXED: Added 'top-[60px]' to push the panel below the Navbar height
    // z-index is kept high, but this physical spacing ensures visibility regardless of stacking context
    <div className="fixed inset-0 top-[64px] z-[100] flex justify-end h-[calc(100vh-64px)]">
      
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Side Panel */}
      <aside className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-slide-in-right border-l border-gray-100">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-5">
            {/* Large Avatar in Header */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-2xl font-bold border border-gray-200 shadow-sm shrink-0">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                (name || "U").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{name}</div>
              <div className="text-sm font-medium text-gray-500 capitalize mt-0.5">{role}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 Joined: {joiningDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={resumeUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                resumeUrl 
                  ? "bg-slate-800 text-white hover:bg-slate-900 shadow-sm" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => !resumeUrl && e.preventDefault()}
            >
              {resumeUrl ? "Download Resume" : "No Resume"}
            </a>

            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors border border-gray-200"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading profile details...</div>
          ) : (
            <>
              {/* Contact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">EMAIL</div>
                  <div className="text-sm font-semibold text-gray-800 break-all">{email}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PHONE</div>
                  <div className="text-sm font-semibold text-gray-800">{phone}</div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800">Personal Information</h4>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Full Name</div>
                    <div className="font-medium text-gray-800 text-sm">{name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Date of Birth</div>
                    <div className="font-medium text-gray-800 text-sm">{dob}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Gender</div>
                    <div className="font-medium text-gray-800 text-sm">{gender}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Nationality</div>
                    <div className="font-medium text-gray-800 text-sm">{nationality}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Religion</div>
                    <div className="font-medium text-gray-800 text-sm">{religion}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Marital Status</div>
                    <div className="font-medium text-gray-800 text-sm">{marital_status}</div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800">Address Information</h4>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Address</div>
                    <div className="font-medium text-gray-800 text-sm">{address}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">City</div>
                      <div className="font-medium text-gray-800 text-sm">{city}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">State</div>
                      <div className="font-medium text-gray-800 text-sm">{state}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Country</div>
                      <div className="font-medium text-gray-800 text-sm">{country}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/* --- Main Component --- */
export default function StaffGrid() {
  const outlet = useOutletContext();
  const { user } = outlet || {};

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/users", { withCredentials: true });
      const rows = res?.data?.users || [];
      setStaff(rows);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError(err?.response?.data?.message || "Failed to load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Helper for random stats
  const makeStats = (u) => {
    if (u.projects || u.done || u.progress) {
      return {
        projects: u.projects || 0,
        done: u.done || 0,
        progress: Math.min(100, u.progress || 0),
      };
    }
    const seed = String(u.id || u.email || u.name).split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const projects = 10 + (seed % 40);
    const done = Math.round(projects * ((30 + (seed % 60)) / 100));
    const progress = Math.round((done / Math.max(1, projects)) * 100);
    return { projects, done, progress };
  };

  const openProfile = async (id) => {
    setSelectedUserId(id);
    setDrawerOpen(true);
    setSelectedUser(null);
    setLoadingUser(true);
    try {
      // Optimistic load
      const preUser = staff.find(s => s.id === id);
      if (preUser) setSelectedUser(preUser);

      const res = await axios.get(`/api/admin/users/${id}`, { withCredentials: true });
      setSelectedUser(res.data.user || res.data || {});
    } catch (err) {
      console.error("Failed to load details:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete user? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { withCredentials: true });
      await fetchStaff();
      if (selectedUserId === id) closeDrawer();
    } catch (err) {
      console.error("delete error:", err);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="min-h-full bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Staff</h1>
            <p className="text-sm text-gray-500">All registered staff — grid view</p>
          </div>
          <div>
            <button className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#c2410b] text-white rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Add Employee
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-lg font-bold text-slate-800 mb-1">Staff Grid</div>
          <div className="text-sm text-gray-500 mb-6">Click a card to view full details.</div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading staff...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No staff found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {staff.map((s) => {
                const stats = makeStats(s);
                return (
                  <div key={s.id || s.email} className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-md transition-shadow group">
                    
                    <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 cursor-pointer">
                       <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>

                    <div className="flex flex-col items-center">
                      <Avatar user={s} size={80} className="mb-3 shadow-sm" />
                      <div className="mt-3 text-center w-full">
                        <div className="font-bold text-lg text-slate-800 truncate px-2">{s.name || s.email}</div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-600 capitalize">
                            {s.role || "Staff"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 text-center text-sm border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase">Projects</div>
                        <div className="font-bold text-slate-700 text-lg">{stats.projects}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase">Done</div>
                        <div className="font-bold text-slate-700 text-lg">{stats.done}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase">Progress</div>
                        <div className="font-bold text-slate-700 text-lg">{stats.progress}</div>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-gray-500 font-medium">Productivity</span>
                         <span className="font-bold text-slate-700">{stats.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stats.progress > 80 ? "bg-emerald-500" : stats.progress > 50 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => openProfile(s.id)} 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)} 
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <StaffDetailPanel 
            open={drawerOpen} 
            onClose={closeDrawer} 
            user={selectedUser} 
            loading={loadingUser} 
        />
      </div>
    </div>
  );
}