/* eslint-disable no-unused-vars */
// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* Simple small components */
function StatCard({ title, value, delta, positive = true }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="flex items-baseline justify-between mt-3">
        <div className="text-2xl font-bold">{value}</div>
        <div className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-500"}`}>{delta}</div>
      </div>
    </div>
  );
}

/* Large module card (Maintenance / Compliance style) */
function ModuleCard({ title, total, items, overdueCount = 0, accent }) {
  const completed = items[3]?.count || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const ringStyle = accent ? { boxShadow: `inset 0 0 0 1px ${accent}22` } : {};
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={ringStyle}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-gray-400 mt-1">{total} total tasks</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 border rounded">View</button>
          <button className="px-3 py-2 bg-emerald-500 text-white rounded">+ Add</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {["To Do", "In Progress", "Review", "Completed"].map((k, idx) => (
          <div key={k} className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xs text-gray-400">{k}</div>
            <div className="text-lg font-semibold mt-2">{items[idx]?.count ?? 0}</div>
          </div>
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
          <strong>{overdueCount}</strong> overdue tasks require attention
        </div>
      )}

      <div className="mt-4">
        <div className="text-sm text-gray-500 mb-2">Completion Rate</div>
        <div className="relative h-3 bg-gray-100 rounded">
          <div
            className="absolute left-0 top-0 h-3 rounded"
            style={{
              width: `${completionRate}%`,
              background: completionRate > 80 ? "#10b981" : completionRate > 50 ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <div>{completionRate}%</div>
          <div>{overdueCount} Overdue</div>
        </div>
      </div>
    </div>
  );
}

/* Small compact module card used in the extra grid */
function SmallModuleCard({ title, total = 0, items = [{count:0},{count:0},{count:0},{count:0}], accentColor }) {
  const completed = items[3]?.count || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-gray-400 mt-1">{total} total tasks</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border rounded text-sm">View</button>
          <button className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">+ Add</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {["To Do", "In Progress", "Review", "Completed"].map((k, idx) => (
          <div key={k} className="bg-gray-50 rounded p-2 text-center">
            <div className="text-xs text-gray-400">{k}</div>
            <div className="text-sm font-semibold mt-1">{items[idx]?.count ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-1">Completion Rate</div>
        <div className="relative h-2 bg-gray-100 rounded">
          <div
            className="absolute left-0 top-0 h-2 rounded"
            style={{
              width: `${completionRate}%`,
              background: accentColor || "#60a5fa",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* Specialized small card for Complaints / AIRE Tasks (with alert & badges) */
function DetailedSmallModuleCard({ title, total = 0, items = [{count:0},{count:0},{count:0},{count:0}], overdue = 0, highPriority = 0, accent = "#fca5a5" }) {
  const completed = items[3]?.count || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const containerStyle = {
    boxShadow: `inset 0 0 0 1px ${accent}33`,
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm" style={containerStyle}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* icon placeholder */}
              <span style={{ color: accent, fontWeight: 700 }}>!</span>
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-gray-400 mt-1">{total} total tasks</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border rounded text-sm">View</button>
          <button className="px-3 py-1 bg-emerald-500 text-white rounded text-sm">+ Add</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {["To Do", "In Progress", "Review", "Completed"].map((k, idx) => (
          <div key={k} className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xs text-gray-400">{k}</div>
            <div className="text-lg font-semibold mt-2">{items[idx]?.count ?? 0}</div>
          </div>
        ))}
      </div>

      {overdue > 0 && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-3">
          <div className="font-semibold">⚠️</div>
          <div>
            <div className="font-medium">{overdue} overdue task{overdue>1?"s":""} require attention</div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-sm text-gray-500 mb-2">Completion Rate</div>
        <div className="relative h-3 bg-gray-100 rounded">
          <div
            className="absolute left-0 top-0 h-3 rounded"
            style={{
              width: `${completionRate}%`,
              background: completionRate > 80 ? "#10b981" : completionRate > 50 ? "#f59e0b" : "#ef4444",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-700 font-medium">{completionRate}%</div>
          <div className="flex items-center gap-2">
            {highPriority > 0 && <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs">{highPriority} High Priority</span>}
            {overdue > 0 && <span className="px-3 py-1 rounded border text-xs">{overdue} Overdue</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Home Page ---- */
export default function Home() {
  const { user } = useOutletContext() || {};
  const [now, setNow] = useState(new Date());

  // Demo KPI data (replace with API)
  const [kpis] = useState([
    { title: "Total tasks", value: 10, delta: "+25.0%", positive: true },
    { title: "Resolutions", value: 2, delta: "+11.1%", positive: true },
    { title: "Escalations", value: 8, delta: "-15.0%", positive: false },
    { title: "SLA compliant", value: 2, delta: "+8.7%", positive: true },
    { title: "Avg resolve time (h)", value: 24.5, delta: "+9.9%", positive: false },
    { title: "Avg CSAT", value: 3.2, delta: "+3.2%", positive: true },
  ]);

  // Analytics Summary demo data
  const [volumeDrivers] = useState([
    { name: "maintenance - Fire Safety Equipment", tasks: 3, pct: "30.0%" },
    { name: "compliance - Data Protection Comp", tasks: 1, pct: "10.0%" },
    { name: "complaints - Customer Service Com", tasks: 1, pct: "10.0%" },
    { name: "aire_tasks - Immigration Case Rev", tasks: 1, pct: "10.0%" },
    { name: "maintenance - Electrical Safety Au", tasks: 1, pct: "10.0%" },
  ]);

  const [taskBreakdown] = useState([
    { name: "Backlog", value: 6 },
    { name: "In Progress", value: 2 },
    { name: "Resolved", value: 2 },
  ]);

  const [priorityDistribution] = useState([
    { name: "High", value: 3 },
    { name: "Cat1", value: 4 },
    { name: "Cat2", value: 1 },
    { name: "Cat3", value: 2 },
  ]);

  // Modules example
  const [modules] = useState([
    {
      key: "maintenance",
      title: "Maintenance",
      total: 6,
      items: [{ count: 3 }, { count: 1 }, { count: 0 }, { count: 2 }],
      overdueCount: 4,
    },
    {
      key: "compliance",
      title: "Compliance",
      total: 2,
      items: [{ count: 2 }, { count: 0 }, { count: 0 }, { count: 0 }],
      overdueCount: 2,
    },
  ]);

  // Extra smaller modules under Maintenance/Compliance (kept for completeness)
  const [extraModules] = useState([
    { key: "litigation", title: "Litigation", total: 0, items: [{count:0},{count:0},{count:0},{count:0}], color: "#f97316" },
    { key: "safeguarding", title: "Safeguarding", total: 0, items: [{count:0},{count:0},{count:0},{count:0}], color: "#6366f1" },
    { key: "migrant_help", title: "Migrant Help", total: 0, items: [{count:0},{count:0},{count:0},{count:0}], color: "#10b981" },
    { key: "ai_support", title: "AI Support", total: 0, items: [{count:0},{count:0},{count:0},{count:0}], color: "#a78bfa" },
  ]);

  // Complaints and AIRE Tasks demo specifics
  const complaintsCard = {
    key: "complaints",
    title: "Complaints",
    total: 1,
    items: [{count:0}, {count:1}, {count:0}, {count:0}],
    overdue: 1,
    highPriority: 1,
    accent: "#fca5a5",
  };

  const aireCard = {
    key: "aire",
    title: "AIRE Tasks",
    total: 0,
    items: [{count:0}, {count:0}, {count:0}, {count:0}],
    overdue: 0,
    highPriority: 0,
    accent: "#e9d5ff",
  };

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sm text-gray-400">
              Business Intelligence &nbsp;/&nbsp; Dashboards &nbsp;/&nbsp; Main Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-3">Organizational Service Insights</h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive analytics across all operational modules</p>

            {/* live time */}
            <div className="mt-2 text-xs text-gray-500">
              {now.toLocaleDateString()} &nbsp; {now.toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select className="border rounded px-3 py-2 bg-white">
              <option>Past 1 month</option>
              <option>Past 7 days</option>
              <option>Past 3 months</option>
            </select>
            <select className="border rounded px-3 py-2 bg-white">
              <option>All Modules</option>
              <option>Maintenance</option>
              <option>Compliance</option>
            </select>
            <button className="px-4 py-2 border rounded">Export</button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {kpis.map((k) => (
            <StatCard key={k.title} title={k.title} value={k.value} delta={k.delta} positive={k.positive} />
          ))}
        </div>

        {/* Operational Modules */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Operational Modules</h2>
            <div className="text-sm text-gray-400">Module-specific insights and quick actions</div>
          </div>
          <div>
            <button className="px-4 py-2 bg-emerald-400 text-white rounded">View All</button>
          </div>
        </div>

        {/* Main two modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {modules.map((m) => (
            <ModuleCard key={m.key} title={m.title} total={m.total} items={m.items} overdueCount={m.overdueCount} />
          ))}
        </div>

        {/* Complaints & AIRE Tasks (two per row, detailed small cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DetailedSmallModuleCard
            key={complaintsCard.key}
            title={complaintsCard.title}
            total={complaintsCard.total}
            items={complaintsCard.items}
            overdue={complaintsCard.overdue}
            highPriority={complaintsCard.highPriority}
            accent={complaintsCard.accent}
          />
          <DetailedSmallModuleCard
            key={aireCard.key}
            title={aireCard.title}
            total={aireCard.total}
            items={aireCard.items}
            overdue={aireCard.overdue}
            highPriority={aireCard.highPriority}
            accent={aireCard.accent}
          />
        </div>

        {/* Extra small modules grid (2 per row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {extraModules.map((em) => (
            <SmallModuleCard
              key={em.key}
              title={em.title}
              total={em.total}
              items={em.items}
              accentColor={em.color}
            />
          ))}
        </div>

        {/* Analytics Summary */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Analytics Summary</h3>
          <div className="text-sm text-gray-500 mb-4">Insights and trends across all operations</div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volume Drivers */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-500 text-xl">🔎</div>
                  <div className="font-semibold">Volume Drivers</div>
                </div>
                <button className="px-3 py-1 border rounded text-sm">View All</button>
              </div>

              <div className="space-y-3">
                {volumeDrivers.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-3">
                    <div>
                      <div className="font-medium text-sm">{v.name}</div>
                      <div className="text-xs text-gray-400">{v.tasks} tasks</div>
                    </div>
                    <div className="font-semibold">{v.pct}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Breakdown (bar) */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-500 text-xl">📊</div>
                  <div className="font-semibold">Task Breakdown</div>
                </div>
                <div className="text-sm text-gray-400">View</div>
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskBreakdown}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution (pie) */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-500 text-xl">⚠️</div>
                  <div className="font-semibold">Priority Distribution</div>
                </div>
                <div className="text-sm text-gray-400">View</div>
              </div>

              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {priorityDistribution.map((entry, idx) => {
                        const colors = ["#ef4444", "#10b981", "#34d399", "#60a5fa"];
                        return <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} />;
                      })}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} SD Commercial</div>
      </div>
    </div>
  );
}
