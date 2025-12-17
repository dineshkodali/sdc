/* eslint-disable no-unused-vars */
/* src/pages/MaintenancePage.jsx */
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import axios from "axios";

/* axios instance */
const API_BASE = import.meta.env.VITE_API_URL || axios.defaults.baseURL || "";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

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

/* SAMPLE fallback data */
const SAMPLE = [
  { id: 1, title: "Fix heating system malfunction", start: "2024-03-12", category: "Maintenance", hotel: "Building C", room: "Main Panel", raisedBy: "ABC Maintenance", status: "Completed", action: "Review", dueDate: "2024-03-12", closed: null, priority: "Medium", ref: "e5198a6e" },
  { id: 2, title: "Unblock kitchen sink", start: "2024-03-01", category: "Plumbing", hotel: "Building B", room: "Flat 301", raisedBy: "Unassigned", status: "Pending", action: "Under Repair", dueDate: "2024-03-18", closed: null, priority: "Medium", ref: "c51690eb" },
  { id: 3, title: "Repair leaking tap in bathroom", start: "2024-03-08", category: "Plumbing", hotel: "Building D", room: "Generator Room", raisedBy: "In-house Team", status: "Completed", action: "Closed", dueDate: "2024-03-10", closed: "2024-03-10", priority: "Low", ref: "cda9bd4e" },
  { id: 4, title: "Repair shower head", start: "2025-09-04", category: "Sanitary", hotel: "Parmiter", room: "Room 100", raisedBy: "Quick Fix Services", status: "Completed", action: "Pending", dueDate: "2025-09-30", closed: null, priority: "Urgent", ref: "2b9c6ef8" },
  { id: 5, title: "Repair ceiling leak", start: "2024-03-10", category: "Structural", hotel: "Building A", room: "Flat 203", raisedBy: "Unassigned", status: "Pending", action: "Pending", dueDate: "2024-03-20", closed: null, priority: "Low", ref: "f3c0c417" },
];

/* --- Helpers --- */
function formatDateISO(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString().slice(0, 10);
  } catch { return value; }
}

function getInitials(name) {
  if (!name || name === "Unassigned") return "UA";
  return name.match(/(\b\S)?/g).join("").match(/(^\S|\S$)?/g).join("").toUpperCase().slice(0, 2);
}

function getPriorityColor(p) {
  const low = String(p).toLowerCase();
  if (low === "urgent" || low === "high") return "text-red-500";
  if (low === "medium") return "text-amber-400";
  return "text-emerald-500"; 
}

function getStatusColor(s) {
  const low = String(s).toLowerCase();
  if (low === "completed") return "text-emerald-500";
  if (low === "pending" || low === "open" || low === "in progress") return "text-amber-400";
  return "text-slate-500";
}

function getAvatarColor(name) {
  const n = String(name).toLowerCase();
  if (n.includes("abc")) return "bg-amber-400";
  if (n.includes("house")) return "bg-blue-500";
  if (n.includes("quick")) return "bg-orange-500";
  return "bg-slate-300";
}

