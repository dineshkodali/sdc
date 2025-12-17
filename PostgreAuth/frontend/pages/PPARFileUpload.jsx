/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || axios.defaults.baseURL || "";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

// --- Helpers for Formatting ---
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function getPriorityColor(p) {
  const low = String(p).toLowerCase();
  if (low === "urgent" || low === "high" || low === "critical")
    return "text-red-500";
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
  return name
    .match(/(\b\S)?/g)
    .join("")
    .match(/(^\S|\S$)?/g)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function normalizeHotelsResponse(data) {
  if (!data) return [];
  let items = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data.data)) items = data.data;
  else if (Array.isArray(data.rows)) items = data.rows;
  else if (Array.isArray(data.hotels)) items = data.hotels;
  else if (typeof data === "object") {
    const vals = Object.values(data);
    const possibleObjects = vals.filter(
      (v) => v && (v.id || v.name || v.hotel_name)
    );
    if (possibleObjects.length && !Array.isArray(data)) {
      items = Array.isArray(possibleObjects[0])
        ? possibleObjects[0]
        : possibleObjects;
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

export default function PPARFileUpload() {
  // Empty initial data — user will provide new data
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  //   const stats = [
  //     { label: 'Total Tasks', value: rows.length, color: 'bg-blue-500', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
  //     { label: 'Open', value: rows.filter((r) => (r.status || '').toLowerCase() === 'open').length, color: 'bg-[#f97316]', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
  //     { label: 'In Progress', value: rows.filter((r) => (r.status || '').toLowerCase() === 'in progress').length, color: 'bg-purple-600', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
  //     { label: 'Resolved', value: rows.filter((r) => (r.status || '').toLowerCase() === 'resolved' || (r.status || '').toLowerCase() === 'completed').length, color: 'bg-emerald-500', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
  //   ];

  const [hotels, setHotels] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const hotelsControllerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    incidentType: "",
    severity: "Medium",
    propertyId: "",
    propertyName: "",
    serviceUserId: "",
    description: "",
    reportedBy: "",
    reportedDate: "",
    assignedTo: "",
    status: "Open",
  });

  useEffect(() => {
    const ctrl = new AbortController();
    hotelsControllerRef.current = ctrl;
    fetchHotels(ctrl.signal);
    fetchIncidents();
    return () => {
      try {
        ctrl.abort();
      } catch {}
      hotelsControllerRef.current = null;
    };
  }, []);

  async function fetchIncidents() {
    try {
      const res = await api.get("/api/incidents", { params: { limit: 200 } });
      const data = res?.data?.data ?? res?.data ?? [];
      if (!Array.isArray(data)) return setRows([]);
      const mapped = data.map((created) => ({
        ref: created.reference ?? created.ref ?? String(created.id ?? ""),
        title: created.type ?? created.title ?? created.reference ?? "",
        desc: created.description ?? created.desc ?? "",
        priority: created.severity ?? created.priority ?? "Medium",
        status: created.status ?? "Open",
        assigned: created.assigned_to ?? created.assigned ?? "",
        date:
          created.reported_date ??
          created.created_at ??
          created.reportedDate ??
          null,
        propertyName: created.property_name ?? created.propertyName ?? null,
        serviceUserId: created.service_user_id ?? created.serviceUserId ?? null,
        raw: created,
      }));
      setRows(mapped);
    } catch (err) {
      console.error("fetchIncidents error", err);
      setRows([]);
    }
  }

  async function fetchHotels(signal) {
    try {
      setHotelsLoading(true);
      const res = await api.get("/api/hotels", {
        params: { limit: 1000 },
        signal,
      });
      const normalized = normalizeHotelsResponse(res?.data ?? {});
      setHotels(normalized);
      if (normalized.length === 1 && !formData.propertyId) {
        setFormData((f) => ({ ...f, propertyId: normalized[0].id }));
        fetchServiceUsers(normalized[0].id);
      }
    } catch (err) {
      const isCanceled =
        err &&
        (err.name === "CanceledError" ||
          err.code === "ERR_CANCELED" ||
          axios.isCancel?.(err));
      if (!isCanceled) {
        console.error("fetchHotels error:", err);
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
      const normalized = (Array.isArray(rows) ? rows : [])
        .map((r) => ({
          id: r.id,
          first_name: r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ""}`,
        }))
        .filter(Boolean);
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
        const normalized = (Array.isArray(rows) ? rows : [])
          .map((r) => ({
            id: r.id,
            first_name:
              r.first_name ?? r.firstName ?? r.first ?? `${r.id ?? ""}`,
          }))
          .filter(Boolean);
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
      console.error("handleEdit fetch error", err);
    }
    if (!record) {
      window.alert("Unable to load incident for editing");
      return;
    }
    // Map record to formData
    setFormData({
      incidentType: record.type ?? record.incidentType ?? "",
      severity: record.severity ?? "Medium",
      propertyId: record.property_id ?? record.propertyId ?? "",
      serviceUserId: record.service_user_id ?? record.serviceUserId ?? "",
      description: record.description ?? "",
      reportedBy: record.reported_by ?? record.reportedBy ?? "",
      reportedDate: record.reported_date
        ? String(record.reported_date).substring(0, 10)
        : "",
      assignedTo: record.assigned_to ?? record.assignedTo ?? "",
      status: record.status ?? "Open",
    });
    if (record.property_id || record.propertyId)
      fetchServiceUsers(record.property_id ?? record.propertyId);
    // ensure we store numeric id for editing (backend expects id param)
    setEditingId(record.id ?? null);
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    const id = row.raw?.id ?? null;
    if (!id) {
      // try to locate by reference
      window.alert("Unable to determine incident id to delete");
      return;
    }
    const ok = window.confirm(
      "Delete this incident? This action cannot be undone."
    );
    if (!ok) return;
    try {
      await api.delete(`/api/incidents/${id}`);
      setRows((prev) => prev.filter((r) => String(r.raw?.id) !== String(id)));
    } catch (err) {
      console.error("delete incident error", err);
      window.alert("Unable to delete incident. See console for details.");
    }
  };

  function handleInputChange(e) {
    const { name, type, value, checked } = e.target;
    if (type === "checkbox") {
      setFormData((p) => ({ ...p, [name]: checked }));
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
  }

  function handlePropertyChange(e) {
    const hotelId = e.target.value;
    const hotel = hotels.find((h) => String(h.id) === String(hotelId)) || null;
    setFormData((p) => ({
      ...p,
      propertyId: hotelId,
      propertyName: hotel ? hotel.name : "",
      serviceUserId: "",
    }));
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
        res = await api.post("/api/incidents", payload);
      }
      console.log("Incident saved", res?.data);
      // refresh list from server to ensure DB is authoritative
      await fetchIncidents();
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      console.error("create incident error", err);
      // Fallback for demo if API fails
      const fallbackRow = {
        ref: `INC-2025-${Math.floor(Math.random() * 10000)}`,
        title: formData.incidentType || "Incident",
        desc: formData.description,
        priority: formData.severity,
        status: formData.status,
        assigned: formData.assignedTo || "Unassigned",
        date: formData.reportedDate || new Date().toISOString(),
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
      <div className="max-w-[1200px] mx-auto">
     

        <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">PPAR File Upload</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <IconHome size={14} /> <span>/</span> <span>SU Data</span> <span>/</span> <span className="text-slate-800 font-medium">PPAR File Upload</span>
              </div>
            </div>
            {/* <button 
              onClick={() => setShowCreate(true)}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Create Work Order
            </button> */}
          </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          {/* Title */}
          <h2 className="text-lg font-bold text-slate-800">Upload PPAR File</h2>
          <p className="text-sm text-slate-500 mt-1">
            Select a property and upload an Excel or CSV file containing room
            and bedspace data
          </p>

          {/* Property */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Property
            </label>
            <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
              <option>Victoria Suites</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PPAR File
            </label>

            <div className="flex items-center gap-3 border border-slate-300 rounded-md px-3 py-2">
              <input
                type="file"
                className="text-sm text-slate-600 file:mr-4 file:py-1.5 file:px-4
                         file:rounded file:border-0
                         file:text-sm file:font-medium
                         file:bg-slate-100 file:text-slate-700
                         hover:file:bg-slate-200"
              />
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Accepted formats: .xlsx, .xls, .csv
            </p>
          </div>

          {/* Upload Button */}
          <button
            className="mt-6 w-full bg-[#f97316] hover:bg-[#ea580c]
                     text-white font-medium py-3 rounded-md
                     flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload and Process
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-800">
            File Format Requirements
          </h3>

          {/* Subtitle */}
          <p className="text-sm text-slate-500 mt-2">
            Your PPAR file should include the following columns
            (case-insensitive):
          </p>

          {/* Requirements List */}
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-700">
                Floor or Floor Number:
              </span>{" "}
              Numeric floor number
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Room or Room Number:
              </span>{" "}
              Room identifier (e.g., “101”, “A1”)
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Room Type or Type:
              </span>{" "}
              single, shared, dormitory, or family
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Beds or Bedspaces:
              </span>{" "}
              Total number of beds in the room
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Kitchen (optional):
              </span>{" "}
              Yes/No or True/False
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Bathroom (optional):
              </span>{" "}
              Yes/No or True/False
            </li>

            <li>
              <span className="font-semibold text-slate-700">
                Size (optional):
              </span>{" "}
              Room size in square meters
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


const IconHome = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;