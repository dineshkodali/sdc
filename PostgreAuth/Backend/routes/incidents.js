import express from 'express';
import poolImport from '../config/db.js';
const router = express.Router();
const pool = poolImport && poolImport.default ? poolImport.default : poolImport;

let incidentsTableReady = false;
async function ensureIncidentsTable() {
  if (incidentsTableReady) return true;
  try {
    const check = await pool.query(`SELECT to_regclass('public.incidents') AS exists`);
    if (check.rows?.[0]?.exists) {
      incidentsTableReady = true;
      return true;
    }
    console.warn('incidents table missing. Creating it now...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(255) NOT NULL,
        severity VARCHAR(50) DEFAULT 'Medium',
        property_id INTEGER,
        property_name VARCHAR(255),
        service_user_id INTEGER,
        description TEXT,
        reported_by VARCHAR(255),
        reported_date DATE,
        assigned_to VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`);
    incidentsTableReady = true;
    return true;
  } catch (err) {
    console.error('Failed to ensure incidents table:', err?.message || err);
    return false;
  }
}

function makeReference() {
  const rnd = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `INC-${year}-${rnd}`;
}

/* LIST */
router.get('/', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { limit = 200, offset = 0 } = req.query;
    const { rows } = await pool.query(`SELECT * FROM incidents ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/incidents error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* GET */
router.get('/:id', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM incidents WHERE id = $1 LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/incidents/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* CREATE */
router.post('/', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });

    // Accept snake_case or camelCase from clients
    const reference = req.body.reference ?? req.body.ref ?? null;
    const type = req.body.type ?? req.body.incidentType ?? null;
    const severity = req.body.severity ?? req.body.severityLevel ?? null;
    const description = req.body.description ?? req.body.desc ?? null;
    const reported_by = req.body.reported_by ?? req.body.reportedBy ?? null;
    const reported_date = req.body.reported_date ?? req.body.reportedDate ?? null;
    const assigned_to = req.body.assigned_to ?? req.body.assignedTo ?? null;
    const status = req.body.status ?? null;

    // property id may be sent as property_id or propertyId or property
    const propertyId = req.body.property_id ?? req.body.propertyId ?? req.body.property ?? null;
    const serviceUserId = req.body.service_user_id ?? req.body.serviceUserId ?? req.body.serviceUser ?? null;
    const propertyNameBody = req.body.property_name ?? req.body.propertyName ?? null;

    if (!type || !propertyId || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields: type, property_id (or propertyId), description' });
    }

    const ref = reference || makeReference();

    const { rows: colRows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'");
    const existingCols = colRows.map(r => r.column_name);

    const columns = ['reference', 'type', 'severity', 'description', 'reported_by', 'reported_date', 'assigned_to', 'status'];
    const values = [ref, type, severity, description, reported_by || null, reported_date || null, assigned_to || null, status || 'Open'];

    // property id
    if (existingCols.includes('property_id') && propertyId !== null && propertyId !== undefined && propertyId !== '') {
      columns.push('property_id'); values.push(propertyId);
    }

    // property_name: prefer body value, else lookup hotels table by id, else fallback to string(propertyId)
    if (existingCols.includes('property_name')) {
      let propName = propertyNameBody ?? null;
      if (!propName && propertyId) {
        try {
          const r = await pool.query('SELECT name FROM hotels WHERE id = $1 LIMIT 1', [propertyId]);
          if (r.rows && r.rows[0] && r.rows[0].name) propName = r.rows[0].name;
        } catch (e) {
          // ignore lookup errors
        }
      }
      if (!propName) propName = String(propertyId ?? '');
      columns.push('property_name'); values.push(propName);
    }

    if (existingCols.includes('service_user_id') && serviceUserId) {
      columns.push('service_user_id'); values.push(serviceUserId);
    }

    const placeholders = columns.map((_, i) => `$${i+1}`).join(',');
    const query = `INSERT INTO incidents (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`;
    console.log('POST /api/incidents - executing query:', query);
    console.log('POST /api/incidents - values:', values);
    const { rows } = await pool.query(query, values);
    console.log('POST /api/incidents - inserted row:', rows[0]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('POST /api/incidents error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* UPDATE */
router.put('/:id', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });
    const { id } = req.params;

    const { rows: colRows } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'");
    const existingCols = colRows.map(r => r.column_name);

    const fields = ['reference','type','severity','property_id','property_name','service_user_id','description','reported_by','reported_date','assigned_to','status'];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const key of fields) {
      if (!existingCols.includes(key)) continue;
      const camel = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      let bodyValue = req.body[camel] !== undefined ? req.body[camel] : req.body[key];
      // special handling for property_name: accept propertyName/property_name/propertyId, and try hotel lookup
      if (key === 'property_name') {
        bodyValue = bodyValue ?? req.body.propertyName ?? req.body.property_name ?? null;
        if (!bodyValue) {
          const finalProperty = req.body.property ?? req.body.propertyId ?? req.body.property_id ?? null;
          if (finalProperty) {
            try {
              const r = await pool.query(`SELECT name FROM hotels WHERE id = $1 LIMIT 1`, [finalProperty]);
              if (r.rows && r.rows[0] && r.rows[0].name) bodyValue = r.rows[0].name;
            } catch (e) {
              // ignore lookup errors
            }
          }
        }
        if (bodyValue === null || bodyValue === undefined) {
          bodyValue = String(req.body.property ?? req.body.propertyId ?? req.body.property_id ?? "");
        }
      }
      if (bodyValue !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(bodyValue);
        idx++;
      }
    }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' });
    if (existingCols.includes('updated_at')) updates.push('updated_at = now()');
    const query = `UPDATE incidents SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(id);
    console.log('PUT /api/incidents - executing query:', query);
    console.log('PUT /api/incidents - values:', values);
    const { rows } = await pool.query(query, values);
    console.log('PUT /api/incidents - updated row:', rows[0]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /api/incidents/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* DELETE */
router.delete('/:id', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });
    const { id } = req.params;
    console.log('DELETE /api/incidents - id:', id);
    const { rows } = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [id]);
    console.log('DELETE /api/incidents - deleted row:', rows[0]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('DELETE /api/incidents/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* DIAGNOSTIC: returns DB info and where incidents table exists and counts per schema */
router.get('/_diagnose', async (req, res) => {
  try {
    const ready = await ensureIncidentsTable();
    if (!ready) return res.status(500).json({ success: false, message: 'Database not initialized' });
    const info = await pool.query(`SELECT current_database() AS db, current_user AS user, current_schema() AS schema`);
    const sp = await pool.query(`SHOW search_path`);
    const tables = await pool.query(`SELECT schemaname FROM pg_tables WHERE tablename = 'incidents'`);
    const schemas = tables.rows.map(r => r.schemaname);
    const counts = {};
    for (const s of schemas) {
      try {
        const c = await pool.query(`SELECT count(*)::int AS cnt FROM ${s}.incidents`);
        counts[s] = c.rows[0].cnt;
      } catch (e) {
        counts[s] = `error: ${String(e.message)}`;
      }
    }
    res.json({ success: true, db: info.rows[0], search_path: sp.rows[0].search_path, schemas, counts });
  } catch (err) {
    console.error('GET /api/incidents/_diagnose error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
