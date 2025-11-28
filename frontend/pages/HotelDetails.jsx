/* src/pages/HotelDetails.jsx */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";

/**
 * HotelDetails page
 */
export default function HotelDetails() {
  const { user } = useOutletContext() || {};
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // load hotel details
  const fetchHotel = async () => {
    try {
      const res = await axios.get(`/api/hotels/${id}`);
      setHotel(res.data || null);
    } catch (err) {
      console.error("Failed to load hotel:", err);
      setHotel(null);
    }
  };

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await axios.get(`/api/hotels/${id}/rooms`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchHotel();
    fetchRooms();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // compute canManage using the same logic as RoomsManager
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

  const canManage = computeCanManage(user, hotel);

  const goToManage = () => {
    if (!hotel || !hotel.id) return;
    navigate(`/hotels/${hotel.id}/rooms`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading hotel...</div>;

  if (!hotel) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-9xl mx-auto">
          <div className="text-lg text-red-600">Hotel not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-9xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-1">{hotel.name}</h1>
            <div className="text-sm text-gray-500 mb-4">{hotel.city ? `${hotel.city}` : ""}</div>
            {hotel.manager_name && <div className="text-xs text-gray-400">Manager: {hotel.manager_name}</div>}
          </div>

          {/* Manage button visible when allowed */}
          <div className="flex items-center gap-2">
            {canManage ? (
              <button
                onClick={goToManage}
                className="px-4 py-2 bg-indigo-600 text-white rounded shadow"
              >
                Manage
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rooms</h3>
          {roomsLoading ? (
            <div>Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-gray-500">No rooms yet.</div>
          ) : (
            <div className="grid gap-3">
              {rooms.map((r) => (
                <div key={r.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Room {r.room_number}</div>
                    <div className="text-xs text-gray-500">{r.type} • {r.status}</div>
                  </div>
                  <div className="text-sm text-gray-500">₹{Number(r.rate || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
