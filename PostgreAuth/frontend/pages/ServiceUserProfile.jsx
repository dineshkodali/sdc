// src/pages/ServiceUserProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

// Reuse the resilient API base resolution used elsewhere
const buildCandidateBases = () => {
  const list = [];
  if (import.meta.env.VITE_API_URL) list.push(import.meta.env.VITE_API_URL);
  if (typeof window !== "undefined") {
    const { origin, hostname, protocol } = window.location;
    const ports = [4000, 4001, 4002, 4003, 4004, 4005];
    list.push(`${origin}/api`);
    ports.forEach((p) => {
      list.push(`${protocol}//localhost:${p}/api`);
      list.push(`${protocol}//127.0.0.1:${p}/api`);
      list.push(`${protocol}//${hostname}:${p}/api`);
    });
  }
  list.push("http://localhost:4000/api");
  return Array.from(new Set(list));
};

const candidateBases = buildCandidateBases();
const createApi = (baseURL) =>
  axios.create({
    baseURL,
    withCredentials: true,
  });

const infoRow = (label, value) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
      {label}
    </span>
    <span className="text-base text-slate-800 font-medium">{value || "Not specified"}</span>
  </div>
);

const SummaryCard = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex flex-col gap-2 min-w-[180px]">
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500">
        {icon}
      </span>
      <span>{title}</span>
    </div>
    <div className="text-3xl font-bold text-slate-900 leading-none">{value}</div>
    {subtitle && (
      <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">
        {subtitle}
      </div>
    )}
  </div>
);

