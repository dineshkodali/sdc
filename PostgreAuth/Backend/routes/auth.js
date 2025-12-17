// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect, requireRole } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Read admin.json safely
const adminPath = path.join(__dirname, "../config/admin.json");
const admin = JSON.parse(fs.readFileSync(adminPath, "utf-8"));
const router = express.Router();

// Dev-friendly cookie options.
// In production, set sameSite: 'None' and secure: true (and serve over HTTPS).
// For local development, returning the token in the JSON response is the most
// reliable way to test with curl or Authorization headers.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // only true in production (https)
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Lax in dev
  path: "/", // ensure cookie is sent to all routes on the domain
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

/* ---------- DEBUG: show token and decoded (non-production only) ---------- */
if (process.env.NODE_ENV !== "production") {
  router.get("/debug-token", (req, res) => {
    try {
      // Check cookie first, then Authorization header
      const cookieToken = req.cookies?.token || null;
      const header =
        req.header("Authorization") || req.header("authorization") || null;
      let token = cookieToken;

      if (!token && header) {
        // header may be "Bearer <token>" or just "<token>"
        token = header.toLowerCase().startsWith("bearer ")
          ? header.slice(7).trim()
          : header;
      }

      let decoded = null;
      if (token) {
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
          decoded = { error: e.message };
        }
      }

      return res.json({
        cookiePresent: !!cookieToken,
        headerPresent: !!header,
        tokenPreview: token ? `${String(token).slice(0, 80)}...` : null,
        decoded,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || String(err) });
    }
  });
}

/* ---------- REGISTER ---------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "staff", branch } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    // Managers require approval -> pending; staff are active immediately
    const status = role === "manager" ? "pending" : "active";

    const insert = await pool.query(
      `INSERT INTO users (name, email, password, role, status, branch)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, status, branch`,
      [name, email, hashed, role, status, branch || null]
    );

    // If account is active, set cookie (auto-login). Pending accounts are not logged in.
    if (status === "active") {
      const token = generateToken(insert.rows[0].id);
      // set cookie for browser sessions
      res.cookie("token", token, cookieOptions);
      // return token in body for dev/testing convenience
      return res.status(201).json({ user: insert.rows[0], token });
    }

    return res.status(201).json({ user: insert.rows[0] });
  } catch (err) {
    console.error("Register error:", err?.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ---------- LOGIN ---------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Please provide email and password" });

    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];

      if (user.status !== "active") {
        return res
          .status(403)
          .json({ message: "Account not active. Await approval." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = generateToken(user.id);
      // set cookie for browser sessions
      res.cookie("token", token, cookieOptions);

      const { id, name, email: e, role, branch } = user;
      // return token in body as well (useful for debugging and for Authorization header tests)
      return res.json({ user: { id, name, email: e, role, branch }, token });
    }

    // fallback to env-based admin if configured
    // fallback to admin.json based admin
    if (admin && admin.email && admin.password) {
      if (email === admin.email && password === admin.password) {
        const syntheticAdmin = {
          id: "admin-synthetic",
          name: admin.name || "Site Admin",
          email: admin.email,
          role: admin.role || "admin",
        };

        const token = generateToken(syntheticAdmin.id);
        res.cookie("token", token, cookieOptions);

        return res.json({ user: syntheticAdmin, token });
      }
    }

    return res.status(400).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error("Login error:", err?.message || err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ---------- ME ---------- */
router.get("/me", protect, async (req, res) => {
  const { id, name, email, role, branch } = req.user;
  res.json({ id, name, email, role, branch });
});

/* ---------- LOGOUT ---------- */
router.post("/logout", (req, res) => {
  // Expire cookie immediately
  res.cookie("token", "", { ...cookieOptions, maxAge: 1 });
  res.json({ message: "Logged out successfully" });
});

/* ---------- ADMIN: pending managers ---------- */
router.get(
  "/admin/pending-managers",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, email, branch, status, created_at FROM users WHERE role = 'manager' AND status = 'pending' ORDER BY created_at DESC"
      );
      return res.json({ pending: result.rows });
    } catch (err) {
      console.error("pending-managers:", err?.message || err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/admin/approve-manager/:id",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      await pool.query(
        "UPDATE users SET status = 'active' WHERE id = $1 AND role = 'manager'",
        [id]
      );
      return res.json({ message: "Manager approved" });
    } catch (err) {
      console.error("approve-manager:", err?.message || err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/admin/reject-manager/:id",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      await pool.query(
        "UPDATE users SET status = 'rejected' WHERE id = $1 AND role = 'manager'",
        [id]
      );
      return res.json({ message: "Manager rejected" });
    } catch (err) {
      console.error("reject-manager:", err?.message || err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ---------- ADMIN: add-member ---------- */
router.post(
  "/admin/add-member",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name, email, password, role = "staff", branch = null } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Please provide name, email and password" });
      }

      if (role === "admin") {
        return res
          .status(403)
          .json({ message: "Cannot create admin via this endpoint" });
      }

      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const status = "active";

      const insert = await pool.query(
        `INSERT INTO users (name, email, password, role, status, branch)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, branch, status`,
        [name, email, hashed, role, status, branch]
      );

      return res
        .status(201)
        .json({ user: insert.rows[0], message: "Member created successfully" });
    } catch (err) {
      console.error("admin add-member:", err?.message || err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
