/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// Use global baseURL if set in main.jsx; otherwise fallback to env
const API_BASE = import.meta.env.VITE_API_URL || axios.defaults.baseURL || "";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

const PROPERTY_FIELD = "property_id";

const CERTIFICATE_TYPES = [
  "Gas Safety Certificate",
  "Electrical Installation (EICR)",
  "Fire Alarm Test",
  "Legionella Risk Assessment",
  "PAT Testing",
  "Energy Performance Certificate",
  "Fire Safety Certificate", // Added based on screenshot
  "Other",
];

/* --- Helpers for Date Formatting (Matches Screenshot: "11 May 2023") --- */
function formatLongDate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getTodayYMD(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputYMD(value) {
  if (!value && value !== 0) return "";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    if (typeof value === "string" && value.indexOf("T") > -1) {
      return value.split("T")[0];
    }
    return String(value);
  } catch {
    return String(value);
  }
}

function computeStatusFromExpiry(expiryDate) {
  if (!expiryDate) return "";
  const ymd = toInputYMD(expiryDate);
  if (!ymd) return "";
  try {
    const parts = ymd.split("-").map(Number);
    if (parts.length !== 3) return "";
    const expiry = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    // Reset time for fair comparison
    now.setHours(0, 0, 0, 0);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "expiring";
    return "valid";
  } catch {
    return "";
  }
}

/* --- UI Components --- */

function StatCard({ colorBg, icon, title, value }) {
  // Matching screenshot: White card, colored circle icon, large number
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-5 flex-1 min-w-[240px] border border-slate-100">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-sm ${colorBg}`}>
        {icon}
      </div>
      <div>
        <div className="text-slate-500 text-sm font-medium">{title}</div>
        <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "expired") {
    return <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-semibold">Expired</span>;
  }
  if (s === "expiring" || s.includes("soon")) {
    return <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-semibold">Expiring Soon</span>;
  }
  return <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">Valid</span>;
}

function Field({ label, children, error, required }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}

/* --- Main Component --- */

