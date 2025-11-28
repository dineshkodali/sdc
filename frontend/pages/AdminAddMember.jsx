/* eslint-disable no-unused-vars */
// src/pages/AdminAddMember.jsx
import React, { useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function AdminAddMember() {
  // read user from AdminLayout outlet context
  const { user } = useOutletContext() || {};

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please provide name, email and password.");
      return;
    }

    setLoading(true);
    try {
      // backend expects: { name, email, password, role, branch }
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        branch: form.branch || null,
      };

      const res = await axios.post("/api/auth/admin/add-member", payload, { withCredentials: true });

      if (res?.status === 201 || (res?.data && res.data.user)) {
        setSuccess("Member created successfully.");
        setForm({ name: "", email: "", password: "", role: "staff", branch: "" });
      } else {
        setSuccess("Member created (server returned non-standard response).");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create member";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-9xl mx-auto">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-4">Add Member</h2>

          <div className="max-w-xl bg-white p-6 rounded-lg shadow-sm">
            {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="mb-4 text-green-700 bg-green-50 p-2 rounded">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border p-2"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border p-2"
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border p-2"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 rounded border"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700">Branch / Estate (optional)</label>
                  <input
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border p-2"
                    placeholder="Branch name (optional)"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Member"}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ name: "", email: "", password: "", role: "staff", branch: "" })}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 text-xs text-gray-400">Note: Managers are created active here. If you prefer 'pending' workflow for managers, adjust backend accordingly.</div>
        </div>
      </div>
    </div>
  );
}
