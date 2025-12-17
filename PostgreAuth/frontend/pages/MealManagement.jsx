import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function MealManagement() {
  
  const [properties, setProperties] = useState([]);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [selectedProperty, setSelectedProperty] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  
  // NEW STATE: For the View Modal
  const [viewingMeal, setViewingMeal] = useState(null);

  // Prevent infinite re-renders
  const api = useMemo(() => axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || '', 
    withCredentials: true, 
    timeout: 15000 
  }), []);

  // Icons
  const IconEdit = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  );
  const IconTrash = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  );
  const IconEye = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  );

  // Fetch Data
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const pRes = await api.get('/api/hotels', { params: { limit: 500 } }).catch(() => ({ data: [] }));
        const suRes = await api.get('/api/su', { params: { limit: 500 } }).catch(() => ({ data: [] }));
        
        const mealEndpoints = ['/api/meals', '/api/su/meals', '/api/meal-schedules', '/api/meals/scheduled'];
        let ms = [];

        // First try: request meals filtered by the currently selected date.
        for (let ep of mealEndpoints) {
          try {
            const r = await api.get(ep, { params: { date } });
            const cand = (r?.data?.rows ?? r?.data?.data ?? r?.data) || [];
            if (Array.isArray(cand) && cand.length > 0) { ms = cand; break; }
          } catch {
            // try next
          }
        }

        // If no meals found for the selected date, fall back to fetching without a date filter
        // so the UI can display existing rows in the DB (useful when no meals are scheduled today).
        if ((!Array.isArray(ms) || ms.length === 0)) {
          for (let ep of mealEndpoints) {
            try {
              const r = await api.get(ep);
              const cand = (r?.data?.rows ?? r?.data?.data ?? r?.data) || [];
              if (Array.isArray(cand) && cand.length > 0) { ms = cand; break; }
            } catch {
              // try next
            }
          }
        }

        if (!mounted) return;

        const ps = (pRes?.data?.hotels ?? pRes?.data?.data ?? pRes?.data) || [];
        setProperties(Array.isArray(ps) ? ps.map(p => ({ id: p.id, name: p.name || p._displayName || `${p.id}` })) : []);
        
        const sus = (suRes?.data?.data ?? suRes?.data ?? suRes?.data?.rows ?? suRes?.data) || [];
        setServiceUsers(Array.isArray(sus) ? sus.map(s => ({ id: s.id, name: s.first_name ?? s.name ?? s.full_name ?? `${s.id}` })) : []);

        if (Array.isArray(ms) && ms.length > 0) {
          const normalize = (m, idx) => {
            const id = m.id ?? m.meal_id ?? idx;
            const serviceUser = m.service_user_name ?? m.serviceUserName ?? m.service_user ?? m.serviceUser ?? m.name ?? 'Unknown';
            const property = m.property_name ?? m.propertyName ?? m.property ?? m.hotel_name ?? m.hotel ?? 'Unknown';
            
            return { 
                id, 
                serviceUserId: m.service_user_id ?? m.serviceUserId,
                propertyId: m.property_id ?? m.propertyId,
                serviceUser, 
                property, 
                mealType: m.meal_type ?? m.mealType ?? m.type ?? m.meal ?? 'Breakfast', 
                portion: m.portion ?? m.size ?? m.portion_size ?? 'Standard', 
                dietary: m.dietary ?? m.diet ?? m.allergies ?? '-', 
                status: m.status ?? m.state ?? (m.consumed ? 'Consumed' : (m.is_consumed ? 'Consumed' : 'Pending')) ?? 'Pending',
                scheduledDate: m.scheduled_date ?? m.scheduledDate ?? date,
                notes: m.notes || ''
            };
          };
          setMeals(ms.map((m, idx) => normalize(m, idx)));
        } else {
          setMeals([]);
        }
      } catch (err) {
        console.warn('Failed to load meal page data', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [api, date]);

  const counts = useMemo(() => {
    const total = meals.length;
    const consumed = meals.filter(m => String(m.status).toLowerCase() === 'consumed').length;
    const pending = meals.filter(m => String(m.status).toLowerCase() !== 'consumed').length;
    return { total, consumed, pending };
  }, [meals]);

  const tabs = useMemo(() => {
    const all = meals.length;
    const breakfast = meals.filter(m => m.mealType && String(m.mealType).toLowerCase() === 'breakfast').length;
    const lunch = meals.filter(m => m.mealType && String(m.mealType).toLowerCase() === 'lunch').length;
    const dinner = meals.filter(m => m.mealType && String(m.mealType).toLowerCase() === 'dinner').length;
    return { all, breakfast, lunch, dinner };
  }, [meals]);

  function filteredMeals() {
    return meals.filter(m => {
      if (selectedProperty && String(m.property) !== String(selectedProperty)) return false;
      const type = m.mealType ? String(m.mealType).toLowerCase() : '';
      if (activeTab === 'breakfast') return type === 'breakfast';
      if (activeTab === 'lunch') return type === 'lunch';
      if (activeTab === 'dinner') return type === 'dinner';
      return true;
    });
  }

  async function markConsumed(id) {
    setMeals(prev => prev.map(m => String(m.id) === String(id) ? ({ ...m, status: 'Consumed' }) : m));
    try {
      await api.patch(`/api/meals/${encodeURIComponent(id)}`, { status: 'Consumed' }).catch(() => null);
    } catch { /* swallow */ }
  }

  async function createMeal(payload) {
    const tempId = `tmp-${Date.now()}`;
    const row = {
      id: tempId,
      serviceUserId: payload.service_user_id,
      propertyId: payload.property_id,
      serviceUser: payload.service_user_name || 'Unknown',
      property: payload.property_name || '',
      mealType: payload.meal_type || 'Breakfast',
      portion: payload.portion || 'Standard',
      dietary: payload.dietary || '-',
      status: payload.status || 'Pending',
      scheduledDate: payload.scheduled_date,
      notes: payload.notes || ''
    };
    
    setMeals(prev => [row, ...prev]);

    try {
      const res = await api.post('/api/meals', payload);
      const saved = res?.data?.row ?? res?.data;
      if (saved) {
        const normalized = {
          id: saved.id ?? saved.meal_id ?? tempId,
          serviceUserId: saved.service_user_id ?? row.serviceUserId,
          propertyId: saved.property_id ?? row.propertyId,
          serviceUser: saved.service_user_name ?? row.serviceUser,
          property: saved.property_name ?? row.property,
          mealType: saved.meal_type ?? row.mealType,
          portion: saved.portion ?? row.portion,
          dietary: saved.dietary ?? row.dietary,
          status: saved.status ?? row.status,
          scheduledDate: saved.scheduled_date ?? row.scheduledDate,
          notes: saved.notes ?? row.notes
        };
        setMeals(prev => prev.map(m => String(m.id) === String(tempId) ? normalized : m));
      }
    } catch (err) {
      console.warn('Failed to create meal on server', err?.message || err);
      // revert optimistic row
      setMeals(prev => prev.filter(m => m.id !== tempId));
      alert("Failed to save meal. Please try again.");
    }
  }

  function handleView(m) {
    setViewingMeal(m);
  }

  function handleEdit(m) {
    setEditingMeal(m);
    setShowScheduleModal(true);
  }

  async function handleDelete(m) {
    const ok = confirm('Delete this meal? This action cannot be undone.');
    if (!ok) return;
    try {
      setMeals(prev => prev.filter(x => String(x.id) !== String(m.id)));
      if (m.id && String(m.id).startsWith('tmp-')) return;
      await api.delete(`/api/meals/${encodeURIComponent(m.id)}`).catch(() => null);
    } catch (err) {
      console.warn('Failed to delete meal', err?.message || err);
      alert('Failed to delete meal.');
    }
  }

  async function updateMeal(id, payload) {
    // keep a copy so we can revert on failure
    const prevMeals = [...meals];
    setMeals(prev => prev.map(m => (String(m.id) === String(id) ? ({ 
        ...m, 
        serviceUser: payload.service_user_name ?? m.serviceUser, 
        property: payload.property_name ?? m.property, 
        mealType: payload.meal_type ?? m.mealType, 
        portion: payload.portion ?? m.portion, 
        dietary: payload.dietary ?? m.dietary, 
        status: payload.status ?? m.status,
        serviceUserId: payload.service_user_id ?? m.serviceUserId,
        propertyId: payload.property_id ?? m.propertyId,
        notes: payload.notes ?? m.notes
    }) : m)));

    try {
      await api.patch(`/api/meals/${encodeURIComponent(id)}`, payload);
    } catch (err) {
      console.warn('Failed to update meal on server', err?.message || err);
      // revert optimistic update
      setMeals(prevMeals);
      alert('Failed to update meal on server');
    } finally {
      setEditingMeal(null);
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-slate-700">
      <div className="max-w-[1200px] mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meal Management</h1>
            <div className="text-sm text-slate-400 mt-1">/ Meals  / Meal Management</div>
          </div>
          <div>
              <button onClick={() => { setEditingMeal(null); setShowScheduleModal(true); }} className="bg-[#e77a40] text-white px-4 py-2 rounded-lg shadow-sm hover:bg-[#d66a30] transition-colors">+ Schedule Meal</button>
          </div>
        </div>

        {/* --- SCHEDULE MODAL --- */}
        {showScheduleModal && (
            <ScheduleMealModal
                serviceUsers={serviceUsers}
                properties={properties}
                initialDate={date}
                initialData={editingMeal}
                onClose={() => { setShowScheduleModal(false); setEditingMeal(null); }}
                onCreate={async (payload) => {
                    await createMeal(payload);
                    setShowScheduleModal(false);
                }}
                onUpdate={async (id, payload) => {
                    await updateMeal(id, payload);
                    setShowScheduleModal(false);
                }}
            />
        )}

        {/* --- VIEW DETAILS MODAL --- */}
        {viewingMeal && (
            <ViewMealModal 
                meal={viewingMeal} 
                onClose={() => setViewingMeal(null)} 
            />
        )}

        {/* --- UPDATED STAT CARDS (Based on Photo) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Total Meals */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
               {/* Fork and Knife Icon */}
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Total Meals</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{counts.total}</div>
            </div>
          </div>

          {/* Card 2: Consumed */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
               {/* Checkmark Circle Icon */}
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Consumed</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{counts.consumed}</div>
            </div>
          </div>

          {/* Card 3: Pending */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-[#e77a40] flex items-center justify-center text-white shrink-0">
               {/* Clock Icon */}
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Pending</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{counts.pending}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filters</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
              <option value="">All Properties</option>
              {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'all' ? 'bg-slate-100 border border-slate-200 shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>All Meals</button>
            <button onClick={() => setActiveTab('breakfast')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'breakfast' ? 'bg-slate-100 border border-slate-200 shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Breakfast ({tabs.breakfast})</button>
            <button onClick={() => setActiveTab('lunch')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'lunch' ? 'bg-slate-100 border border-slate-200 shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Lunch ({tabs.lunch})</button>
            <button onClick={() => setActiveTab('dinner')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'dinner' ? 'bg-slate-100 border border-slate-200 shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Dinner ({tabs.dinner})</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">All Scheduled Meals</h3>
          <p className="text-sm text-slate-400 mb-4">Showing meals for {new Date(date).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-slate-600 bg-slate-50">
                  <th className="px-4 py-3 font-semibold rounded-l-lg">Service User</th>
                  <th className="px-4 py-3 font-semibold">Property</th>
                  <th className="px-4 py-3 font-semibold">Meal Type</th>
                  <th className="px-4 py-3 font-semibold">Portion</th>
                  <th className="px-4 py-3 font-semibold">Dietary</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Loading meals...</td></tr>
                ) : filteredMeals().length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No meals found for this selection.</td></tr>
                ) : filteredMeals().map(m => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{m.serviceUser}</td>
                    <td className="px-4 py-3 text-slate-600">{m.property}</td>
                    <td className="px-4 py-3 text-slate-600">{m.mealType}</td>
                    <td className="px-4 py-3 text-slate-600">{m.portion}</td>
                    <td className="px-4 py-3 text-slate-600">{m.dietary}</td>
                    <td className="px-4 py-3">
                      {String(m.status).toLowerCase() === 'consumed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Consumed</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <button title="View Details" onClick={() => handleView(m)} className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
                        <IconEye />
                      </button>
                      <button title="Edit" onClick={() => handleEdit(m)} className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
                        <IconEdit />
                      </button>
                      <button title="Delete" onClick={() => handleDelete(m)} className="p-2 rounded-md hover:bg-slate-100 text-rose-600 transition-colors">
                        <IconTrash />
                      </button>
                      {String(m.status).toLowerCase() !== 'consumed' && (
                        <button onClick={() => markConsumed(m.id)} className="px-3 py-1.5 rounded-md bg-[#e77a40] hover:bg-[#d66a30] text-white text-xs font-medium transition-colors">Mark Consumed</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- VIEW DETAILS MODAL ---
function ViewMealModal({ meal, onClose }) {
    if (!meal) return null;
    
    const isConsumed = String(meal.status).toLowerCase() === 'consumed';
    
    const DetailItem = ({ label, value }) => (
        <div>
            <div className="text-xs uppercase font-semibold text-slate-400 mb-1 tracking-wider">{label}</div>
            <div className="text-slate-800 font-medium text-base">{value || '-'}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                         <h2 className="text-xl font-bold text-slate-800">Meal Details</h2>
                         {isConsumed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">Consumed</span>
                         ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">Pending</span>
                         )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-8 space-y-8">
                    {/* Primary Info Grid */}
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                         <DetailItem label="Service User" value={meal.serviceUser} />
                         <DetailItem label="Property" value={meal.property} />
                         <DetailItem label="Scheduled Date" value={new Date(meal.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })} />
                         <DetailItem label="Meal Type" value={meal.mealType} />
                         <DetailItem label="Portion Size" value={meal.portion} />
                         <DetailItem label="Dietary Needs" value={meal.dietary} />
                    </div>

                    {/* Full Width Section for Notes */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="text-xs uppercase font-semibold text-slate-400 mb-2 tracking-wider">Additional Notes</div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-600 text-sm leading-relaxed min-h-[60px]">
                            {meal.notes ? meal.notes : <span className="text-slate-400 italic">No additional notes provided.</span>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function ScheduleMealModal({ serviceUsers = [], properties = [], initialDate = null, initialData = null, onClose = () => {}, onCreate = async () => {}, onUpdate = async () => {} }) {
  const [form, setForm] = useState({ 
    serviceUserId: '', 
    propertyId: '', 
    mealType: 'Breakfast', 
    scheduledDate: initialDate || new Date().toISOString().slice(0,10), 
    portion: 'Standard', 
    dietary: '', 
    notes: '' 
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (initialData) {
        setForm({
            serviceUserId: initialData.serviceUserId || '',
            propertyId: initialData.propertyId || '',
            mealType: initialData.mealType || 'Breakfast',
            scheduledDate: initialData.scheduledDate || new Date().toISOString().slice(0,10),
            portion: initialData.portion || 'Standard',
            dietary: initialData.dietary || '',
            notes: initialData.notes || ''
        });
    } else {
        // Reset if creating new
        setForm({ 
            serviceUserId: '', 
            propertyId: '', 
            mealType: 'Breakfast', 
            scheduledDate: initialDate || new Date().toISOString().slice(0,10), 
            portion: 'Standard', 
            dietary: '', 
            notes: '' 
        });
    }
  }, [initialData, initialDate]);

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    const payload = {
      service_user_id: form.serviceUserId,
      service_user_name: (serviceUsers.find(s => String(s.id) === String(form.serviceUserId)) || {}).name || null,
      property_id: form.propertyId,
      property_name: (properties.find(p => String(p.id) === String(form.propertyId)) || {}).name || null,
      meal_type: form.mealType,
      scheduled_date: form.scheduledDate,
      portion: form.portion,
      dietary: form.dietary,
      notes: form.notes,
      status: initialData ? initialData.status : 'Pending',
    };

    try {
      if (initialData && initialData.id) {
        await onUpdate(initialData.id, payload);
      } else {
        await onCreate(payload);
      }
    } catch (err) {
      console.error('save meal failed', err);
      alert('Failed to save meal');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Meal' : 'Schedule Meal'}</h2>
            <p className="text-sm text-slate-500 mt-1">{initialData ? 'Update existing meal details' : 'Create a new meal plan for a service user'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Service User</label>
                <select required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.serviceUserId} onChange={e => handleChange('serviceUserId', e.target.value)}>
                  <option value="">Select a service user</option>
                  {serviceUsers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Property</label>
                <select required className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.propertyId} onChange={e => handleChange('propertyId', e.target.value)}>
                  <option value="">Select a property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meal Type</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.mealType} onChange={e => handleChange('mealType', e.target.value)}>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Scheduled Date</label>
                <input required type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.scheduledDate} onChange={e => handleChange('scheduledDate', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Portion Size</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.portion} onChange={e => handleChange('portion', e.target.value)}>
                  <option>Standard</option>
                  <option>Small</option>
                  <option>Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Requirements</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.dietary} onChange={e => handleChange('dietary', e.target.value)} placeholder="e.g., Vegetarian, Halal, Gluten-free" />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white resize-none focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Additional notes about this meal" />
              </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#e77a40] hover:bg-[#d66a30] text-white rounded-lg transition-colors shadow-sm">{initialData ? 'Save Changes' : 'Create Meal Plan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}