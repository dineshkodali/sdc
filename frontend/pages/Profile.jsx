/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function Profile({ user: userProp }) {
  // Fallback: Get user from context if not passed as prop
  const context = useOutletContext(); 
  const initialUser = userProp || context?.user || {};

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // load profile from server (preferred) or fallback to userProp/localStorage
  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/profile", { withCredentials: true });
      const data = res.data.profile || res.data.user || null;
      setProfile(data);
      setForm(data || {});
    } catch (err) {
      // fallback: use initialUser/localStorage
      let fallback = initialUser.id ? initialUser : null;
      try {
        if (!fallback) {
          const raw = localStorage.getItem("user");
          if (raw) fallback = JSON.parse(raw);
        }
      } catch {}
      setProfile(fallback || null);
      setForm(fallback || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const saveProfile = async (e) => {
    e?.preventDefault();
    setMsg("");
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        nationality: form.nationality,
        religion: form.religion,
        marital_status: form.marital_status,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        zipcode: form.zipcode,
      };
      const res = await axios.put("/api/profile", payload, { withCredentials: true });
      setProfile(res.data.profile || res.data);
      setEditing(false);
      setMsg("Profile saved successfully");
      
      // Clear message after 3 seconds
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("save profile error:", err);
      const m = err?.response?.data?.message || err?.message || "Failed to save";
      setMsg(m);
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await axios.post("/api/profile/resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      // update profile
      setProfile((p) => ({ ...(p || {}), resume_url: res.data.resume_url }));
      setMsg("Resume uploaded successfully");
    } catch (err) {
      console.error("upload resume error:", err);
      const m = err?.response?.data?.message || err?.message || "Upload failed";
      setMsg(m);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-full flex items-center justify-center text-gray-500">Loading profile...</div>;

  const fullName = profile?.name || "Unnamed User";
  const email = profile?.email || "—";
  const phone = profile?.phone || "—";
  const gender = profile?.gender || "—";
  const dob = profile?.dob ? new Date(profile.dob).toLocaleDateString() : "—";
  const nationality = profile?.nationality || "—";
  const religion = profile?.religion || "—";
  const marital = profile?.marital_status || "—";

  const address = {
    line: profile?.address || "—",
    city: profile?.city || "—",
    state: profile?.state || "—",
    country: profile?.country || "—",
    zipcode: profile?.zipcode || "—",
  };

  const resumeUrl = profile?.resume_url || null;

  const initials = (fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-full bg-gray-50 font-sans">
      {/* Removed the outer flex container that held the sidebar */}
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
            <div className="text-sm text-gray-500">Manage your personal information</div>
        </div>

        {/* Top Card: Avatar & Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold shrink-0">
              {profile?.avatar ? (
                 <img src={profile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : initials}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
              <div className="text-sm text-gray-500 mt-1">{email}</div>
              <div className="text-sm text-gray-500 mt-1">
                Role: <span className="font-medium text-gray-700 capitalize">{profile?.role || "—"}</span>
              </div>
            </div>

            <div className="text-right hidden md:block">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Joined</div>
              <div className="font-medium text-slate-700">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {profile?.branch ? `Branch: ${profile.branch}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          
          {/* Tabs */}
          <div className="border-b border-gray-100 px-8">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("pipeline")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "pipeline" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Hiring Pipeline
              </button>
              <button 
                onClick={() => setActiveTab("notes")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "notes" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Notes
              </button>
            </div>
          </div>

          <div className="p-8">
            {msg && <div className={`mb-6 text-sm p-3 rounded ${msg.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{msg}</div>}

            {/* PROFILE TAB CONTENT */}
            {activeTab === "profile" && (
                <>
                {!editing ? (
                    // --- VIEW MODE ---
                    <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                            <button onClick={() => setEditing(true)} className="text-sm text-orange-600 hover:text-orange-700 font-medium">Edit</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div><div className="text-xs text-gray-400 mb-1">Candidate Name</div><div className="text-sm font-medium text-slate-700">{fullName}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Phone</div><div className="text-sm font-medium text-slate-700">{phone}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Gender</div><div className="text-sm font-medium text-slate-700">{gender}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Date of Birth</div><div className="text-sm font-medium text-slate-700">{dob}</div></div>
                        
                        <div className="md:col-span-2"><div className="text-xs text-gray-400 mb-1">Email</div><div className="text-sm font-medium text-slate-700">{email}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Nationality</div><div className="text-sm font-medium text-slate-700">{nationality}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Religion</div><div className="text-sm font-medium text-slate-700">{religion}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Marital Status</div><div className="text-sm font-medium text-slate-700">{marital}</div></div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Address Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="md:col-span-2"><div className="text-xs text-gray-400 mb-1">Address</div><div className="text-sm font-medium text-slate-700">{address.line}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">City</div><div className="text-sm font-medium text-slate-700">{address.city}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">State</div><div className="text-sm font-medium text-slate-700">{address.state}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Zipcode</div><div className="text-sm font-medium text-slate-700">{address.zipcode}</div></div>
                        <div><div className="text-xs text-gray-400 mb-1">Country</div><div className="text-sm font-medium text-slate-700">{address.country}</div></div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Resume</h3>
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-700">Resume</div>
                            <div className="text-xs text-gray-500 mt-1">{resumeUrl ? "File uploaded" : "No resume attached"}</div>
                        </div>
                        <div className="flex gap-2">
                            {resumeUrl ? (
                            <a href={resumeUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50">Download</a>
                            ) : (
                            <button disabled className="px-4 py-2 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-medium rounded cursor-not-allowed">Download</button>
                            )}
                            <label className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 cursor-pointer">
                                {uploading ? "Uploading..." : "Upload"}
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e)=> { if (e.target.files?.[0]) handleResumeUpload(e.target.files[0]); }} />
                            </label>
                        </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    // --- EDIT MODE ---
                    <form onSubmit={saveProfile} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <input value={form.name || ""} onChange={(e) => handleChange("name", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Email (Read-only)</label>
                                <input value={form.email || ""} readOnly className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-500 cursor-not-allowed" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <input value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Gender</label>
                                <select value={form.gender || ""} onChange={(e) => handleChange("gender", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                <input type="date" value={form.dob ? form.dob.split("T")[0] : ""} onChange={(e) => handleChange("dob", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Nationality</label>
                                <input value={form.nationality || ""} onChange={(e) => handleChange("nationality", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Religion</label>
                                <input value={form.religion || ""} onChange={(e) => handleChange("religion", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div>
                                <label className="text-sm font-medium text-gray-700">Marital Status</label>
                                <select value={form.marital_status || ""} onChange={(e) => handleChange("marital_status", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                                    <option value="">Select</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Address</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Address Line</label>
                                    <input value={form.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">City</label>
                                        <input value={form.city || ""} onChange={(e) => handleChange("city", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">State</label>
                                        <input value={form.state || ""} onChange={(e) => handleChange("state", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Zipcode</label>
                                        <input value={form.zipcode || ""} onChange={(e) => handleChange("zipcode", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Country</label>
                                        <input value={form.country || ""} onChange={(e) => handleChange("country", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 justify-end border-t border-gray-100">
                            <button type="button" onClick={() => { setEditing(false); setForm(profile || {}); }} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-[#EA580C] text-white font-medium rounded-lg hover:bg-[#c2410b] shadow-sm transition-colors">Save Changes</button>
                        </div>
                    </form>
                )}
                </>
            )}

            {/* OTHER TABS */}
            {activeTab === "pipeline" && (
                <div className="py-12 text-center">
                    <div className="text-gray-400 mb-2 text-4xl">📭</div>
                    <h3 className="text-gray-900 font-medium">No pipeline data</h3>
                    <p className="text-gray-500 text-sm">Hiring pipeline information will appear here.</p>
                </div>
            )}

            {activeTab === "notes" && (
                <div className="py-12 text-center">
                    <div className="text-gray-400 mb-2 text-4xl">📝</div>
                    <h3 className="text-gray-900 font-medium">No notes added</h3>
                    <p className="text-gray-500 text-sm">There are no notes for this profile yet.</p>
                </div>
            )}

          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 text-center">© {new Date().getFullYear()} SD Commercial</div>
      </div>
    </div>
  );
}