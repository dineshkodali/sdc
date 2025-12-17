// backend/routes/aire-tasks.js
// CRUD for aire_tasks table (AIRE work orders and tasks)

import express from "express";
import pool from "../config/db.js";
import { protect as authProtect } from "../middleware/auth.js";

const router = express.Router();
const protect = typeof authProtect === "function" ? authProtect : (req, res, next) => next();

/* -----------------------
   Helper: coerce text or null
   ----------------------- */
function toText(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/* -----------------------
   Helper: generate unique reference number
   Format: AIRE-YYYY-<7 random hex chars>
   ----------------------- */
function genAIREReference() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(16).substr(2, 8);
  return `AIRE-${year}-${rand}`;
}

/* -----------------------
   GET /api/aire-tasks
   Optional query: status, priority, assigned_to_id, property_id, category, due_date, limit, offset
   ----------------------- */
router.get("/", protect, async (req, res) => {
  try {
    const { status, priority, assigned_to_id, property_id, category, due_date } = req.query || {};
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const params = [];
    const where = [];

    if (status !== undefined) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (priority !== undefined) {
      params.push(priority);
      where.push(`priority = $${params.length}`);
    }
    if (assigned_to_id !== undefined) {
      params.push(assigned_to_id);
      where.push(`assigned_to_id = $${params.length}`);
    }
    if (property_id !== undefined) {
      params.push(property_id);
      where.push(`property_id = $${params.length}`);
    }
    if (category !== undefined) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (due_date !== undefined) {
      params.push(due_date);
      where.push(`due_date = $${params.length}`);
    }

    let sql = `SELECT id, reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, service_user_id, property_id, property_name, due_date, scheduled_date, completed_date, notes, category, tags, created_at, updated_at FROM public.aire_tasks`;
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    params.push(limit);
    params.push(offset);

    const r = await pool.query(sql, params);
    return res.json(r.rows || []);
  } catch (err) {
    console.error("GET /api/aire-tasks error:", err && (err.stack || err));
    return res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

/* -----------------------
   GET /api/aire-tasks/:id
   ----------------------- */
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `SELECT id, reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, service_user_id, property_id, property_name, due_date, scheduled_date, completed_date, notes, attachments, category, tags, created_by_id, created_at, updated_at FROM public.aire_tasks WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ message: "AIRE task not found" });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error(`GET /api/aire-tasks/${req.params.id} error:`, err && (err.stack || err));
    return res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

/* -----------------------
   POST /api/aire-tasks
   Body: { task_type, title, description, priority?, status?, assigned_to_id?, assigned_to_name?, service_user_id?, property_id?, property_name?, due_date?, notes?, category?, tags? }
   ----------------------- */
router.post("/", protect, async (req, res) => {
  try {
    const {
      task_type = null,
      title,
      description = null,
      priority = "Medium",
      status = "Pending",
      assigned_to_id = null,
      assigned_to_name = null,
      service_user_id = null,
      property_id = null,
      property_name = null,
      due_date = null,
      scheduled_date = null,
      notes = null,
      category = "AIRE",
      tags = null,
      created_by_id = null,
    } = req.body || {};

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    const reference = genAIREReference();

    const q = `
      INSERT INTO public.aire_tasks
        (reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, service_user_id, property_id, property_name, due_date, scheduled_date, notes, category, tags, created_by_id, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now())
      RETURNING id, reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, service_user_id, property_id, property_name, due_date, scheduled_date, completed_date, notes, category, tags, created_at, updated_at
    `;

    const vals = [reference, task_type, title, description, priority, status, assigned_to_id, toText(assigned_to_name), service_user_id, property_id, toText(property_name), due_date, scheduled_date, toText(notes), category, toText(tags), created_by_id];

    const result = await pool.query(q, vals);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/aire-tasks error:", err && (err.stack || err));
    return res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

/* -----------------------
   PATCH /api/aire-tasks/:id
   Accept partial updates
   ----------------------- */
router.patch("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      task_type,
      title,
      description,
      priority,
      status,
      assigned_to_id,
      assigned_to_name,
      service_user_id,
      property_id,
      property_name,
      due_date,
      scheduled_date,
      completed_date,
      notes,
      attachments,
      category,
      tags,
    } = req.body || {};

    const fields = [];
    const params = [];
    let idx = 1;

    if (task_type !== undefined) { fields.push(`task_type = $${idx++}`); params.push(task_type); }
    if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }
    if (priority !== undefined) { fields.push(`priority = $${idx++}`); params.push(priority); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); params.push(status); }
    if (assigned_to_id !== undefined) { fields.push(`assigned_to_id = $${idx++}`); params.push(assigned_to_id); }
    if (assigned_to_name !== undefined) { fields.push(`assigned_to_name = $${idx++}`); params.push(toText(assigned_to_name)); }
    if (service_user_id !== undefined) { fields.push(`service_user_id = $${idx++}`); params.push(service_user_id); }
    if (property_id !== undefined) { fields.push(`property_id = $${idx++}`); params.push(property_id); }
    if (property_name !== undefined) { fields.push(`property_name = $${idx++}`); params.push(toText(property_name)); }
    if (due_date !== undefined) { fields.push(`due_date = $${idx++}`); params.push(due_date); }
    if (scheduled_date !== undefined) { fields.push(`scheduled_date = $${idx++}`); params.push(scheduled_date); }
    if (completed_date !== undefined) { fields.push(`completed_date = $${idx++}`); params.push(completed_date); }
    if (notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(toText(notes)); }
    if (attachments !== undefined) { fields.push(`attachments = $${idx++}`); params.push(toText(attachments)); }
    if (category !== undefined) { fields.push(`category = $${idx++}`); params.push(category); }
    if (tags !== undefined) { fields.push(`tags = $${idx++}`); params.push(toText(tags)); }

    if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });

    params.push(id);
    const sql = `UPDATE public.aire_tasks SET ${fields.join(", ")}, updated_at = now() WHERE id = $${idx} RETURNING id, reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, service_user_id, property_id, property_name, due_date, scheduled_date, completed_date, notes, category, tags, created_at, updated_at`;

    const result = await pool.query(sql, params);
    if (!result.rows[0]) return res.status(404).json({ message: "AIRE task not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(`PATCH /api/aire-tasks/${req.params.id} error:`, err && (err.stack || err));
    return res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

/* -----------------------
   DELETE /api/aire-tasks/:id
   ----------------------- */
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM public.aire_tasks WHERE id = $1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ message: "AIRE task not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(`DELETE /api/aire-tasks/${req.params.id} error:`, err && (err.stack || err));
    return res.status(500).json({ message: "Server error", detail: err?.message });
  }
});

export default router;
