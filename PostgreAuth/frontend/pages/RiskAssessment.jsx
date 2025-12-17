/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

/* axios instance (matches your other pages) */
const API_BASE = import.meta.env.VITE_API_URL || axios.defaults.baseURL || "";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

/* small SVG icons */
const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
);
const IconPending = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

/* helper for normalizing hotels responses */
function normalizeHotelsResponse(data) {
  if (!data) return [];
  let items = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data.data)) items = data.data;
  else if (Array.isArray(data.rows)) items = data.rows;
  else if (Array.isArray(data.hotels)) items = data.hotels;
  else if (typeof data === "object") {
    const vals = Object.values(data);
    const possibleObjects = vals.filter((v) => v && (v.id || v.name || v.hotel_name));
    if (possibleObjects.length && !Array.isArray(data)) {
      items = Array.isArray(possibleObjects[0]) ? possibleObjects[0] : possibleObjects;
    }
  }
  return items
    .map((h) => {
      const id = h?.id ?? h?.hotel_id ?? h?._id ?? null;
      const name = h?.name ?? h?.title ?? h?.hotel_name ?? `${id ?? ""}`;
      const address = h?.address ?? null;
      return { id, name, address };
    })
    .filter((x) => x.id && x.name);
}

/* format date like "Feb 8, 2025" */
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

