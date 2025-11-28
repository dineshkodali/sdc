// middleware/auth.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * detectUsersHotelColumn
 * Checks common column names used to store staff -> hotel assignment
 * in the users table. Returns the found column name or null.
 */
async function detectUsersHotelColumn() {
  const candidates = ["hotel_id", "hotelId", "hotel", "hotelid"];
  for (const col of candidates) {
    try {
      const r = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = $1 LIMIT 1`,
        [col]
      );
      if (r.rows && r.rows.length) return col;
    } catch (err) {
      console.warn("detectUsersHotelColumn check failed for", col, err && err.message);
    }
  }
  return null;
}

/**
 * protect (diagnostic)
 */
export const protect = async (req, res, next) => {
  try {
    // Accept token from cookie, Authorization header, query param, or request body.
    let tokenSource = null;
    let token =
      (req.cookies && req.cookies.token) ||
      null;

    if (token) tokenSource = "cookie";

    if (!token) {
      const header = req.header("Authorization") || req.header("authorization") || null;
      if (header) {
        tokenSource = "header";
        token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : header;
      }
    }

    if (!token && req.query && req.query.token) {
      tokenSource = "query";
      token = req.query.token;
    }

    if (!token && req.body && req.body.token) {
      tokenSource = "body";
      token = req.body.token;
    }

    if (!token) {
      console.warn("Auth: no token found in cookie/header/query/body");
      return res.status(401).json({ message: "Not authorized — no token" });
    }

    // preview token (not full) for logs - avoid printing secret content but show structure
    const preview = String(token).slice(0, 40) + (String(token).length > 40 ? "..." : "");
    console.info(`Auth: token found (source=${tokenSource}) preview=${preview}`);

    // Attempt to decode payload part (not verification) to show id/exp if present
    try {
      const parts = String(token).split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
        console.info("Auth: token payload (decoded):", { id: payload.id, exp: payload.exp, iat: payload.iat });
      } else {
        console.info("Auth: token does not appear to be a JWT (parts != 3)");
      }
    } catch (decErr) {
      console.warn("Auth: failed to base64-decode token payload (might be malformed):", decErr && decErr.message);
    }

    // verify the token - this is the real failure point in your logs
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyErr) {
      console.error("Auth: JWT verification failed:", verifyErr && verifyErr.message, { stack: verifyErr && verifyErr.stack ? verifyErr.stack.split("\n")[0] : undefined });
      return res.status(401).json({ message: "Not authorized — token failed" });
    }

    // synthetic admin fallback
    if (decoded?.id === "admin-synthetic") {
      req.user = {
        id: decoded.id,
        name: process.env.ADMIN_NAME || "Site Admin",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        role: "admin",
        status: "active",
      };
      return next();
    }

    // Detect hotel assignment column and include it as hotel_id if present
    const hotelCol = await detectUsersHotelColumn();
    const baseCols = ["id", "name", "email", "role", "status", "branch"];
    if (hotelCol) {
      baseCols.push(`"${hotelCol}" as hotel_id`);
    }

    const q = `SELECT ${baseCols.join(", ")} FROM users WHERE id = $1`;
    const userRes = await pool.query(q, [decoded.id]);

    if (!userRes.rows.length) {
      console.warn("Auth: token verified but user not found:", decoded.id);
      return res.status(401).json({ message: "Not authorized — user not found" });
    }

    const user = userRes.rows[0];
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account not active. Await approval." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth protect unexpected error:", err && err.stack ? err.stack : err);
    return res.status(401).json({ message: "Not authorized — token failed" });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden — insufficient rights" });
  }
  next();
};
