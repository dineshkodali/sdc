// C:\PostgreAuth\Backend\server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import managerRoutes from "./routes/manager.js";
import staffRoutes from "./routes/staff.js";
import hotelsRoutes from "./routes/hotels.js";
import roomsRoutes from "./routes/rooms.js";
import profileRoutes from "./routes/profile.js";
import holidaysRoutes from "./routes/holidays.js";
import ticketsRoutes from "./routes/tickets.js"; // <-- mounted tickets routes

dotenv.config();

const app = express();

console.log("Starting server (server.js) - NODE_ENV:", process.env.NODE_ENV || "development");

/* ----------------------------
   Basic middleware
   ---------------------------- */

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ----------------------------
   Prevent caching for API endpoints
   ---------------------------- */
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* ----------------------------
   Static uploads directory
   ---------------------------- */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use("/uploads", express.static(UPLOAD_DIR));
  console.log("✅ Upload dir available at /uploads ->", UPLOAD_DIR);
} catch (err) {
  console.error("Failed to ensure upload directory:", err);
}

/* ----------------------------
   Defensive route mounting helper
   ---------------------------- */
/**
 * mountRoute(mountPath, router, name)
 * - accepts express Router or any handler function
 * - logs success or clear warning when skipped
 */
function mountRoute(mountPath, router, name = mountPath) {
  if (!router) {
    console.warn(`⚠️  Route for ${name} is undefined or null — skipping mount at ${mountPath}`);
    return;
  }

  // Express Router often has `.handle` and `.stack` properties, or is a function
  const isRouter =
    typeof router === "function" ||
    (router && (typeof router.handle === "function" || Array.isArray(router.stack)));

  if (!isRouter) {
    console.warn(`⚠️  Provided route for ${name} at ${mountPath} doesn't look like an Express router — skipping.`);
    console.warn("Provided value:", typeof router, router && Object.keys(router).slice(0, 10));
    return;
  }

  app.use(mountPath, router);
  console.log(`✅ Mounted ${name} at ${mountPath}`);
}

/* ----------------------------
   Route mounting (safe)
   ---------------------------- */
mountRoute("/api/auth", authRoutes, "authRoutes");
mountRoute("/api/admin", adminRoutes, "adminRoutes");
mountRoute("/api/manager", managerRoutes, "managerRoutes");
mountRoute("/api/staff", staffRoutes, "staffRoutes");
// hotels and rooms: keep separate mount points so rooms doesn't override hotels
mountRoute("/api/hotels", hotelsRoutes, "hotelsRoutes");

// <<<<<<<<<<<<<< FIXED: mount rooms with :hotelId so rooms router sees req.params.hotelId >>>>>>>>
mountRoute("/api/hotels/:hotelId/rooms", roomsRoutes, "roomsRoutes");
// <<<<<<<<<<<<<< end fix >>>>>>>>>>>>

// Holidays
mountRoute("/api/holidays", holidaysRoutes, "holidaysRoutes");

// Tickets (new)
mountRoute("/api/tickets", ticketsRoutes, "ticketsRoutes");

// profile (keep last so it doesn't shadow other mounts)
mountRoute("/api/profile", profileRoutes, "profileRoutes");

/* ----------------------------
   Health check & 404
   ---------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// explicit API 404 (logged)
app.use("/api", (req, res) => {
  console.warn(`🔍 API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "API route not found" });
});

/* ----------------------------
   Global error handler
   ---------------------------- */
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Server error" });
});

/* ----------------------------
   Start server with robust logging
   ---------------------------- */
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// handle server errors (e.g., EADDRINUSE)
server.on("error", (err) => {
  console.error("Server error during listen:", err && err.stack ? err.stack : err);
});

/* ----------------------------
   Process-level handlers
   ---------------------------- */

process.on("unhandledRejection", (reason, p) => {
  console.error("❌ Unhandled Rejection at:", p, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err && err.stack ? err.stack : err);
});

/* ----------------------------
   Graceful shutdown signal handlers
   ---------------------------- */
function shutdown(signal) {
  console.log(`Received ${signal}. Closing HTTP server and exiting...`);
  server.close(() => {
    console.log("HTTP server closed. Exiting process.");
    process.exit(0);
  });

  // force exit after 10s if server doesn't close
  setTimeout(() => {
    console.warn("Forcing shutdown.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
