/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || axios.defaults.baseURL || '';
const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 15000 });

// --- Helpers for Formatting ---
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoString;
  }
}

function getPriorityColor(p) {
  const low = String(p).toLowerCase();
  if (low === "urgent" || low === "high" || low === "critical") return "text-red-500";
  if (low === "medium") return "text-amber-400";
  return "text-emerald-500"; // Low
}

function getStatusColor(s) {
  const low = String(s).toLowerCase();
  if (low === "resolved" || low === "completed") return "text-emerald-500";
  if (low === "pending" || low === "open") return "text-amber-400";
  return "text-slate-500";
}

function getAvatarColor(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("manager")) return "bg-amber-400";
  if (n.includes("house")) return "bg-blue-500";
  if (n.includes("quick")) return "bg-orange-500";
  return "bg-slate-300";
}

function getInitials(name) {
  if (!name || name === "Unassigned") return "";
  return name.match(/(\b\S)?/g).join("").match(/(^\S|\S$)?/g).join("").toUpperCase().slice(0, 2);
}

function normalizeHotelsResponse(data) {
  if (!data) return [];
  let items = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data.data)) items = data.data;
  else if (Array.isArray(data.rows)) items = data.rows;
  else if (Array.isArray(data.hotels)) items = data.hotels;
  else if (typeof data === 'object') {
    const vals = Object.values(data);
    const possibleObjects = vals.filter((v) => v && (v.id || v.name || v.hotel_name));
    if (possibleObjects.length && !Array.isArray(data)) {
      items = Array.isArray(possibleObjects[0]) ? possibleObjects[0] : possibleObjects;
    }
  }
  return items
    .map((h) => {
      const id = h?.id ?? h?.hotel_id ?? h?._id ?? null;
      const name = h?.name ?? h?.title ?? h?.hotel_name ?? `${id ?? ''}`;
      const address = h?.address ?? null;
      return { id, name, address };
    })
    .filter((x) => x.id && x.name);
}