export default function MaintenancePage() {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState(false);

  const hotelsControllerRef = useRef(null);

  // Updated form state to match the new image fields
  const initialForm = useMemo(() => ({
    title: "", 
    room: "",
    start: "", 
    raisedBy: "",
    category: "", 
    status: "Open", 
    hotelId: "",
    hotelName: "", 
    action: "", 
    dueDate: "", 
    closed: "", 
    description: "",
    priority: "Medium" // Kept for backend logic/table display
  }), []);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!showCreate && !showEdit) {
      setForm(initialForm);
      setCreating(false);
      setEditing(false);
      setEditingId(null);
    }
  }, [showCreate, showEdit, initialForm]);

  /* ------------------------- Data Loading ------------------------- */
  /* Fetch hotels - ignores canceled errors */
  const fetchHotels = useCallback(async (signal) => {
    try {
      setHotelsLoading(true);
      const res = await api.get("/api/hotels", { params: { limit: 1000 }, signal });
      const normalized = normalizeHotelsResponse(res?.data ?? {});
      setHotels(normalized);
    } catch (err) {
      const isCanceled = err && (err.name === "CanceledError" || err.code === "ERR_CANCELED" || axios.isCancel?.(err));
      if (!isCanceled) {
        console.error("fetchHotels error:", err);
        setHotels([]);
      }
    } finally {
      setHotelsLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await api.get("/api/maintenance", { signal, params: { limit: 200 } });
      const data = res?.data?.data ?? res?.data ?? [];
      let mapped = Array.isArray(data) ? data : [];
      
      const formattedTasks = mapped.map((t) => ({
        id: t.id,
        title: t.title ?? t.name ?? "",
        start: formatDateISO(t.start_date || t.start),
        category: t.category || "Maintenance",
        hotel: t.site || t.hotel_name || "",
        room: t.room || "",
        raisedBy: t.raised_by || "Unassigned",
        status: t.status || "Open",
        action: t.action || "",
        dueDate: formatDateISO(t.due_date),
        closed: formatDateISO(t.closed_date),
        priority: t.priority || "Medium",
        ref: t.ref || `MNT-2025-${String(t.id).slice(0,4)}`,
        description: t.description || "",
        raw: t,
      }));
      setTasks(formattedTasks);
      setLoading(false);
    } catch (err) {
      if (err.name === "AbortError") return;
      setTasks(SAMPLE);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    hotelsControllerRef.current = ac;
    fetchHotels(ac.signal);
    loadTasks(ac.signal);
    return () => {
      // eslint-disable-next-line no-empty
      try { ac.abort(); } catch {}
      hotelsControllerRef.current = null;
    };
  }, [fetchHotels, loadTasks]);

  /* ------------------------- Logic ------------------------- */
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const list = tasks || [];
    if (!q) return list;
    return list.filter((r) => 
      r.title.toLowerCase().includes(q) || 
      r.hotel.toLowerCase().includes(q) || 
      r.status.toLowerCase().includes(q)
    );
  }, [tasks, query]);

  const stats = useMemo(() => {
    const list = tasks || SAMPLE;
    const total = list.length;
    const pending = list.filter(t => ["pending", "open", "in progress", "under review"].includes(t.status.toLowerCase())).length;
    const inProgress = list.filter(t => ["in progress", "under review"].includes(t.status.toLowerCase())).length;
    const completed = list.filter(t => t.status.toLowerCase() === "completed").length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  /* ------------------------- Handlers ------------------------- */
  async function handleDelete(id) {
    if (!confirm("Delete this order?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setCreating(true);
    // Simulate API delay
    setTimeout(() => {
      const newTask = { 
        ...form, 
        id: Math.random(), 
        ref: "MNT-NEW", 
        priority: "Medium" // default logic
      };
      setTasks([newTask, ...(tasks || [])]);
      setCreating(false);
      setShowCreate(false);
    }, 500);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditing(true);
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
      setEditing(false);
      setShowEdit(false);
    }, 500);
  }

  function openEdit(task) {
    setEditingId(task.id);
    // When editing, try to find the hotel id from the hotel name
    const hotelRecord = hotels.find((h) => h.name === task.hotel || String(h.id) === String(task.hotel)) || null;
    const hotelId = hotelRecord?.id ?? (typeof task.hotel === 'number' ? task.hotel : '');
    const hotelName = hotelRecord?.name ?? task.hotel ?? '';
    setForm({ 
      ...task,
      hotelId: hotelId,
      hotelName: hotelName
    });
    setShowEdit(true);
  }

  function handleFormChange(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  /* Handle hotel selection - similar to handlePropertyChange in Incidents.jsx */
  function handleHotelChange(e) {
    const hotelId = e.target.value;
    const hotel = hotels.find((h) => String(h.id) === String(hotelId)) || null;
    setForm((p) => ({ ...p, hotelId: hotelId, hotelName: hotel ? hotel.name : '' }));
  }

  /* ------------------------- UI RENDERER ------------------------- */
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700">
      
      {/* Header */}
      <div className="bg-white px-8 pt-6 pb-2">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Maintenance</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <IconHome size={14} /> <span>/</span> <span>Operations Hub</span> <span>/</span> <span className="text-slate-800 font-medium">Maintenance</span>
              </div>
            </div>
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Create Work Order
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard title="Total Orders" count={stats.total} color="blue" />
            <KPICard title="Pending" count={stats.pending} color="orange" />
            <KPICard title="Inprogress" count={stats.inProgress} color="purple" />
            <KPICard title="Completed" count={stats.completed} color="green" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-12">
        <div className="max-w-[1400px] mx-auto bg-white rounded-lg shadow-sm border border-slate-200">
          
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">All Work Orders</h2>
              <div className="text-slate-400 text-sm">{stats.total} total records</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Filter work orders..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm w-64 focus:outline-none focus:border-slate-400"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50">
                <IconList size={16} /> View
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50">
                <IconFilter size={16} /> Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50">
                <IconColumns size={16} /> Columns
              </button>
              <button onClick={() => setShowCreate(true)} className="bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2">
                <IconUpload size={16} /> Create Work Order
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex gap-3 bg-white">
             <FilterDropdown label="All Priority" />
             <FilterDropdown label="All Status" />
             <FilterDropdown label="All Properties" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-5 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-5">Type <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5">Reference <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5 w-1/3">Description <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5">Priority <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5">Status <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5">Assigned To <IconChevronDown size={12} className="inline ml-1"/></th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.length > 0 ? filtered.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 group transition-colors">
                    <td className="p-5 align-top pt-6">
                      <input type="checkbox" className="rounded border-slate-300 accent-orange-500" />
                    </td>
                    <td className="p-5 align-top pt-6">
                      <span className="bg-orange-50 text-orange-400 border border-orange-100 px-3 py-1 rounded-full text-xs font-semibold">{row.category}</span>
                    </td>
                    <td className="p-5 align-top pt-5">
                      <div className="font-bold text-slate-700 text-base">MNT-2025-</div>
                      <div className="text-slate-400 text-xs mt-0.5">{row.ref}</div>
                    </td>
                    <td className="p-5 align-top pt-5">
                      <div className="font-bold text-slate-700 text-base cursor-pointer hover:text-[#f97316] transition-colors" onClick={() => openEdit(row)}>{row.title}</div>
                      <div className="text-slate-400 text-xs mt-1">Maintenance work required as per inspection report.</div>
                    </td>
                    <td className="p-5 align-top pt-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl leading-none ${getPriorityColor(row.priority)}`}>•</span>
                        <span className={`${getPriorityColor(row.priority)} font-medium`}>{row.priority}</span>
                      </div>
                    </td>
                    <td className="p-5 align-top pt-6">
                       <div className="flex items-center gap-2">
                        <span className={`text-xl leading-none ${getStatusColor(row.status)}`}>•</span>
                        <span className={`${getStatusColor(row.status)} font-medium`}>{row.status === "Open" ? "Pending" : row.status}</span>
                      </div>
                    </td>
                    <td className="p-5 align-top pt-5">
                       <div className="flex items-center gap-3">
                         {row.raisedBy === "Unassigned" ? (
                           <span className="text-slate-400 italic">Unassigned</span>
                         ) : (
                           <>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(row.raisedBy)}`}>{getInitials(row.raisedBy)}</div>
                             <span className="text-slate-600 font-medium">{row.raisedBy}</span>
                           </>
                         )}
                       </div>
                    </td>
                    <td className="p-5 align-top pt-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => openEdit(row)} className="p-2 text-slate-400 hover:text-[#f97316] hover:bg-orange-50 rounded transition-colors" title="Edit">
                           <IconEdit size={18} />
                         </button>
                         <button onClick={() => handleDelete(row.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                           <IconTrash size={18} />
                         </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-400">No work orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
             <div>Page 1 of 1</div>
             <div>Showing {filtered.length} records</div>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL SECTION ----------------- */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {showEdit ? "Edit Maintenance Task" : "Create Maintenance Task"}
              </h3>
              <button 
                onClick={() => { setShowCreate(false); setShowEdit(false); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={showEdit ? handleEditSubmit : handleCreateSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                {/* Row 1: Title & Room */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={form.title} 
                    onChange={e => handleFormChange("title", e.target.value)} 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Room No</label>
                  <input 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={form.room} 
                    onChange={e => handleFormChange("room", e.target.value)} 
                  />
                </div>

                {/* Row 2: Start Date & Raised By */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                  <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={formatDateISO(form.start)} 
                    onChange={e => handleFormChange("start", e.target.value)} 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Raised By</label>
                  <input 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={form.raisedBy} 
                    onChange={e => handleFormChange("raisedBy", e.target.value)} 
                  />
                </div>

                {/* Row 3: Category & Status */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <input 
                    placeholder="e.g., CAT1"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={form.category} 
                    onChange={e => handleFormChange("category", e.target.value)} 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] bg-white" 
                    value={form.status} 
                    onChange={e => handleFormChange("status", e.target.value)}
                  >
                    <option>Open</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                {/* Row 4: Hotel Name & Action */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Property</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] bg-white" 
                    value={form.hotelId} 
                    onChange={handleHotelChange}
                  >
                    <option value="">-- Select hotel --</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  {hotelsLoading && <div className="text-xs text-slate-400 mt-1">Loading hotels...</div>}
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Action</label>
                  <input 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={form.action} 
                    onChange={e => handleFormChange("action", e.target.value)} 
                  />
                </div>

                {/* Row 5: Due Date (Full Width) */}
                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                   <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={formatDateISO(form.dueDate)} 
                    onChange={e => handleFormChange("dueDate", e.target.value)} 
                  />
                </div>

                {/* Row 6: Closed Date (Full Width) */}
                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-slate-600 mb-1">Closed Date (if any)</label>
                   <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]" 
                    value={formatDateISO(form.closed)} 
                    onChange={e => handleFormChange("closed", e.target.value)} 
                  />
                </div>

                {/* Row 7: Description (Full Width) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Description (optional)</label>
                  <textarea 
                    rows={4}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] resize-y" 
                    value={form.description} 
                    onChange={e => handleFormChange("description", e.target.value)} 
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCreate(false); setShowEdit(false); }} 
                  className="px-5 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#f97316] text-white rounded hover:bg-[#ea580c] font-medium shadow-sm transition-colors"
                >
                  {creating || editing ? "Saving..." : (showEdit ? "Update Task" : "Create Task")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Sub-Components & Icons --- */
function KPICard({ title, count, color }) {
  const styles = {
    blue: { bg: "bg-blue-500" },
    orange: { bg: "bg-[#f97316]" },
    purple: { bg: "bg-purple-600" },
    green: { bg: "bg-emerald-500" },
  };
  const theme = styles[color] || styles.blue;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 min-h-[100px]">
      <div className={`w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center text-white shrink-0`}>
        <IconWrench size={20} />
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-800 leading-tight">{count}</div>
        <div className="text-slate-500 text-sm font-medium">{title}</div>
      </div>
    </div>
  );
}

function FilterDropdown({ label }) {
  return (
    <button className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-100 w-36">
      {label} <IconChevronDown size={14} className="text-slate-400" />
    </button>
  );
}

/* Icons */
const IconHome = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconSearch = ({ size, className }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconWrench = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
const IconChevronDown = ({ size, className }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconList = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const IconFilter = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconColumns = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path></svg>;
const IconUpload = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const IconTrash = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconEdit = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconX = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;