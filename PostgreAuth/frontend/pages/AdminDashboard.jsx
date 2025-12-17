/* src/pages/AdminDashboard.jsx */
/* eslint-disable no-unused-vars */
// Admin dashboard with KPI row + Employee Status | Attendance Overview | Clock-In/Out
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

axios.defaults.withCredentials = true;

// small KPI box (kept from previous)
function KPIBox({ color, title, main, delta, deltaUp = true, ctaText = "View All" }) {
  return (
    <div className="bg-white rounded-md shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white"
          style={{ background: color }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <path d="M7 12h10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="text-sm text-slate-500">{title}</div>

          <div className="mt-3 flex items-baseline gap-4">
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{main}</div>
            {delta != null && (
              <div className={`text-sm font-medium ${deltaUp ? "text-emerald-500" : "text-rose-500"}`}>
                {deltaUp ? "▲" : "▼"} {delta}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-slate-400">{ctaText}</div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------
   Employee Status card
*/
function EmployeeStatusCard({ data }) {
  const total = data?.total ?? 154;
  const breakdown = data?.breakdown ?? [
    { label: "Fulltime", count: 112, percent: 48, color: "#f59e0b" },
    { label: "Contract", count: 30, percent: 20, color: "#355b60" },
    { label: "Probation", count: 12, percent: 22, color: "#ef4444" },
    { label: "WFH", count: 4, percent: 10, color: "#ec4899" },
  ];
  const top = data?.topPerformer || { name: "Daniel Esbella", role: "IOS Developer", score: 99, avatar: "https://i.pravatar.cc/40?img=7" };

  return (
    <div className="bg-white rounded-md shadow p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">Employee Status</h3>
        <button className="text-xs bg-slate-100 px-3 py-1 rounded">This Week</button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Total Employee</div>
          <div className="text-3xl font-bold mt-2">{total}</div>
        </div>

        <div className="flex-1 px-6">
          <div className="w-full h-4 rounded-full overflow-hidden bg-slate-100">
            <div style={{ width: `${breakdown[0]?.percent ?? 0}%`, background: breakdown[0]?.color }} className="h-full inline-block" />
            <div style={{ width: `${breakdown[1]?.percent ?? 0}%`, background: breakdown[1]?.color }} className="h-full inline-block" />
            <div style={{ width: `${breakdown[2]?.percent ?? 0}%`, background: breakdown[2]?.color }} className="h-full inline-block" />
            <div style={{ width: `${breakdown[3]?.percent ?? 0}%`, background: breakdown[3]?.color }} className="h-full inline-block" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-slate-700">
        {breakdown.map((b) => (
          <div key={b.label} className="border rounded p-4">
            <div className="text-xs text-slate-400">{b.label} ({b.percent}%)</div>
            <div className="text-2xl font-semibold mt-2">{String(b.count).padStart(2, "0")}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-sm text-slate-700 font-semibold mb-2">Top Performer</div>
        <div className="flex items-center gap-3 border rounded p-3 bg-orange-50">
          <img src={top.avatar} alt={top.name} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <div className="font-medium">{top.name}</div>
            <div className="text-sm text-slate-500">{top.role}</div>
          </div>
          <div className="text-sm text-slate-700"><span className="font-bold text-2xl">{top.score}%</span></div>
        </div>
      </div>

      <div className="mt-4">
        <button className="w-full bg-slate-100 py-2 rounded text-sm">View All Employees</button>
      </div>
    </div>
  );
}

/* ----------------------
   Attendance Overview card
*/
function AttendanceOverviewCard({ data }) {
  const d = data || { total: 120, breakdown: [
    { name: "Present", value: 59, color: "#10b981" },
    { name: "Late", value: 21, color: "#0f172a" },
    { name: "Permission", value: 2, color: "#f59e0b" },
    { name: "Absent", value: 15, color: "#ef4444" },
  ]};

  const pieData = d.breakdown.map(item => ({ name: item.name, value: item.value }));
  const colors = d.breakdown.map(item => item.color);

  return (
    <div className="bg-white rounded-md shadow p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">Attendance Overview</h3>
        <button className="text-xs bg-slate-100 px-3 py-1 rounded">Today</button>
      </div>

      <div className="mt-4 flex gap-6 items-center">
        <div style={{ width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={6}
                startAngle={120}
                endAngle={-120}
                label={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <div className="text-center text-slate-700 font-semibold">Total Attendance</div>
          <div className="text-3xl font-bold text-center mt-3">{d.total}</div>

          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {d.breakdown.map((b) => (
              <li key={b.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: b.color }} />
                  <div>{b.name}</div>
                </div>
                <div>{b.value}%</div>
              </li>
            ))}
          </ul>

          <div className="mt-4 p-3 bg-slate-50 rounded flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/40?img=1" alt="" />
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/40?img=2" alt="" />
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/40?img=3" alt="" />
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium border-2 border-white">+1</div>
            </div>

            <div className="text-sm text-slate-500">View Details</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------
   Clock-In/Out card
*/
function ClockCard({ data }) {
  const body = data || {
    recent: [
      { name: "Daniel Esbella", role: "UI/UX Designer", avatar: "https://i.pravatar.cc/40?img=21", time: "09:15", info: "" },
      { name: "Doglas Martini", role: "Project Manager", avatar: "https://i.pravatar.cc/40?img=22", time: "09:36", info: "" },
      { name: "Brian Villalobos", role: "PHP Developer", avatar: "https://i.pravatar.cc/40?img=23", time: "09:15", info: "Clock In 10:30, Clock Out 09:45, Production 09:21 Hrs" },
    ],
    late: [
      { name: "Anthony Lewis", role: "Marketing Head", avatar: "https://i.pravatar.cc/40?img=24", lateBy: "30 Min", clock: "08:35" }
    ]
  };

  return (
    <div className="bg-white rounded-md shadow p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">Clock-In/Out</h3>
        <div className="flex items-center gap-3">
          <select className="text-sm border rounded px-2 py-1">
            <option>All Departments</option>
          </select>
          <button className="text-xs bg-slate-100 px-3 py-1 rounded">Today</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {body.recent.map((r, i) => (
          <div key={i} className="border rounded p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-500">{r.role}</div>
              </div>
            </div>

            <div className="text-sm text-emerald-600 font-medium">{r.time}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-700 mb-2">Late</div>
        {body.late.map((l, i) => (
          <div key={i} className="border rounded p-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={l.avatar} alt={l.name} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-slate-500">{l.role}</div>
              </div>
            </div>

            <div className="text-sm">
              <div className="inline-block bg-emerald-500 text-white px-2 py-1 rounded text-xs">{l.lateBy}</div>
              <div className="text-xs text-rose-500 mt-1">{l.clock}</div>
            </div>
          </div>
        ))}

        <div>
          <button className="w-full bg-slate-100 py-2 rounded">View All Attendance</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------
   AdminDashboard main
   ---------------------- */
export default function AdminDashboard({ userProp = null }) {
  const ctx = useOutletContext() || {};
  const userFromOutlet = ctx.user || null;

  // prefer userProp -> then context
  const user = userProp || userFromOutlet || null;

  // KPI states (existing)
  const [attendanceKPI, setAttendanceKPI] = useState({ current: 120, target: 154, delta: "+2.1%", up: true });
  const [hotelsKPI, setHotelsKPI] = useState({ current: 90, target: 125, delta: "-2.1%", up: false });
  const [staffKPI, setStaffKPI] = useState({ current: 69, target: 86, delta: "-11.2%", up: false });
  const [tasksKPI, setTasksKPI] = useState({ current: 225, target: 28, delta: "+11.2%", up: true });

  // new cards data
  const [empStatus, setEmpStatus] = useState(null);
  const [attendanceDist, setAttendanceDist] = useState(null);
  const [clockData, setClockData] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        // Preferred single admin overview (if exists)
        const overviewReq = axios.get("/api/admin/overview").catch(() => null);

        // New endpoints for the three new cards
        const empReq = axios.get("/api/admin/employee-status").catch(() => null);
        const attReq = axios.get("/api/admin/attendance-distribution").catch(() => null);
        const clkReq = axios.get("/api/admin/clockin").catch(() => null);

        // Also fire fallback endpoints
        const hotelsReq = axios.get("/api/hotels").catch(() => null);
        const staffReq = axios.get("/api/staff").catch(() => null);
        const tasksReq = axios.get("/api/tasks").catch(() => null);
        const attSummaryReq = axios.get("/api/attendance/summary").catch(() => null);

        // Collect promises correctly
        const promises = [overviewReq, empReq, attReq, clkReq, hotelsReq, staffReq, tasksReq, attSummaryReq];
        const [
          overviewRes,
          empRes,
          attRes,
          clkRes,
          hotelsRes,
          staffRes,
          tasksRes,
          attSumRes
        ] = await Promise.all(promises);

        // If overview exists and contains KPI + optional nested data, use it
        if (overviewRes && overviewRes.data) {
          const o = overviewRes.data;
          if (mounted) {
            if (o.attendance) setAttendanceKPI((s) => ({ ...s, ...o.attendance }));
            if (o.hotels) setHotelsKPI((s) => ({ ...s, ...o.hotels }));
            if (o.staff) setStaffKPI((s) => ({ ...s, ...o.staff }));
            if (o.tasks) setTasksKPI((s) => ({ ...s, ...o.tasks }));
            if (o.employeeStatus) setEmpStatus(o.employeeStatus);
            if (o.attendanceDistribution) setAttendanceDist(o.attendanceDistribution);
            if (o.clock) setClockData(o.clock);
          }
        }

        // employee status fallback
        if (empRes && empRes.data) {
          if (mounted) setEmpStatus(empRes.data);
        }

        // attendance distribution fallback
        if (attRes && attRes.data) {
          if (mounted) setAttendanceDist(attRes.data);
        } else if (attSumRes && attSumRes.data && !attendanceDist) {
          if (mounted) setAttendanceDist(attSumRes.data);
        }

        // clock data fallback
        if (clkRes && clkRes.data) {
          if (mounted) setClockData(clkRes.data);
        }

        // fallbacks for KPIs if overview not present
        if (!overviewRes) {
          if (hotelsRes && hotelsRes.data) {
            const body = hotelsRes.data;
            const arr = Array.isArray(body) ? body : body.hotels || body.data || [];
            const count = Array.isArray(arr) ? arr.length : (body.count || 0);
            if (mounted) setHotelsKPI((s) => ({ ...s, current: count }));
          }
          if (staffRes && staffRes.data) {
            const body = staffRes.data;
            const arr = Array.isArray(body) ? body : body.users || body.data || [];
            const count = Array.isArray(arr) ? arr.length : (body.count || 0);
            if (mounted) setStaffKPI((s) => ({ ...s, current: count }));
          }
          if (tasksRes && tasksRes.data) {
            const body = tasksRes.data;
            const arr = Array.isArray(body) ? body : body.tasks || body.data || [];
            const count = Array.isArray(arr) ? arr.length : (body.count || 0);
            if (mounted) setTasksKPI((s) => ({ ...s, current: count }));
          }
          if (attSumRes && attSumRes.data) {
            const body = attSumRes.data;
            if (mounted) setAttendanceKPI((s) => ({ ...s, current: body.current || s.current, target: body.target || s.target, delta: body.delta || s.delta, up: typeof body.up === "boolean" ? body.up : s.up }));
          }
        }

      } catch (err) {
        // if anything fails we still show demo values
        console.warn("admin dashboard loadAll error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-9xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          {/* Title: show Manager Dashboard for manager users */}
          <h1 className="text-2xl font-semibold">
            {user?.role === "manager" ? "Manager Dashboard" : "Admin Dashboard"}
          </h1>

          <div className="text-sm text-slate-500">Welcome{user?.name ? `, ${user.name}` : ""}</div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KPIBox
            color="#f97316"
            title="Attendance Overview"
            main={`${attendanceKPI.current}/${attendanceKPI.target}`}
            delta={attendanceKPI.delta}
            deltaUp={attendanceKPI.up}
            ctaText="View Details"
          />
          <KPIBox
            color="#0f6c71"
            title="Total No of Hotels"
            main={`${hotelsKPI.current}/${hotelsKPI.target}`}
            delta={hotelsKPI.delta}
            deltaUp={hotelsKPI.up}
            ctaText="View All"
          />
          <KPIBox
            color="#2563eb"
            title="Total No of Staff"
            main={`${staffKPI.current}/${staffKPI.target}`}
            delta={staffKPI.delta}
            deltaUp={staffKPI.up}
            ctaText="View All"
          />
          <KPIBox
            color="#ec4899"
            title="Total No of Tasks"
            main={`${tasksKPI.current}/${tasksKPI.target}`}
            delta={tasksKPI.delta}
            deltaUp={tasksKPI.up}
            ctaText="View All"
          />
        </div>

        {/* THE NEW 3-COLUMN ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EmployeeStatusCard data={empStatus} />
          <AttendanceOverviewCard data={attendanceDist} />
          <ClockCard data={clockData} />
        </div>

        {/* rest (optional extra panels) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="bg-white rounded-md shadow p-4 text-sm text-slate-600">Recent Activity</div>
          <div className="bg-white rounded-md shadow p-4 text-sm text-slate-600">Hotels Summary</div>
          <div className="bg-white rounded-md shadow p-4 text-sm text-slate-600">Quick Links</div>
        </div>
      </div>
    </div>
  );
}