// Helper to render a list of tags (for vulnerabilities, medical, etc.)
const TagList = ({ items, emptyText = "None recorded" }) => {
  let list = [];
  if (Array.isArray(items)) {
    list = items;
  } else if (typeof items === "string" && items.trim().length > 0) {
    list = items.split(",").map((i) => i.trim());
  }

  if (list.length === 0) {
    return <span className="text-slate-500 italic">{emptyText}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item, idx) => (
        <span
          key={idx}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-50 text-slate-700 border border-slate-200 font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

export default function ServiceUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiRef = useRef(createApi(candidateBases[0]));
  const [apiBase, setApiBase] = useState(candidateBases[0]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const resolveApiBase = async () => {
      let lastError = null;
      for (const base of candidateBases) {
        try {
          await axios.get(`${base}/health`, { timeout: 1500, withCredentials: true });
          if (!mounted) return null;
          apiRef.current = createApi(base);
          setApiBase(base);
          return base;
        } catch (err) {
          lastError = err;
        }
      }
      console.warn("ServiceUserProfile: no API base responded to /health", lastError?.message || lastError);
      return null;
    };

    async function load() {
      setLoading(true);
      setError("");
      try {
        await resolveApiBase();
        if (!mounted) return;
        const res = await apiRef.current.get(`/su/users/${id}`);
        // Handle response structure - axios wraps data in res.data
        const userData = res?.data || res;
        if (mounted) {
          console.log("Loaded user data:", userData);
          setUser(userData);
        }
      } catch (err) {
        console.error("Failed to load service user", err);
        if (mounted)
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load service user"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const formatDate = (value, opts = { day: "2-digit", month: "long", year: "numeric" }) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Not specified";
    return d.toLocaleDateString("en-GB", opts);
  };

  const computed = useMemo(() => {
    if (!user) {
      return { fullName: "", ageText: "—", property: "Not assigned" };
    }
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    let ageText = "Not specified";
    if (user.date_of_birth || user.dob) {
      const dob = new Date(user.date_of_birth || user.dob);
      if (!Number.isNaN(dob.getTime())) {
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        ageText = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
      }
    }

    const property =
      user.property ||
      user.hotel_name ||
      user.property_name ||
      user.hotel ||
      "Not assigned";

    return {
      fullName: fullName || "Service User",
      ageText,
      property,
    };
  }, [user]);

  // Handle family type, gender, and emergency contact data from the database
  // Normalize array/string/null values
  const familyType = user?.family_type 
    ? (Array.isArray(user.family_type) 
        ? (user.family_type[0] || user.family_type.join(", ") || "Not specified")
        : (String(user.family_type).trim() || "Not specified"))
    : "Not specified";
    
  const gender = user?.gender
    ? (Array.isArray(user.gender) 
        ? (user.gender[0] || "Not specified")
        : (String(user.gender).trim() || "Not specified"))
    : "Not specified";
    
  // Ensure dependents is a number
  const dependents = user?.number_of_dependents !== null && user?.number_of_dependents !== undefined
    ? Number(user.number_of_dependents) || 0
    : 0;
  
  // Handle emergency contact information - normalize arrays/strings
  const emergencyContactName = user?.emergency_contact_name
    ? (Array.isArray(user.emergency_contact_name)
        ? (user.emergency_contact_name[0] || user.emergency_contact_name.join(", ") || "Not specified")
        : (String(user.emergency_contact_name).trim() || "Not specified"))
    : "Not specified";
    
  const emergencyContactPhone = user?.emergency_contact_phone
    ? (Array.isArray(user.emergency_contact_phone)
        ? (user.emergency_contact_phone[0] || user.emergency_contact_phone.join(", ") || "Not specified")
        : (String(user.emergency_contact_phone).trim() || "Not specified"))
    : "Not specified";

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-500">Loading service user...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back
        </button>
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const documentsCount = user?.documents_count || user?.documents?.length || 0;
  const statusPill = (label, tone = "emerald") => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize bg-${tone}-50 text-${tone}-600`}
    >
      {label}
    </span>
  );

  return (
    <div className="p-8 bg-[#F5F7FB] min-h-screen font-sans text-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/su/users")}
            className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <span>←</span> Back to Service Users
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {computed.fullName}
            </h1>
            <p className="text-sm text-slate-500">
              HO Ref: {user.home_office_reference || "Not specified"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {statusPill(user.status || "active")}
            {user.gender && statusPill(user.gender, "cyan")}
            {user.immigration_status &&
              statusPill(user.immigration_status, "amber")}
          </div>
        </div>
        <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow">
          Move Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          title="Age"
          value={computed.ageText}
          subtitle={`DOB: ${formatDate(user.date_of_birth || user.dob, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
          }
        />
        <SummaryCard
          title="Property"
          value={computed.property}
          subtitle={user.room_number ? `Room ${user.room_number}` : "Room not assigned"}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21V5a2 2 0 0 1 2-2h6l10 4v14" />
              <path d="M4 11h6" />
              <path d="M9 21v-4h3v4" />
            </svg>
          }
        />
        <SummaryCard
          title="Family"
          value={dependents}
          subtitle={familyType}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="7" r="3" />
              <circle cx="17" cy="7" r="3" />
              <path d="M2 21v-2a5 5 0 0 1 5-5h4" />
              <path d="M22 21v-2a5 5 0 0 0-5-5h-4" />
            </svg>
          }
        />
        <SummaryCard
          title="Documents"
          value={documentsCount}
          subtitle="uploaded"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M10 11h4" />
              <path d="M10 16h4" />
            </svg>
          }
        />
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {["profile", "documents", "health", "checklists"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-semibold capitalize ${
              activeTab === tab
                ? "text-slate-900 border-b-2 border-emerald-500"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab === "health" ? "Health & Diet" : tab}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-500">
                    Basic demographic and contact information
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoRow("Full Name", computed.fullName)}
                {infoRow("Date of Birth", formatDate(user.date_of_birth || user.dob))}
                {infoRow("Gender", gender)}
                {infoRow("Nationality", user.nationality)}
                {infoRow("Immigration Status", user.immigration_status)}
                {infoRow("Home Office Reference", user.home_office_reference)}
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Family & Emergency Information
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Family structure and emergency contacts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoRow("FAMILY TYPE", familyType)}
                {infoRow("NUMBER OF DEPENDENTS", dependents.toString())}
                {infoRow("EMERGENCY CONTACT NAME", emergencyContactName)}
                {infoRow("EMERGENCY CONTACT PHONE", emergencyContactPhone)}
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Accommodation
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Current placement details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoRow("PROPERTY", computed.property === "Not assigned" ? "Not assigned" : computed.property)}
                {infoRow("MOVE-IN DATE", formatDate(user.admission_date))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "health" && (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Vulnerabilities
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Recorded vulnerabilities and risk factors
              </p>
              <TagList items={user.vulnerabilities} />
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Medical Conditions
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Known medical conditions and requirements
              </p>
              <TagList items={user.medical_conditions} />
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Dietary Requirements
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Specific dietary needs and allergies
              </p>
              <TagList items={user.dietary_requirements} />
            </section>
          </div>
        )}

        {(activeTab === "documents" || activeTab === "checklists") && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center text-slate-400">
            {activeTab === "documents"
              ? "Document management coming soon."
              : "Checklist management coming soon."}
          </div>
        )}
      </div>
    </div>
  );
}