export default function Compliance() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ valid_count: 0, expiring_count: 0, expired_count: 0 });
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);

  const [form, setForm] = useState({
    certificate_type: "",
    property_id: "",
    issue_date: getTodayYMD(),
    expiry_date: getTodayYMD(1),
    issued_by: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const statsControllerRef = useRef(null);
  const listControllerRef = useRef(null);
  const hotelsControllerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // --- Data Fetching Logic (Identical to original) ---
  function normalizeHotelsResponse(data) {
    if (!data) return [];
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data.data)) items = data.data;
    else if (Array.isArray(data.rows)) items = data.rows;
    else if (Array.isArray(data.hotels)) items = data.hotels;
    else if (typeof data === "object") {
        const vals = Object.values(data);
        const possibleObjects = vals.filter((v) => v && (v.id || v.name));
        if (possibleObjects.length && !Array.isArray(data)) {
            items = Array.isArray(possibleObjects[0]) ? possibleObjects[0] : possibleObjects;
        }
    }
    return items
      .map((h) => {
        const id = h?.id ?? h?.hotel_id ?? h?._id ?? null;
        const name = h?.name ?? h?.title ?? h?.hotel_name ?? `${id ?? ""}`;
        return { id, name };
      })
      .filter((x) => x.id && x.name);
  }

  const fetchHotels = async (signal) => {
    try {
      setHotelsLoading(true);
      const res = await api.get("/api/hotels", { params: { limit: 500 }, signal });
      let normalized = normalizeHotelsResponse(res?.data ?? {});
      if (normalized.length) {
        setHotels(normalized);
        if (normalized.length === 1 && !form.property_id) {
          setForm(f => ({ ...f, property_id: normalized[0].id }));
        }
      } else {
        setHotels([]);
      }
    } catch (err) {
      if (err?.name !== "CanceledError") setHotels([]);
    } finally {
      setHotelsLoading(false);
    }
  };

  const fetchStats = async (signal) => {
    try {
      const res = await api.get("/api/compliance/stats/summary", { signal });
      if (res?.data?.ok && res.data.data) setStats(res.data.data);
    } catch (err) { }
  };

  const fetchData = async (opts = {}, signal) => {
    try {
      setLoading(true);
      let hotelParamValue = undefined;
      if (propertyFilter !== "all") {
        const found = hotels.find(h => String(h.id) === String(propertyFilter));
        hotelParamValue = found ? found.name : propertyFilter;
      }

      const params = {
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        hotel_id: hotelParamValue,
        limit: opts.limit || 200,
        _t: Date.now(),
      };

      const res = await api.get("/api/compliance", { params, signal });
      let items = res?.data?.ok ? res.data.data || [] : [];
      
      const augmented = items.map((c) => {
        const serverName = (c?.hotel_name ?? c?.property_name ?? "").toString().trim();
        return { ...c, hotel_name: serverName || "" };
      });
      setCertificates(augmented);
    } catch (err) {
      if (err?.name !== "CanceledError") setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statsController = new AbortController();
    const listController = new AbortController();
    const hotelsController = new AbortController();

    (async () => {
      await fetchHotels(hotelsController.signal);
      fetchStats(statsController.signal);
      fetchData({}, listController.signal);
    })();

    return () => {
      statsController.abort();
      listController.abort();
      hotelsController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, propertyFilter]);

  // --- Form Logic ---
  function resetForm() {
    setForm({
      certificate_type: "",
      property_id: hotels.length === 1 ? hotels[0].id : "",
      issue_date: getTodayYMD(),
      expiry_date: getTodayYMD(1),
      issued_by: "",
      notes: "",
    });
    setFieldErrors({});
    setFormError("");
    setIsEditing(false);
    setEditId(null);
  }

  function openModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(c) {
    if (!c) return;
    setForm({
      certificate_type: c.certificate_type ?? "",
      property_id: c.property_id ?? c.hotel_id ?? "",
      issue_date: toInputYMD(c.issue_date) || "",
      expiry_date: toInputYMD(c.expiry_date) || "",
      issued_by: c.issued_by ?? "",
      notes: c.notes ?? "",
    });
    setIsEditing(true);
    setEditId(c.id);
    setModalOpen(true);
  }

  async function submitCertificate(e) {
    e?.preventDefault();
    setFormError("");
    
    // Validation
    const errs = {};
    if (!form.certificate_type) errs.certificate_type = "Required";
    if (!form.property_id) errs.property_id = "Required";
    if (!form.issue_date) errs.issue_date = "Required";
    if (!form.expiry_date) errs.expiry_date = "Required";
    if (!form.issued_by) errs.issued_by = "Required";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSubmitting(true);
    const selectedHotelId = form.property_id;
    const hotelNameFromList = hotels.find(h => String(h.id) === String(selectedHotelId))?.name;
    const clean = (v) => (v === "" ? null : v);

    const payload = {
      certificate_type: clean(form.certificate_type),
      issue_date: clean(form.issue_date),
      expiry_date: clean(form.expiry_date),
      issued_by: clean(form.issued_by),
      notes: clean(form.notes),
      [PROPERTY_FIELD]: selectedHotelId,
      hotel_name: hotelNameFromList
    };

    try {
      const url = isEditing ? `/api/compliance/${editId}` : "/api/compliance";
      const method = isEditing ? "put" : "post";
      await api[method](url, payload);
      
      setModalOpen(false);
      resetForm();
      fetchStats();
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.error || err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm("Delete certificate?")) return;
    try {
      await api.delete(`/api/compliance/${c.id}`);
      setCertificates(prev => prev.filter(x => x.id !== c.id));
      fetchStats();
    } catch (err) {
      alert("Delete failed");
    }
  }

  function displayStatus(c) {
      if (c.status) return c.status;
      return computeStatusFromExpiry(c.expiry_date);
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-700">
      
      {/* 1. Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Compliance</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
             <i className="fa fa-home"></i> {/* Placeholder icon */}
             <span>/</span> <span>Operations Hub</span> <span>/</span> <span className="text-slate-600 font-medium">Compliance</span>
          </div>
        </div>
        <button 
          onClick={openModal} 
          className="bg-[#e77a40] hover:bg-[#d66a30] text-white px-5 py-2.5 rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Certificate
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div className="flex flex-wrap gap-5 mb-8">
        <StatCard 
            colorBg="bg-green-500" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>} 
            title="Valid Certificates" 
            value={stats.valid_count ?? 0} 
        />
        <StatCard 
            colorBg="bg-[#e77a40]" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} 
            title="Expiring Soon" 
            value={stats.expiring_count ?? 0} 
        />
        <StatCard 
            colorBg="bg-pink-500" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>} 
            title="Expired" 
            value={stats.expired_count ?? 0} 
        />
      </div>

      {/* 3. Toolbar (Search & Filter) */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-3">
         <div className="px-4 font-bold text-slate-700 whitespace-nowrap hidden md:block">
            Certificates
         </div>
         <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
         
         <div className="flex-1 w-full relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search certificates..." 
                className="w-full pl-9 pr-4 py-2 text-sm border-none focus:ring-0 text-slate-600 placeholder:text-slate-400"
            />
         </div>

         <div className="flex gap-2 w-full md:w-auto p-1">
             <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-slate-300 outline-none">
                 <option value="all">All Status</option>
                 <option value="valid">Valid</option>
                 <option value="expiring">Expiring</option>
                 <option value="expired">Expired</option>
             </select>
             <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-slate-300 outline-none">
                 <option value="all">All Properties</option>
                 {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
             </select>
         </div>
      </div>

      {/* 4. Certificate List (Cards) */}
      <div className="space-y-4">
        {loading ? (
            <div className="text-center py-12 text-slate-400">Loading certificates...</div>
        ) : certificates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">No certificates found.</div>
        ) : (
            certificates.map(c => {
                const status = displayStatus(c);
                return (
                    <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            
                            {/* Left Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-slate-800">{c.certificate_type}</h3>
                                    <StatusBadge status={status} />
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-3">
                                    <div className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/><path d="M9 10a1 1 0 011-1h4a1 1 0 011 1v3H9v-3z"/></svg>
                                        <span>{c.hotel_name || "Unknown Property"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        <span>Issued: {formatLongDate(c.issue_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        <span>Expires: {formatLongDate(c.expiry_date)}</span>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-500 mt-2">
                                    <span className="opacity-70">Issued by: </span>
                                    <span className="font-medium text-slate-600">{c.issued_by}</span>
                                </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-3 self-end md:self-center mt-2 md:mt-0">
                                {/* Visual Dropdown for Status (ReadOnly based on screenshot context) */}
                                <div className="relative">
                                    <div className="border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-600 flex items-center gap-2 bg-slate-50">
                                        {status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expiring Soon' : 'Valid'}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleDelete(c)}
                                    className="px-4 py-1.5 rounded border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                                <button 
                                    onClick={() => openEditModal(c)}
                                    className="px-3 py-1.5 text-slate-400 hover:text-slate-600"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* 5. Modal (Styled like Image 2 - Grid Layout) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                 <h2 className="text-xl font-bold text-slate-800">
                    {isEditing ? "Edit Certificate" : "Create Compliance Certificate"}
                 </h2>
                 <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
              </div>

              <div className="p-8">
                 {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{formError}</div>}
                 
                 <form onSubmit={submitCertificate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Row 1 */}
                        <div>
                            <Field label="Certificate Type" required error={fieldErrors.certificate_type}>
                                <select 
                                    name="certificate_type"
                                    value={form.certificate_type} 
                                    onChange={e => setForm({...form, certificate_type: e.target.value})}
                                    className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all"
                                >
                                    <option value="">e.g., Fire Safety</option>
                                    {CERTIFICATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div>
                             <Field label="Property / Hotel" required error={fieldErrors.property_id}>
                                <select 
                                    name="property_id"
                                    value={form.property_id}
                                    onChange={e => setForm({...form, property_id: e.target.value})}
                                    className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all"
                                >
                                    <option value="">-- Select hotel --</option>
                                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </Field>
                        </div>

                        {/* Row 2 */}
                        <div>
                            <Field label="Issue Date" required error={fieldErrors.issue_date}>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        name="issue_date"
                                        value={form.issue_date}
                                        onChange={e => setForm({...form, issue_date: e.target.value})}
                                        className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all"
                                    />
                                </div>
                            </Field>
                        </div>
                        <div>
                             <Field label="Issued By" required error={fieldErrors.issued_by}>
                                <input 
                                    type="text"
                                    name="issued_by"
                                    value={form.issued_by}
                                    onChange={e => setForm({...form, issued_by: e.target.value})} 
                                    className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all"
                                />
                            </Field>
                        </div>

                        {/* Row 3 */}
                        <div>
                             <Field label="Expiry Date" required error={fieldErrors.expiry_date}>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        name="expiry_date"
                                        value={form.expiry_date}
                                        onChange={e => setForm({...form, expiry_date: e.target.value})}
                                        className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all"
                                    />
                                </div>
                            </Field>
                        </div>
                        <div>
                            {/* Empty space or additional field if needed */}
                        </div>

                        {/* Row 4 (Full Width) */}
                        <div className="md:col-span-2">
                             <Field label="Notes / Description (optional)">
                                <textarea 
                                    rows={4}
                                    value={form.notes}
                                    onChange={e => setForm({...form, notes: e.target.value})}
                                    className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:border-[#e77a40] focus:ring-1 focus:ring-[#e77a40] outline-none transition-all resize-none"
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={() => setModalOpen(false)}
                            className="px-6 py-2.5 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-6 py-2.5 bg-[#259b6c] text-white rounded font-medium hover:bg-[#1f855c] shadow-sm transition-colors"
                        >
                            {submitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Certificate")}
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