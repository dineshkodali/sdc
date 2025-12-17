import React from "react";
import { Home, Building, BedDouble, Users, MapPin } from "lucide-react";

export default function PropertyDetails({ property }) {
  const {
    name,
    address,
    tags = [],
    totalFloors = 0,
    totalRooms = 0,
    totalBedspaces = 0,
    occupiedBeds = 0,
  } = property || {};

  const occupancyRate =
    totalBedspaces === 0 ? 0 : Math.round((occupiedBeds / totalBedspaces) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          Properties &gt; <span className="text-gray-700">{name}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900">{name}</h1>

        {/* Address */}
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {address}
        </p>

        {/* Tags */}
        <div className="mt-3 flex items-center gap-2">
          {tags.map((t, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full text-xs bg-black text-white"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">

          <StatCard icon={<Building className="w-6 h-6" />} title="Total Floors" value={totalFloors} />

          <StatCard icon={<Home className="w-6 h-6" />} title="Total Rooms" value={totalRooms} />

          <StatCard
            icon={<BedDouble className="w-6 h-6" />}
            title="Total Bedspaces"
            value={totalBedspaces}
            subtitle={`${occupiedBeds} occupied`}
          />

          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Occupancy Rate"
            value={`${occupancyRate}%`}
            subtitle={`${occupiedBeds} / ${totalBedspaces} beds`}
          />
        </div>

        {/* Overview Card */}
        <div className="mt-10 bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Property Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Hotel room structure and occupancy
          </p>

          <div className="flex justify-center items-center mt-10">
            {totalFloors === 0 && totalRooms === 0 ? (
              <EmptyOverview />
            ) : (
              <div className="text-gray-400 text-sm">
                (Structure preview goes here)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- STAT CARD COMPONENT --- */
function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="text-gray-300">{icon}</div>
      </div>
    </div>
  );
}

/* --- EMPTY OVERVIEW --- */
function EmptyOverview() {
  return (
    <div className="flex flex-col items-center text-center text-gray-400">
      <div className="p-6 rounded-xl border border-dashed border-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v13h18V7M5 5h14l1 2H4l1-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mt-4 text-gray-700">
        No floors or rooms yet
      </h3>
      <p className="text-sm mt-1 text-gray-500">
        Add floors and rooms to get started
      </p>
    </div>
  );
}
