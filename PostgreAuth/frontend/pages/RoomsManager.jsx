/* src/pages/RoomsManager.jsx */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// ensure cookies are sent for protected endpoints (explicit)
axios.defaults.withCredentials = true;

export default function RoomsManager({ user }) {
  const { hotelId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ room_number: "", type: "", rate: "" });
  const [editing, setEditing] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [saving, setSaving] = useState(false);

  // Determine if current user is allowed to manage rooms for this hotel
  const computeCanManage = (userObj, hotelObj) => {
    if (!userObj) return false;
    if (userObj.role === "admin") return true;
    if (!hotelObj) return false;
    if (String(userObj.id) === String(hotelObj.manager_id)) return true;
    if (userObj.role === "staff") {
      const userHotelId = userObj.hotel_id || userObj.hotelId || userObj.hotel || null;
      if (userHotelId && String(userHotelId) === String(hotelObj.id)) return true;
      if (userObj.branch && hotelObj.branch && String(userObj.branch) === String(hotelObj.branch)) return true;
    }
    return false;
  };

  const fetchHotel = async () => {
    try {
      const res = await axios.get(`/api/hotels/${hotelId}`);
      // some APIs return { hotel: {...} } while others return the object directly
      setHotel(res.data && res.data.hotel ? res.data.hotel : res.data);
    } catch (err) {
      console.error("Failed to load hotel:", err);
      setHotel(null);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/hotels/${hotelId}/rooms`);
      setRooms(res.data && res.data.rooms ? res.data.rooms : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const canManage = computeCanManage(user, hotel);

  const createRoom = async (e) => {
    e.preventDefault();
    if (!canManage) return alert("You are not authorized to create rooms for this hotel.");
    setSaving(true);
    try {
      const payload = {
        room_number: form.room_number,
        type: form.type,
        rate: form.rate !== "" ? Number(form.rate) : null,
      };
      const res = await axios.post(`/api/hotels/${hotelId}/rooms`, payload);
      setForm({ room_number: "", type: "", rate: "" });
      await fetch();
      // optionally show server message
      if (res.data && res.data.message) {
        // lightweight non-blocking feedback
        console.info(res.data.message);
      }
    } catch (err) {
      console.error("Create room error:", err);
      alert(err?.response?.data?.message || "Failed to create room");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r) => {
    setEditing(r.id);
    setForm({
      room_number: r.room_number || "",
      type: r.type || "",
      rate: (r.rate !== undefined && r.rate !== null) ? String(r.rate) : "",
    });
    // scroll into view or focus can be added here if desired
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!canManage) return alert("You are not authorized to edit rooms for this hotel.");
    if (!editing) return alert("No room selected for editing.");
    setSaving(true);
    try {
      const payload = {
        room_number: form.room_number,
        type: form.type,
        rate: form.rate !== "" ? Number(form.rate) : null,
      };
      // IMPORTANT: use the hotel-scoped route for editing
      await axios.put(`/api/hotels/${hotelId}/rooms/${editing}`, payload);
      setEditing(null);
      setForm({ room_number: "", type: "", rate: "" });
      await fetch();
    } catch (err) {
      console.error("Save edit error:", err);
      alert(err?.response?.data?.message || "Failed to update room");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete room?")) return;
    if (!canManage) return alert("You are not authorized to delete rooms for this hotel.");
    try {
      // IMPORTANT: use the hotel-scoped route for delete
      await axios.delete(`/api/hotels/${hotelId}/rooms/${id}`);
      await fetch();
    } catch (err) {
      console.error("Delete room error:", err);
      alert(err?.response?.data?.message || "Failed to delete room");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Manage Rooms</h2>

      {loading ? <div>Loading...</div> : (
        <div className="grid gap-4">
          {/* Create / Edit form visible to allowed users (admin/manager/staff assigned) */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">{editing ? "Edit Room" : "Create Room"}</h3>

            {/* Show form even if hotel info hasn't loaded yet — backend will guard */}
            <form onSubmit={editing ? saveEdit : createRoom} className="grid grid-cols-1 gap-2">
              <input
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                placeholder="Room number"
                required
                className="p-2 border rounded"
              />

              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Type (Single/Double/Suite)"
                className="p-2 border rounded"
              />

              <input
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="Rate"
                type="number"
                className="p-2 border rounded"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`px-3 py-1 ${canManage ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"} rounded`}
                  disabled={!canManage || saving}
                >
                  {saving ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create")}
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setForm({ room_number: "", type: "", rate: "" }); }}
                    className="px-3 py-1 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!canManage && (
                <div className="text-xs text-gray-500 mt-1">
                  You do not have permission to create or edit rooms for this hotel.
                </div>
              )}
            </form>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium mb-2">Rooms List</h3>
            {rooms.length === 0 ? <div className="text-sm text-gray-500">No rooms yet.</div> : (
              <div className="space-y-2">
                {rooms.map(r => (
                  <div key={r.id} className="flex items-center justify-between border p-2 rounded">
                    <div>
                      <div className="font-semibold">Room {r.room_number}</div>
                      <div className="text-sm text-gray-500">{r.type} • ₹{Number(r.rate || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-400 mt-1">Status: {r.status}</div>
                    </div>

                    <div className="flex gap-2">
                      {/* Edit/Delete only shown if user can manage */}
                      {canManage ? (
                        <>
                          <button onClick={() => startEdit(r)} className="px-2 py-1 bg-indigo-600 text-white rounded">Edit</button>
                          <button onClick={() => remove(r.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">Read-only</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
