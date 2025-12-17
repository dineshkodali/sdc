/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

/* helper for normalizing hotels responses */
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

export default function AIRETasks() {
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // State to track if we are in "View Only" mode
  const [isViewing, setIsViewing] = useState(false);
  
  // Filter States
  const [selectedPriority, setSelectedPriority] = useState('All Priority');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedProperty, setSelectedProperty] = useState('All Properties');
  const [filterProperties, setFilterProperties] = useState([]);

  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
    timeout: 15000
  }), []);

  // Load AIRE tasks
  useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      setLoading(true);
      try {
        const res = await api.get('/api/aire-tasks', { params: { limit: 500 } }).catch(() => ({ data: [] }));
        const list = res?.data?.rows ?? res?.data?.data ?? res?.data ?? [];
        
        if (!mounted) return;

        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((t, idx) => ({
            id: t.id ?? idx,
            type: 'AIRE Tasks',
            reference: t.reference ?? t.ticket_no ?? `AIRE-2025-${Math.random().toString(36).substr(2, 8)}`,
            
            // FIX: Keep Title and Description distinct
            title: t.title || '', 
            description: t.description || t.title || 'No description', 
            
            priority: t.priority ?? 'Medium',
            status: t.status ?? 'Pending',
            assignedTo: t.assigned_to_name ?? t.assignedToName ?? (t.assignee_id ? `User ${t.assignee_id}` : 'Unassigned'),
            assignedToId: t.assigned_to_id,
            date: t.scheduled_date ? new Date(t.scheduled_date).toLocaleDateString() : (t.created_at ? new Date(t.created_at).toLocaleDateString() : new Date().toLocaleDateString()),
            
            // Store additional details for View Mode
            category: t.category,
            reportedBy: t.reported_by || t.reportedBy,
            propertyId: t.property_id || t.propertyId,
            propertyName: t.property_name || t.propertyName,
            serviceUserId: t.service_user_id,
            rawDate: t.scheduled_date
          }));
          setTasks(normalized);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.warn('Failed to load AIRE tasks:', err?.message || err);
        setTasks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTasks();
    
    // Load properties for filter dropdown
    async function loadProperties() {
      try {
        const res = await api.get('/api/hotels', { params: { limit: 1000 } }).catch(() => ({ data: [] }));
        const normalized = normalizeHotelsResponse(res?.data ?? {});
        if (mounted) {
          setFilterProperties(normalized);
        }
      } catch (err) {
        console.warn('Failed to load properties for filter:', err?.message || err);
      }
    }
    loadProperties();
    
    return () => { mounted = false; };
  }, [api]);

  // Handle New Task Creation
  const handleCreateTask = (newTask) => {
    (async () => {
      setModalError(null);
      setModalSubmitting(true);
      try {
        const payload = {
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority || 'Medium',
          status: 'Pending',
          assigned_to_id: null,
          assigned_to_name: newTask.assignedTo || null,
          service_user_id: newTask.serviceUserId || null,
          property_id: newTask.property || null,
          property_name: newTask.propertyName || null,
          scheduled_date: newTask.scheduledDate || null,
          category: newTask.category || 'AIRE',
          reported_by: newTask.reportedBy || null
        };
        const res = await api.post('/api/aire-tasks', payload);
        const created = res?.data ?? null;
        if (created) {
          const normalized = {
            id: created.id,
            type: 'AIRE Tasks',
            reference: created.reference ?? `AIRE-2025-${Math.random().toString(36).substr(2, 8)}`,
            title: created.title,
            description: created.description ?? created.title ?? 'No description',
            priority: created.priority ?? 'Medium',
            status: created.status ?? 'Pending',
            assignedTo: created.assigned_to_name ?? created.assignedToName ?? 'Unassigned',
            date: created.scheduled_date ? new Date(created.scheduled_date).toLocaleDateString() : new Date().toLocaleDateString(),
            
            category: created.category,
            reportedBy: created.reported_by,
            propertyId: created.property_id,
            propertyName: created.property_name,
            serviceUserId: created.service_user_id,
            rawDate: created.scheduled_date
          };
          setTasks(prev => [normalized, ...prev]);
          setShowModal(false);
          setModalSubmitting(false);
        } else {
          throw new Error('No response from server');
        }
      } catch (err) {
        console.error('Failed to create AIRE task:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to create task';
        setModalError(errMsg);
        setModalSubmitting(false);
      }
    })();
  };

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const overdue = tasks.filter(t => t.status === 'Overdue').length;
    const dueThisWeek = tasks.filter(t => t.status === 'Due This Week').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return { total, overdue, dueThisWeek, completed };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedPriority !== 'All Priority' && t.priority !== selectedPriority) return false;
      if (selectedStatus !== 'All Status' && t.status !== selectedStatus) return false;
      if (selectedProperty !== 'All Properties' && t.propertyName !== selectedProperty) return false;
      return true;
    });
  }, [tasks, selectedPriority, selectedStatus, selectedProperty]);

  // Icons
  const IconAlertTriangle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  );
  const IconClock = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  );
  const IconCheckCircle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  );
  const IconEye = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  );
  const IconEdit = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  );
  const IconTrash = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  );

  // Handle View/Edit/Delete Actions
  function handleView(task) {
    setEditingTask(task);
    setIsViewing(true); // Enable View Mode
    setModalError(null);
    setShowModal(true);
  }

  function handleEdit(task) {
    setEditingTask(task);
    setIsViewing(false); // Enable Edit Mode
    setModalError(null);
    setShowModal(true);
  }

  async function handleDelete(task) {
    const ok = window.confirm(`Delete task ${task.reference}? This action cannot be undone.`);
    if (!ok) return;
    try {
      setTasks(prev => prev.filter(t => String(t.id) !== String(task.id)));
      await api.delete(`/api/aire-tasks/${encodeURIComponent(task.id)}`).catch(() => null);
    } catch (err) {
      console.warn('Failed to delete task', err?.message || err);
      alert('Failed to delete task.');
    }
  }

  // Update existing AIRE task
  const handleUpdateTask = (updatedTask, id) => {
    (async () => {
      setModalError(null);
      setModalSubmitting(true);
      try {
        const payload = {
          title: updatedTask.title,
          description: updatedTask.description || null,
          priority: updatedTask.priority || 'Medium',
          assigned_to_name: updatedTask.assignedTo || null,
          service_user_id: updatedTask.serviceUserId || null,
          property_id: updatedTask.property || null,
          property_name: updatedTask.propertyName || null,
          scheduled_date: updatedTask.scheduledDate || null,
          category: updatedTask.category || 'AIRE',
          reported_by: updatedTask.reportedBy || null
        };
        const res = await api.patch(`/api/aire-tasks/${encodeURIComponent(id)}`, payload);
        const updated = res?.data ?? null;
        if (updated) {
          const normalized = {
            id: updated.id,
            type: 'AIRE Tasks',
            reference: updated.reference ?? updated.ticket_no ?? `AIRE-2025-${Math.random().toString(36).substr(2, 8)}`,
            title: updated.title,
            description: updated.description ?? updated.title ?? 'No description',
            priority: updated.priority ?? 'Medium',
            status: updated.status ?? 'Pending',
            assignedTo: updated.assigned_to_name ?? updated.assignedToName ?? 'Unassigned',
            date: updated.scheduled_date ? new Date(updated.scheduled_date).toLocaleDateString() : new Date().toLocaleDateString(),
            
            category: updated.category,
            reportedBy: updated.reported_by,
            propertyId: updated.property_id,
            propertyName: updated.property_name,
            serviceUserId: updated.service_user_id,
            rawDate: updated.scheduled_date
          };
          setTasks(prev => prev.map(t => String(t.id) === String(id) ? normalized : t));
          setShowModal(false);
          setEditingTask(null);
          setModalSubmitting(false);
        } else {
          throw new Error('No response from server');
        }
      } catch (err) {
        console.error('Failed to update AIRE task:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to update task';
        setModalError(errMsg);
        setModalSubmitting(false);
      }
    })();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-slate-700">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">AIRE Tasks</h1>
            <div className="text-sm text-slate-400 mt-1">/ Operations Hub / AIRE Tasks</div>
          </div>
          <button 
            onClick={() => { setEditingTask(null); setIsViewing(false); setShowModal(true); }}
            className="bg-[#e77a40] text-white px-6 py-2 rounded-lg shadow-sm hover:bg-[#d66a30] transition-colors font-semibold"
          >
            + Add Task
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><square x="3" y="3" width="18" height="18" rx="2" ry="2"></square><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase">Total Tasks</div>
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            </div>
          </div>
           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <IconAlertTriangle />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase">Overdue</div>
              <div className="text-2xl font-bold text-slate-800">{stats.overdue}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <IconClock />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase">Due This Week</div>
              <div className="text-2xl font-bold text-slate-800">{stats.dueThisWeek}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <IconCheckCircle />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase">Completed</div>
              <div className="text-2xl font-bold text-slate-800">{stats.completed}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-slate-100 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
          <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option>All Priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option>All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Overdue</option>
          </select>
          <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option>All Properties</option>
            {filterProperties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">All Work Orders</h3>
            <p className="text-sm text-slate-400 mb-4">{filteredTasks.length} total records</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 bg-slate-50 border-b">
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold">Priority</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Assigned To</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                     <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading tasks...</td></tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-24 text-center flex flex-col items-center justify-center text-slate-400 w-full">
                        <div className="mb-2">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div>No tasks found. Click "Add Task" to create one.</div>
                    </td></tr>
                  ) : filteredTasks.map(task => (
                    <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">{task.type}</span>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700">{task.reference}</td>
                      <td className="px-6 py-3 text-slate-600 max-w-xs truncate">{task.description}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'Urgent' && '●'} {task.priority === 'High' && '●'} {task.priority === 'Medium' && '●'} {task.priority === 'Low' && '●'} {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {task.assignedTo.charAt(0)}
                          </div>
                          <span className="text-slate-600">{task.assignedTo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{task.date}</td>
                       <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                         <button title="View Details" onClick={() => handleView(task)} className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
                           <IconEye />
                         </button>
                         <button title="Edit" onClick={() => handleEdit(task)} className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
                           <IconEdit />
                         </button>
                         <button title="Delete" onClick={() => handleDelete(task)} className="p-2 rounded-md hover:bg-slate-100 text-rose-600 transition-colors">
                           <IconTrash />
                         </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD/VIEW TASK MODAL --- */}
      {showModal && (
        <AddTaskModal 
            api={api}
            editingTask={editingTask}
            readOnly={isViewing} 
            error={modalError}
            submitting={modalSubmitting}
            onClose={() => { setShowModal(false); setModalError(null); setEditingTask(null); setIsViewing(false); }} 
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask} 
        />
      )}
    </div>
  );
}

// Modal Component
function AddTaskModal({ api, editingTask, readOnly, error, submitting, onClose, onSubmit }) {
    const [form, setForm] = useState({
      title: '',
      description: '',
      property: '', 
      propertyName: '',
      category: '',
      priority: 'Medium',
      reportedBy: '',
      assignedTo: '',
      assignedToId: '',
      serviceUserId: '',
      scheduledDate: '',
      status: 'Pending'
    });

    const [hotels, setHotels] = useState([]);
    const [serviceUsers, setServiceUsers] = useState([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const hotelsControllerRef = React.useRef(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Prefill when editingTask changes
    React.useEffect(() => {
      if (!editingTask) return;
      setForm((f) => ({
        ...f,
        // FIX: Ensure title doesn't accidentally grab description
        title: editingTask.title || '', 
        description: editingTask.description || '',
        property: editingTask.propertyId ?? editingTask.property_id ?? editingTask.property ?? f.property,
        propertyName: editingTask.propertyName ?? editingTask.property_name ?? f.propertyName,
        category: editingTask.category ?? f.category,
        priority: editingTask.priority ?? f.priority,
        reportedBy: editingTask.reportedBy ?? editingTask.reported_by ?? f.reportedBy,
        assignedTo: editingTask.assignedTo ?? editingTask.assigned_to_name ?? f.assignedTo,
        assignedToId: editingTask.assignedToId ?? editingTask.assigned_to_id ?? f.assignedToId,
        serviceUserId: editingTask.serviceUserId ?? editingTask.service_user_id ?? f.serviceUserId,
        scheduledDate: editingTask.rawDate ? ('' + editingTask.rawDate).substring(0,10) : f.scheduledDate,
        status: editingTask.status ?? 'Pending'
      }));
      
      if (editingTask.propertyId || editingTask.property_id) {
        fetchServiceUsers(editingTask.propertyId ?? editingTask.property_id);
      }
    }, [editingTask]);

    async function fetchHotels(signal) {
      try {
        setHotelsLoading(true);
        const res = await api.get('/api/hotels', { params: { limit: 1000 }, signal });
        const normalized = normalizeHotelsResponse(res?.data ?? {});
        setHotels(normalized);
        if (normalized.length === 1 && !form.property) {
          setForm((f) => ({ ...f, property: normalized[0].id, propertyName: normalized[0].name }));
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
      if (!hotelId) { setServiceUsers([]); return; }
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
      } catch (err) { /* ignore */ }
      setServiceUsers([]);
    }

    function handlePropertyChange(e) {
      const hotelId = e.target.value;
      const hotel = hotels.find((h) => String(h.id) === String(hotelId)) || null;
      setForm((prev) => ({ ...prev, property: hotelId, propertyName: hotel ? hotel.name : '', assignedTo: '' }));
      setServiceUsers([]);
      if (hotelId) fetchServiceUsers(hotelId);
    }

    function handleServiceUserChange(e) {
      const suId = e.target.value;
      const su = serviceUsers.find((s) => String(s.id) === String(suId)) || null;
      setForm((prev) => ({ ...prev, assignedTo: su ? `${su.first_name}` : '', assignedToId: su ? String(su.id) : '', serviceUserId: su ? String(su.id) : '' }));
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      if (submitting) return; 
      onSubmit(form, editingTask ? editingTask.id : undefined);
    };

    React.useEffect(() => {
      const ctrl = new AbortController();
      hotelsControllerRef.current = ctrl;
      fetchHotels(ctrl.signal);
      return () => { try { ctrl.abort(); } catch {} ; hotelsControllerRef.current = null; };
    }, []);

    // --- VIEW ONLY RENDER ---
    if (readOnly) {
        const DetailItem = ({ label, value }) => (
            <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</div>
                <div className="text-slate-800 font-medium text-sm">{value || '-'}</div>
            </div>
        );

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                     {/* Header */}
                     <div className="flex justify-between items-center p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">Task Details</h2>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                                form.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                form.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                                form.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                            }`}>
                                {form.status}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* View Body */}
                    <div className="p-8 space-y-8 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                             <DetailItem label="Title" value={form.title} />
                             <DetailItem label="Property" value={form.propertyName} />
                             
                             <DetailItem label="Scheduled Date" value={form.scheduledDate ? new Date(form.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                             <DetailItem label="Category" value={form.category} />
                             
                             <DetailItem label="Priority" value={form.priority} />
                             <DetailItem label="Reported By" value={form.reportedBy} />

                             <DetailItem label="Assigned To" value={form.assignedTo} />
                        </div>

                        {/* Description Box */}
                        <div>
                             <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">Additional Notes / Description</div>
                             <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-600 border border-slate-100 min-h-[60px]">
                                {form.description || <span className="italic text-slate-400">No description provided</span>}
                             </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
                        <button onClick={onClose} className="px-5 py-2 border border-slate-200 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- CREATE/EDIT RENDER ---
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                        <p className="text-sm text-slate-500 mt-1">Standard form for reporting tasks</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <form id="aire-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                            <input 
                                type="text" name="title" value={form.title} onChange={handleChange}
                                placeholder="Brief description of task" 
                                className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                                required
                            />
                        </div>
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                            <textarea 
                                name="description" value={form.description} onChange={handleChange}
                                rows={3} placeholder="Detailed description of the maintenance issue..." 
                                className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            {/* Property */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property <span className="text-red-500">*</span></label>
                                <select name="property" value={form.property} onChange={handlePropertyChange} className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none bg-white text-slate-600" required>
                                    <option value="">Select property</option>
                                    {hotelsLoading ? <option value="">Loading...</option> : hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                                <select name="category" value={form.category} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none bg-white text-slate-600" required>
                                    <option value="">Select category</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Inspection">Inspection</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority <span className="text-red-500">*</span></label>
                                <select name="priority" value={form.priority} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none bg-white text-slate-600">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            {/* Reported By */}
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reported By <span className="text-red-500">*</span></label>
                              <input type="text" name="reportedBy" value={form.reportedBy} onChange={handleChange} placeholder="Name of person" className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
                                {serviceUsers && serviceUsers.length > 0 ? (
                                  <select name="assignedTo" value={form.serviceUserId || ''} onChange={handleServiceUserChange} className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none bg-white text-slate-600">
                                    <option value="">Select assignee</option>
                                    {serviceUsers.map(s => <option key={s.id} value={s.id}>{s.first_name}</option>)}
                                  </select>
                                ) : (
                                  <input type="text" name="assignedTo" value={form.assignedTo} onChange={(e) => setForm((p)=>({...p, assignedTo: e.target.value, assignedToId: '', serviceUserId: ''}))} placeholder="Name" className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
                                )}
                            </div>
                            {/* Scheduled Date */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Scheduled Date</label>
                                <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-slate-600" />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} disabled={submitting} className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" form="aire-form" disabled={submitting} className="px-5 py-2.5 bg-[#e77a40] text-white font-medium rounded shadow-sm hover:bg-[#d66a30] transition-colors">{submitting ? 'Submitting...' : (editingTask ? 'Update' : 'Submit Form')}</button>
                </div>
            </div>
        </div>
    );
}