export default function Incidents() {
  // Empty initial data — user will provide new data
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const stats = [
    { label: 'Total Incidents', value: rows.length, color: 'bg-blue-500', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    { label: 'Open', value: rows.filter((r) => (r.status || '').toLowerCase() === 'open').length, color: 'bg-[#f97316]', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    { label: 'In Progress', value: rows.filter((r) => (r.status || '').toLowerCase() === 'in progress').length, color: 'bg-purple-600', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    { label: 'Resolved', value: rows.filter((r) => (r.status || '').toLowerCase() === 'resolved' || (r.status || '').toLowerCase() === 'completed').length, color: 'bg-emerald-500', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
  ];

  const [hotels, setHotels] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const hotelsControllerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    incidentType: '',
    severity: 'Medium',
    propertyId: '',
    propertyName: '',
    serviceUserId: '',
    description: '',
    reportedBy: '',
    reportedDate: '',
    assignedTo: '',
    status: 'Open',
  });

  useEffect(() => {
    const ctrl = new AbortController();
    hotelsControllerRef.current = ctrl;
    fetchHotels(ctrl.signal);
    fetchIncidents();
    return () => {
      try { ctrl.abort(); } catch {}
      hotelsControllerRef.current = null;
    };
  }, []);

  async function fetchIncidents() {
    try {
      const res = await api.get('/api/incidents', { params: { limit: 200 } });
      const data = res?.data?.data ?? res?.data ?? [];
      if (!Array.isArray(data)) return setRows([]);
      const mapped = data.map((created) => ({
        ref: created.reference ?? created.ref ?? String(created.id ?? ''),
        title: created.type ?? created.title ?? (created.reference ?? ''),
        desc: created.description ?? created.desc ?? '',
        priority: created.severity ?? created.priority ?? 'Medium',
        status: created.status ?? 'Open',
        assigned: created.assigned_to ?? created.assigned ?? '',
        date: created.reported_date ?? created.created_at ?? created.reportedDate ?? null,
        propertyName: created.property_name ?? created.propertyName ?? null,
        serviceUserId: created.service_user_id ?? created.serviceUserId ?? null,
        raw: created,
      }));
      setRows(mapped);
    } catch (err) {
      console.error('fetchIncidents error', err);
      setRows([]);
    }
  }

  async function fetchHotels(signal) {
    try {
      setHotelsLoading(true);
      const res = await api.get('/api/hotels', { params: { limit: 1000 }, signal });
      const normalized = normalizeHotelsResponse(res?.data ?? {});
      setHotels(normalized);
      if (normalized.length === 1 && !formData.propertyId) {
        setFormData((f) => ({ ...f, propertyId: normalized[0].id }));
        fetchServiceUsers(normalized[0].id);
      }
    } catch (err) {
      const isCanceled = err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || axios.isCancel?.(err));
      if (!isCanceled) {
        console.error('fetchHotels error:', err);
        setHotels([]);
      }
    } finally {
      setHotelsLoading(false);
    }
  }

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
      const canonical = `/api/hotels/${hotelId}/service-users`;
      const rows = await tryPath(canonical);
      const normalized = (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, first_name: r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ''}` })).filter(Boolean);
      setServiceUsers(normalized);
      return;
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 404) {
        console.error('fetchServiceUsers error (canonical):', err);
        setServiceUsers([]);
        return;
      }
    }

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
        const normalized = (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, first_name: r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ''}` })).filter(Boolean);
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

    /* Edit/Delete handlers */
    const handleEdit = async (row) => {
      // row.raw should contain backend record; if not, try fetching
      let record = row.raw ?? null;
      try {
        if (!record || !record.id) {
          const ref = row.ref;
          // attempt to find by reference via list or fetch
          if (ref) {
            const found = rows.find((r) => r.ref === ref);
            record = found?.raw ?? null;
          }
        }
        if (!record || !record.id) {
          // fallback: fetch from server by id/ref if id present
          if (row.raw?.id) {
            const res = await api.get(`/api/incidents/${row.raw.id}`);
            record = res?.data?.data ?? res?.data ?? null;
          }
        }
      } catch (err) {
        console.error('handleEdit fetch error', err);
      }
      if (!record) {
        window.alert('Unable to load incident for editing');
        return;
      }
      // Map record to formData
      setFormData({
        incidentType: record.type ?? record.incidentType ?? '',
        severity: record.severity ?? 'Medium',
        propertyId: record.property_id ?? record.propertyId ?? '',
        serviceUserId: record.service_user_id ?? record.serviceUserId ?? '',
        description: record.description ?? '',
        reportedBy: record.reported_by ?? record.reportedBy ?? '',
        reportedDate: record.reported_date ? String(record.reported_date).substring(0,10) : '',
        assignedTo: record.assigned_to ?? record.assignedTo ?? '',
        status: record.status ?? 'Open',
      });
      if (record.property_id || record.propertyId) fetchServiceUsers(record.property_id ?? record.propertyId);
      // ensure we store numeric id for editing (backend expects id param)
      setEditingId(record.id ?? null);
      setShowModal(true);
    };

    const handleDelete = async (row) => {
      const id = row.raw?.id ?? null;
      if (!id) {
        // try to locate by reference
        window.alert('Unable to determine incident id to delete');
        return;
      }
      const ok = window.confirm('Delete this incident? This action cannot be undone.');
      if (!ok) return;
      try {
        await api.delete(`/api/incidents/${id}`);
        setRows((prev) => prev.filter((r) => String(r.raw?.id) !== String(id)));
      } catch (err) {
        console.error('delete incident error', err);
        window.alert('Unable to delete incident. See console for details.');
      }
    };

  function handleInputChange(e) {
    const { name, type, value, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((p) => ({ ...p, [name]: checked }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  }

  function handlePropertyChange(e) {
    const hotelId = e.target.value;
    const hotel = hotels.find((h) => String(h.id) === String(hotelId)) || null;
    setFormData((p) => ({ ...p, propertyId: hotelId, propertyName: hotel ? hotel.name : '', serviceUserId: '' }));
    setServiceUsers([]);
    if (hotelId) fetchServiceUsers(hotelId);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        type: formData.incidentType,
        severity: formData.severity,
        property_id: formData.propertyId,
        property_name: formData.propertyName || null,
        service_user_id: formData.serviceUserId || null,
        description: formData.description,
        reported_by: formData.reportedBy,
        reported_date: formData.reportedDate,
        assigned_to: formData.assignedTo,
        status: formData.status,
      };
      let res;
      if (editingId) {
        // update existing incident
        res = await api.put(`/api/incidents/${editingId}`, payload);
      } else {
        res = await api.post('/api/incidents', payload);
      }
      console.log('Incident saved', res?.data);
      // refresh list from server to ensure DB is authoritative
      await fetchIncidents();
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      console.error('create incident error', err);
      // Fallback for demo if API fails
      const fallbackRow = {
          ref: `INC-2025-${Math.floor(Math.random()*10000)}`,
          title: formData.incidentType || 'Incident',
          desc: formData.description,
          priority: formData.severity,
          status: formData.status,
          assigned: formData.assignedTo || 'Unassigned',
          date: formData.reportedDate || new Date().toISOString()
      };
      setRows((prev) => [fallbackRow, ...prev]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  const openReportModal = () => setShowModal(true);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-slate-700">
      <div className="max-w-[1600px] mx-auto">
        
        {/* 1. Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Incidents</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
               <span className="hover:text-gray-600 cursor-pointer">Incident Management</span> 
               <span>/</span> 
               <span className="text-slate-600 font-medium">Incident Reports</span>
            </div>
          </div>
          <button 
            onClick={openReportModal} 
            className="bg-[#e77a40] hover:bg-[#d66a30] text-white px-5 py-2.5 rounded shadow-sm font-medium flex items-center gap-2 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Report Incident
          </button>
        </div>

        {/* 2. Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${s.color}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">{s.label}</div>
                <div className="text-3xl font-bold text-slate-800 mt-1">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          
          {/* Toolbar Top */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">All Records</h3>
              <div className="text-sm text-gray-400 mt-1">{rows.length} total records</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input 
                    type="text" 
                    placeholder="Filter records..." 
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded text-sm w-64 focus:outline-none focus:border-slate-400" 
                />
                <svg className="absolute left-3 top-2.5 text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                 View <span className="text-[10px] ml-1">▼</span>
              </button>
              
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                 Filter
              </button>
              
              <button className="px-3 py-2 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-gray-50 flex items-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>
                 Columns
              </button>

              <button onClick={openReportModal} className="bg-[#e77a40] hover:bg-[#d66a30] text-white px-4 py-2 rounded shadow-sm text-sm font-medium flex items-center gap-2 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Report Incident
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="p-4 border-b border-slate-100 flex gap-3 overflow-x-auto">
             {['All Priority', 'All Status', 'All Properties'].map(label => (
                 <button key={label} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-4 justify-between min-w-[130px]">
                    {label} <span className="text-slate-400 text-[10px]">▼</span>
                 </button>
             ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-5 w-10"><input type="checkbox" className="rounded border-slate-300 accent-orange-500 cursor-pointer"/></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">TYPE <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">REFERENCE <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600 w-1/3">DESCRIPTION <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">PRIORITY <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">STATUS <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">ASSIGNED TO <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 cursor-pointer hover:text-slate-600">DATE <span className="ml-1 text-[9px]">▼</span></th>
                  <th className="p-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rows.length > 0 ? rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 group transition-colors">
                    {/* Checkbox */}
                    <td className="p-5 align-top pt-6">
                        <input type="checkbox" className="rounded border-slate-300 accent-orange-500 cursor-pointer"/>
                    </td>
                    
                    {/* Type Badge */}
                    <td className="p-5 align-top pt-6">
                        <span className="bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                            Incident
                        </span>
                    </td>

                    {/* Reference */}
                    <td className="p-5 align-top pt-5">
                        <div className="font-bold text-slate-700 text-base">{r.ref}</div>
                    </td>

                    {/* Description */}
                    <td className="p-5 align-top pt-5">
                      <div className="font-bold text-slate-700 text-base">{r.title}</div>
                      {r.propertyName && <div className="text-xs text-slate-500 mt-1">Property: <span className="font-medium text-slate-700">{r.propertyName}</span></div>}
                      <div className="text-slate-400 text-xs mt-1 truncate max-w-sm">{r.desc}</div>
                    </td>

                    {/* Priority (with color dot) */}
                    <td className="p-5 align-top pt-6">
                        <div className="flex items-center gap-2">
                            <span className={`text-xl leading-none ${getPriorityColor(r.priority)}`}>•</span>
                            <span className={`${getPriorityColor(r.priority)} font-medium`}>{r.priority}</span>
                        </div>
                    </td>

                    {/* Status (with color dot) */}
                    <td className="p-5 align-top pt-6">
                        <div className="flex items-center gap-2">
                            <span className={`text-xl leading-none ${getStatusColor(r.status)}`}>•</span>
                            <span className={`${getStatusColor(r.status)} font-medium`}>{r.status}</span>
                        </div>
                    </td>

                    {/* Assigned To (Avatar) */}
                    <td className="p-5 align-top pt-5">
                        <div className="flex items-center gap-3">
                            {r.assigned === 'Unassigned' || !r.assigned ? (
                                <span className="text-slate-400 italic">Unassigned</span>
                            ) : (
                                <>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(r.assigned)}`}>
                                        {getInitials(r.assigned)}
                                    </div>
                                    <span className="text-slate-600 font-medium">{r.assigned}</span>
                                </>
                            )}
                        </div>
                    </td>

                    {/* Date */}
                    <td className="p-5 align-top pt-6 text-slate-500 whitespace-nowrap">
                        {formatDate(r.date)}
                    </td>

                    {/* Actions */}
                    <td className="p-5 align-top pt-6 text-right">
                       <div className="flex items-center justify-end gap-3 text-slate-400">
                            <button onClick={() => handleEdit(r)} className="hover:text-blue-500 transition-colors" title="Edit">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                            <button onClick={() => handleDelete(r)} className="hover:text-red-500 transition-colors" title="Delete">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                    /* Empty State */
                    <tr>
                        <td colSpan="9" className="p-12 text-center text-slate-400 italic">
                            No records found. Click "Report Incident" to add data.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
             <div>Page 1 of 1</div>
             <div>Showing {rows.length} records</div>
          </div>
        </div>

        {/* Modal - Functionality Preserved */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
              <div className="flex justify-between items-start p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Incident Report</h2>
                  <p className="text-sm text-slate-500 mt-1">Standard form for reporting incidents at properties</p>
                </div>
                <button onClick={() => { setShowModal(false); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Incident Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type <span className="text-red-500">*</span></label>
                    <select name="incidentType" required value={formData.incidentType} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                      <option value="">Select type</option>
                      <option value="Injury">Injury</option>
                      <option value="Property Damage">Property Damage</option>
                      <option value="Theft">Theft</option>
                      <option value="Noise Complaint">Noise Complaint</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Severity <span className="text-red-500">*</span></label>
                    <select name="severity" required value={formData.severity} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Property */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property <span className="text-red-500">*</span></label>
                    <select name="propertyId" required value={formData.propertyId} onChange={handlePropertyChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                      <option value="">Select property</option>
                      {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                    {hotelsLoading && <div className="text-xs text-slate-400 mt-1">Loading properties...</div>}
                  </div>

                  {/* Service User */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Service User</label>
                    <select name="serviceUserId" value={formData.serviceUserId} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                      <option value="">Select service user (optional)</option>
                      {serviceUsers.map((s) => <option key={s.id} value={s.id}>{s.first_name}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                    <textarea name="description" required rows={4} value={formData.description} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Detailed description of the incident..."></textarea>
                    <div className="text-xs text-slate-400 mt-1">Include all relevant details about what happened</div>
                  </div>

                  {/* Reported By */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reported By <span className="text-red-500">*</span></label>
                    <input name="reportedBy" required value={formData.reportedBy} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Name of person reporting" />
                  </div>

                  {/* Reported Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reported Date <span className="text-red-500">*</span></label>
                    <input type="date" name="reportedDate" required value={formData.reportedDate} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                    <input name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Name of person handling incident" />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status <span className="text-red-500">*</span></label>
                    <select name="status" required value={formData.status} onChange={handleInputChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none">
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-slate-200 rounded text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-[#e77a40] text-white rounded font-medium hover:bg-[#d66a30] transition-colors">{submitting ? 'Submitting...' : 'Submit Form'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}