export default function RiskAssessment() {
  const [inspections, setInspections] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const hotelsControllerRef = useRef(null);

  const [formData, setFormData] = useState({
    inspectionType: "",
    propertyId: "",
    propertyName: "",
    serviceUserId: "",
    serviceUserName: "",
    inspectorName: "",
    inspectionDate: "",
    findings: "",
    issuesFound: 0,
    actionRequired: false,
    status: "pending",
  });

  const stats = {
    total: inspections.length,
    pending: inspections.filter((i) => i.status === "pending").length,
    completed: inspections.filter((i) => i.status === "completed").length,
    actionRequired: inspections.filter((i) => !!(i.actionRequired ?? i.action_required)).length,
  };

  useEffect(() => {
    const ctrl = new AbortController();
    hotelsControllerRef.current = ctrl;
    fetchHotels(ctrl.signal);
    fetchInspections();
    return () => {
      try { ctrl.abort(); } catch {}
      hotelsControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Fetch hotels - ignores canceled errors */
  async function fetchHotels(signal) {
    try {
      setHotelsLoading(true);
      const res = await api.get("/api/hotels", { params: { limit: 1000 }, signal });
      const normalized = normalizeHotelsResponse(res?.data ?? {});
      setHotels(normalized);
      if (normalized.length === 1 && !formData.propertyId) {
        setFormData((f) => ({ ...f, propertyId: normalized[0].id, propertyName: normalized[0].name }));
        fetchServiceUsers(normalized[0].id);
      }
    } catch (err) {
      const isCanceled = err && (err.name === "CanceledError" || err.code === "ERR_CANCELED" || axios.isCancel?.(err));
      if (!isCanceled) {
        console.error("fetchHotels error:", err);
        setHotels([]);
      }
    } finally {
      setHotelsLoading(false);
    }
  }

  /* Fetch service users for a given hotel id. */
  async function fetchServiceUsers(hotelId) {
    if (!hotelId) {
      setServiceUsers([]);
      return;
    }

    async function tryPath(path) {
      const r = await api.get(path);
      return r?.data?.data ?? r?.data ?? [];
    }

    try {
      // canonical path used in some apps
      const canonical = `/api/hotels/${hotelId}/service-users`;
      const rows = await tryPath(canonical);
      const normalized = (Array.isArray(rows) ? rows : []).map((r) => ({
        id: r.id,
        first_name: r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ""}`
      })).filter(Boolean);
      setServiceUsers(normalized);
      return;
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 404) {
        console.error("fetchServiceUsers error (canonical):", err);
        setServiceUsers([]);
        return;
      }
    }

    // Fallbacks
    const fallbacks = [
      `/api/su?hotel_id=${encodeURIComponent(hotelId)}`,
      `/api/su?hotelId=${encodeURIComponent(hotelId)}`,
      `/api/su?hotel=${encodeURIComponent(hotelId)}`,
      `/api/su/${encodeURIComponent(hotelId)}`,
      `/api/service_users?hotel_id=${encodeURIComponent(hotelId)}`,
      `/api/service_users/${encodeURIComponent(hotelId)}`,
    ];

    for (const path of fallbacks) {
      try {
        const rows = await tryPath(path);
        const normalized = (Array.isArray(rows) ? rows : []).map((r) => ({
          id: r.id,
          first_name: r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ""}`
        })).filter(Boolean);
        if (normalized.length) {
          setServiceUsers(normalized);
          return;
        }
      } catch (err) {
        // ignore
      }
    }

    setServiceUsers([]);
  }

  async function fetchInspections() {
    try {
      setLoading(true);
      const res = await api.get("/api/inspections", { params: { limit: 200 } });
      const rows = res?.data?.data ?? res?.data ?? [];
      setInspections(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("fetchInspections error:", err);
      setInspections([]);
      setError("Unable to load inspections. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, type, value, checked } = e.target;
    if (type === "checkbox") {
      setFormData((p) => ({ ...p, [name]: checked }));
      return;
    }
    if (type === "number") {
      setFormData((p) => ({ ...p, [name]: value === "" ? "" : Number(value) }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handlePropertyChange(e) {
    const hotelId = e.target.value;
    const hotel = hotels.find((h) => String(h.id) === String(hotelId)) || null;
    setFormData((prev) => ({
      ...prev,
      propertyId: hotelId,
      propertyName: hotel ? hotel.name : "",
      serviceUserId: "",
      serviceUserName: "",
    }));
    setServiceUsers([]);
    if (hotelId) fetchServiceUsers(hotelId);
  }

  function handleServiceUserChange(e) {
    const suId = e.target.value;
    const su = serviceUsers.find((s) => String(s.id) === String(suId)) || null;
    setFormData((prev) => ({ ...prev, serviceUserId: suId, serviceUserName: su ? su.first_name : "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!formData.inspectionType || !formData.propertyId || !formData.inspectorName || !formData.inspectionDate) {
      setError("Please fill required fields: Inspection Type, Property, Inspector Name, Inspection Date.");
      return;
    }

    setSubmitting(true);

    const payload = {
      inspectionType: formData.inspectionType,
      inspection_type: formData.inspectionType,
      propertyId: formData.propertyId,
      property_id: formData.propertyId,
      property: formData.propertyName,
      serviceUserId: formData.serviceUserId || null,
      service_user_id: formData.serviceUserId || null,
      serviceUser: formData.serviceUserName || null,
      service_user: formData.serviceUserName || null,
      inspectorName: formData.inspectorName,
      inspector_name: formData.inspectorName,
      inspectionDate: formData.inspectionDate,
      inspection_date: formData.inspectionDate,
      findings: formData.findings || null,
      issuesFound: Number.isFinite(Number(formData.issuesFound)) ? Number(formData.issuesFound) : 0,
      issues_found: Number.isFinite(Number(formData.issuesFound)) ? Number(formData.issuesFound) : 0,
      actionRequired: !!formData.actionRequired,
      action_required: !!formData.actionRequired,
      status: formData.status || "pending",
      priority: formData.actionRequired ? "Urgent" : "Medium",
    };
    try {
      let res;
      if (editingId) {
        res = await api.put(`/api/inspections/${editingId}`, payload);
      } else {
        res = await api.post("/api/inspections", payload);
      }
      const result = res?.data?.data ?? res?.data ?? null;
      if (result) {
        setInspections((prev) => {
          if (editingId) {
            return prev.map((p) => (String(p.id) === String(editingId) ? result : p));
          }
          return [result, ...prev];
        });
        setShowModal(false);
        setEditingId(null);
        setFormData({
          inspectionType: "",
          propertyId: "",
          propertyName: "",
          serviceUserId: "",
          serviceUserName: "",
          inspectorName: "",
          inspectionDate: "",
          findings: "",
          issuesFound: 0,
          actionRequired: false,
          status: "pending",
        });
      } else {
        setError("Unexpected server response.");
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message;
      console.error("handleSubmit error:", err);
      setError(String(serverMsg || "Submission failed, see console."));
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status) => {
    if (status === "completed") return "text-emerald-500";
    if (status === "pending") return "text-amber-400";
    return "text-slate-500";
  };
  const getPriorityColor = (priority) => {
    if (priority === "Urgent") return "text-red-500";
    if (priority === "Medium") return "text-amber-400";
    return "text-emerald-500";
  };

  /* Edit / Delete handlers */
  const handleEdit = (id) => {
    const item = inspections.find((i) => String(i.id) === String(id) || i.reference === id);
    if (!item) return;
    // populate form with existing values (normalize keys)
    setFormData({
      inspectionType: item.inspectionType ?? item.inspection_type ?? "",
      propertyId: item.propertyId ?? item.property_id ?? item.property ?? "",
      propertyName: item.propertyName ?? item.property_name ?? item.property ?? "",
      serviceUserId: item.serviceUserId ?? item.service_user_id ?? item.service_user ?? "",
      serviceUserName: item.serviceUser ?? item.service_user ?? item.serviceUserName ?? "",
      inspectorName: item.inspectorName ?? item.inspector_name ?? "",
      inspectionDate: (item.inspectionDate ?? item.inspection_date ?? "").toString().substring(0, 10),
      findings: item.findings ?? "",
      issuesFound: item.issuesFound ?? item.issues_found ?? 0,
      actionRequired: !!(item.actionRequired ?? item.action_required),
      status: item.status ?? "pending",
    });
    // fetch service users for property if present
    const propId = item.propertyId ?? item.property_id ?? item.property ?? "";
    if (propId) fetchServiceUsers(propId);
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this inspection? This action cannot be undone.");
    if (!ok) return;
    try {
      await api.delete(`/api/inspections/${id}`);
      setInspections((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      console.error("handleDelete error:", err);
      window.alert("Unable to delete inspection. See console for details.");
    }
  };

  const openNewInspection = () => {
    setEditingId(null);
    setFormData({
        // Referral basics
    referralType: "",
    priority: "medium",

    // Property & service user
    propertyId: "",
    serviceUserId: "",

    // Core safeguarding details
    concernDetails: "",
    immediateActions: "",

    // External referral
    actionRequired: false,          // External Referral Made (Yes/No)
    externalAgency: "",

    // Reporting info
    reportedBy: "",
    dateReported: "",

    // Assignment & status
    assignedOfficer: "",
    status: "new",
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-700">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Risk Assessments</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <IconHome size={14} /> <span>/</span> <span>Operation Hub</span> <span>/</span><span>Safeguarding</span> <span>/</span> <span className="text-slate-800 font-medium">Risk Assessments</span>
              </div>
          </div>
          <button onClick={openNewInspection} className="bg-[#e77a40] hover:bg-[#d66a30] text-white px-5 py-2.5 rounded shadow-sm font-medium flex items-center gap-2 transition-colors">
            <span className="text-lg leading-none">+</span> New Assessment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-blue-500 shadow-blue-100"><IconClipboard /></div>
            <div><div className="text-sm font-medium text-slate-500">New Tasks</div><div className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#e77a40] shadow-orange-100"><IconPending /></div>
            <div><div className="text-sm font-medium text-slate-500">Under Review</div><div className="text-3xl font-bold text-slate-800 mt-1">{stats.pending}</div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-emerald-500 shadow-emerald-100"><IconCheck /></div>
            <div><div className="text-sm font-medium text-slate-500">Escalated</div><div className="text-3xl font-bold text-slate-800 mt-1">{stats.completed}</div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-pink-500 shadow-pink-100"><IconAlert /></div>
            <div><div className="text-sm font-medium text-slate-500">Resolved</div><div className="text-3xl font-bold text-slate-800 mt-1">{stats.actionRequired}</div></div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><h3 className="text-lg font-bold text-slate-800">Referrals List</h3><div className="text-sm text-gray-400 mt-1">{stats.total} total records</div></div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input type="text" placeholder="Search Referrals..." className="pl-10 pr-4 py-2 border border-slate-200 rounded text-sm w-64 focus:outline-none focus:border-slate-400" />
                <svg className="absolute left-3 top-2.5 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">View ▼</button>
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">Filter</button>
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">Columns</button>
              <button onClick={openNewInspection} className="bg-[#e77a40] hover:bg-[#d66a30] text-white px-4 py-2 rounded shadow-sm text-sm font-medium flex items-center gap-2 transition-colors">Create Assessment</button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-5 w-10"><input type="checkbox" className="rounded border-slate-300 accent-orange-500 cursor-pointer"/></th>
                  <th className="p-5">TYPE ▼</th>
                  <th className="p-5">REFERENCE ▼</th>
                  <th className="p-5 w-1/4">DESCRIPTION ▼</th>
                  <th className="p-5">PRIORITY ▼</th>
                  <th className="p-5">STATUS ▼</th>
                  <th className="p-5">ASSIGNED TO ▼</th>
                  <th className="p-5">DATE ▼</th>
                  <th className="p-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="9" className="p-12 text-center text-slate-400 italic">Loading...</td></tr>
                ) : inspections.length > 0 ? inspections.map((r) => (
                  <tr key={r.id ?? r.reference} className="border-b border-slate-50 hover:bg-slate-50 group transition-colors">
                    <td className="p-5 align-top pt-6"><input type="checkbox" className="rounded border-slate-300 accent-orange-500 cursor-pointer"/></td>
                    <td className="p-5 align-top pt-6"><span className="bg-orange-50 text-orange-500 border border-orange-100 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">Risk Assessment</span></td>
                    <td className="p-5 align-top pt-5"><div className="font-bold text-slate-700 text-base">{r.reference}</div></td>
                    <td className="p-5 align-top pt-5"><div className="font-bold text-slate-700 text-base">{r.inspectionType || r.inspection_type}</div><div className="text-slate-400 text-xs mt-1 truncate max-w-xs">{r.findings}</div></td>
                    <td className="p-5 align-top pt-6"><div className="flex items-center gap-2"><span className={`text-xl leading-none ${getPriorityColor(r.priority)}`}>•</span><span className={`${getPriorityColor(r.priority)} font-medium`}>{r.priority}</span></div></td>
                    <td className="p-5 align-top pt-6"><div className="flex items-center gap-2"><span className={`text-xl leading-none ${getStatusColor(r.status)}`}>•</span><span className={`${getStatusColor(r.status)} font-medium capitalize`}>{r.status}</span></div></td>
                    <td className="p-5 align-top pt-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {((r.inspectorName || r.inspector_name) ?? "").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-600 font-medium">{r.inspectorName || r.inspector_name}</span>
                      </div>
                    </td>
                    <td className="p-5 align-top pt-6 text-slate-600 whitespace-nowrap">
                      {formatDate(r.inspectionDate || r.inspection_date)}
                    </td>
                    <td className="p-5 align-top pt-6 text-right">
                       <div className="flex items-center justify-end gap-3 text-slate-400">
                          <button onClick={() => handleEdit(r.id)} className="hover:text-blue-500 transition-colors" title="Edit">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="hover:text-red-500 transition-colors" title="Delete">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="p-12 text-center text-slate-400 italic">No inspections found. Click "Create Inspection" to add data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="flex justify-between items-start p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Risk Assessment 
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Form for safeguarding concerns and referrals
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <IconX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Referral Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Referral Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="referralType"
                    required
                    value={formData.referralType}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  >
                    <option value="">Select referral type</option>
                    <option>Child Protection</option>
                    <option>Adult at Risk</option>
                    <option>Domestic Abuse</option>
                    <option>Self-Harm/Suicide Risk</option>
                    <option>Exploitation</option>
                    <option>Modern Slavery</option>
                    <option>Mental Health Crisis</option>
                    <option>Other Vulnerability</option>
                  </select>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    required
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Property */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Property <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="propertyId"
                    required
                    value={formData.propertyId}
                    onChange={handlePropertyChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  >
                    <option value="">Select property</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service User */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Service User <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serviceUserId"
                    required
                    value={formData.serviceUserId}
                    onChange={handleServiceUserChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  >
                    <option value="">Select service user</option>
                    {serviceUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Concern Details */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Concern Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="concernDetails"
                    required
                    rows={4}
                    value={formData.concernDetails}
                    onChange={handleInputChange}
                    placeholder="Describe the safeguarding concern in detail..."
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm resize-none outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Include specific observations, dates, and any disclosures
                    made
                  </p>
                </div>

                {/* Immediate Actions */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Immediate Actions Taken
                  </label>
                  <textarea
                    name="immediateActions"
                    rows={3}
                    value={formData.immediateActions}
                    onChange={handleInputChange}
                    placeholder="What actions have been taken so far..."
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm resize-none outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                </div>

                {/* External Referral Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    External Referral Made
                  </label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="actionRequired"
                        checked={!!formData.actionRequired}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#e77a40]
            after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white
            after:rounded-full after:top-[2px] after:left-[2px]
            peer-checked:after:translate-x-full after:transition-all"
                      ></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        Yes / No
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Check if referred to external agencies (police, social
                    services)
                  </p>
                </div>

                {/* External Agency */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    External Agency Name
                  </label>
                  <input
                    name="externalAgency"
                    value={formData.externalAgency}
                    onChange={handleInputChange}
                    placeholder="Name of external agency"
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                </div>

                {/* Reported By */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Reported By <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="reportedBy"
                    required
                    value={formData.reportedBy}
                    onChange={handleInputChange}
                    placeholder="Name of person making referral"
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                </div>

                {/* Date Reported */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Date Reported <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateReported"
                    required
                    value={formData.dateReported}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                </div>

                {/* Assigned Officer */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Assigned Safeguarding Officer
                  </label>
                  <input
                    name="assignedOfficer"
                    value={formData.assignedOfficer}
                    onChange={handleInputChange}
                    placeholder="Name of assigned officer"
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm outline-none
        focus:border-[#e77a40] focus:ring-2 focus:ring-[#e77a40]/30"
                  >
                    <option value="new">new</option>
                    <option value="under_review">under-review</option>
                    <option value="escalated">escalated</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between gap-3 mt-8 pt-4 border-t border-slate-100 items-center">
                {error ? (
                  <div className="text-sm text-red-500">{error}</div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                    }}
                    className="px-6 py-2.5 border border-slate-200 rounded text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#e77a40] text-white rounded font-medium hover:bg-[#d66a30] shadow-sm transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit Form"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const IconHome = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;