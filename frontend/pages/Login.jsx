/* eslint-disable no-unused-vars */
// src/pages/Login.jsx
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      // Use relative path (works well with Vite proxy) and send credentials so cookie is set
      const res = await axios.post("/api/auth/login", form, { withCredentials: true });

      // backend returns { user: {...} } (and may return token for debugging)
      const user = res?.data?.user ?? res?.data;
      if (!user) {
        setError("Login failed: unexpected server response.");
        setLoading(false);
        return;
      }

      // Save user in app state and localStorage
      setUser(user);
      try {
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        // ignore storage errors
      }

      // Always redirect to Home ("/") for all roles
      navigate("/");

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed — check credentials or server";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-pink-50 to-yellow-50 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white/90 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>

        {error && <div className="text-red-600 bg-red-50 p-2 mb-4 rounded">{error}</div>}

        <label className="block mb-3">
          <span className="text-sm text-gray-700">Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border p-2"
            required
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-700">Password</span>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border p-2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
