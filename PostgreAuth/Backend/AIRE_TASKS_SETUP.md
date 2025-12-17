# AIRE Tasks Setup Guide

## Overview
AIRE Tasks is a work order management system for tracking accommodation-related tasks and operations. This guide provides all necessary setup commands and instructions.

## Database Setup

### 1. Connect to PostgreSQL

```bash
# Using psql (command line)
psql -U postgres -h localhost

# Or if you have a specific connection string:
psql "postgresql://username:password@localhost:5432/your_database"
```

### 2. Create the AIRE Tasks Table

Run the SQL script to create the table with all necessary indexes:

```bash
# Using psql with the script file
psql -U postgres -h localhost -d your_database -f Backend/scripts/create_aire_tasks_table.sql
```

**OR manually execute the SQL:**

```sql
-- Copy and paste this entire SQL block into psql or your database client:

CREATE TABLE IF NOT EXISTS public.aire_tasks (
    id SERIAL PRIMARY KEY,
    
    reference VARCHAR(255) NOT NULL UNIQUE,
    task_type VARCHAR(100),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Pending',
    
    assigned_to_id INTEGER,
    assigned_to_name VARCHAR(255),
    
    service_user_id INTEGER,
    property_id INTEGER,
    property_name VARCHAR(255),
    
    due_date DATE,
    scheduled_date DATE,
    completed_date TIMESTAMP,
    
    notes TEXT,
    attachments TEXT,
    category VARCHAR(100),
    tags TEXT,
    
    created_by_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_service_user FOREIGN KEY (service_user_id) REFERENCES public.service_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES public.hotels(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_aire_tasks_status ON public.aire_tasks(status);
CREATE INDEX idx_aire_tasks_priority ON public.aire_tasks(priority);
CREATE INDEX idx_aire_tasks_assigned_to ON public.aire_tasks(assigned_to_id);
CREATE INDEX idx_aire_tasks_property ON public.aire_tasks(property_id);
CREATE INDEX idx_aire_tasks_service_user ON public.aire_tasks(service_user_id);
CREATE INDEX idx_aire_tasks_due_date ON public.aire_tasks(due_date);
CREATE INDEX idx_aire_tasks_category ON public.aire_tasks(category);
CREATE INDEX idx_aire_tasks_created_at ON public.aire_tasks(created_at DESC);

-- Verify table creation
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aire_tasks';
```

### 3. Verify Table Creation

```sql
-- Check if the table exists and view its structure
\d public.aire_tasks

-- Or query the information schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'aire_tasks' 
ORDER BY ordinal_position;
```

## Backend API Endpoints

### Files Created/Modified

1. **Backend/routes/aire-tasks.js** - Complete CRUD operations
2. **Backend/server.js** - Route wiring (already done)
3. **Backend/scripts/create_aire_tasks_table.sql** - Database DDL

### API Endpoints

#### List All AIRE Tasks
```
GET /api/aire-tasks
Query Parameters (optional):
  - status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue'
  - priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  - assigned_to_id: <integer>
  - property_id: <integer>
  - category: 'AIRE' | 'Compliance' | etc.
  - due_date: <YYYY-MM-DD>
  - limit: <integer, default 100>
  - offset: <integer, default 0>

Example:
GET /api/aire-tasks?status=Pending&priority=High&limit=50
```

#### Get Single AIRE Task
```
GET /api/aire-tasks/:id

Example:
GET /api/aire-tasks/1
```

#### Create AIRE Task
```
POST /api/aire-tasks
Content-Type: application/json

Body:
{
  "task_type": "Passport & VISA Verification",
  "title": "Verify John Doe's VISA Status",
  "description": "Operation work required as per inspection report.",
  "priority": "High",
  "status": "Pending",
  "assigned_to_id": 5,
  "assigned_to_name": "John Smith",
  "service_user_id": 12,
  "property_id": 3,
  "property_name": "Garden House Hotel",
  "due_date": "2025-12-20",
  "notes": "Follow up needed",
  "category": "AIRE",
  "tags": "urgent,visa"
}

Response: 201 Created + task object with generated reference and ID
```

#### Update AIRE Task (Partial)
```
PATCH /api/aire-tasks/:id
Content-Type: application/json

Body (all fields optional):
{
  "status": "In Progress",
  "assigned_to_id": 6,
  "assigned_to_name": "Jane Doe",
  "priority": "Urgent",
  "notes": "Work started on site",
  "completed_date": "2025-12-15T14:30:00Z"
}

Example:
PATCH /api/aire-tasks/1
```

#### Delete AIRE Task
```
DELETE /api/aire-tasks/:id

Example:
DELETE /api/aire-tasks/1

Response: 200 OK { "message": "Deleted" }
```

## Testing the API

### Using cURL

#### Create a task
```bash
curl -X POST http://localhost:4000/api/aire-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "Resident Data Update",
    "title": "Update resident records for Q4",
    "description": "Operation work required as per inspection report.",
    "priority": "Medium",
    "assigned_to_id": 1,
    "property_id": 1,
    "property_name": "Crown Lodge Hotel",
    "due_date": "2025-12-25",
    "category": "AIRE"
  }'
```

#### List all tasks
```bash
curl http://localhost:4000/api/aire-tasks
```

#### List tasks with filters
```bash
curl "http://localhost:4000/api/aire-tasks?status=Pending&priority=High&limit=10"
```

#### Get single task
```bash
curl http://localhost:4000/api/aire-tasks/1
```

#### Update a task
```bash
curl -X PATCH http://localhost:4000/api/aire-tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "priority": "Urgent"
  }'
```

#### Delete a task
```bash
curl -X DELETE http://localhost:4000/api/aire-tasks/1
```

## Starting the Backend

```bash
# Navigate to project root
cd C:\PostgreAuth

# Start backend in dev mode (with nodemon)
npm --prefix Backend run dev

# Or start in production mode
npm --prefix Backend run start

# Start both backend and frontend
npm run dev
```

## Database Schema Details

### aire_tasks Table Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| reference | VARCHAR(255) | NOT NULL, UNIQUE | Auto-generated reference (AIRE-2025-abc123) |
| task_type | VARCHAR(100) | | Type of task (e.g., Passport Verification) |
| title | VARCHAR(255) | NOT NULL | Task title/summary |
| description | TEXT | | Detailed task description |
| priority | VARCHAR(50) | DEFAULT 'Medium' | Low, Medium, High, Urgent |
| status | VARCHAR(50) | DEFAULT 'Pending' | Pending, In Progress, Completed, Overdue |
| assigned_to_id | INTEGER | FK to users | Employee/staff member ID |
| assigned_to_name | VARCHAR(255) | | Denormalized name for quick display |
| service_user_id | INTEGER | FK to service_users | Related service user (optional) |
| property_id | INTEGER | FK to hotels | Property/hotel ID |
| property_name | VARCHAR(255) | | Denormalized property name |
| due_date | DATE | | Task due date |
| scheduled_date | DATE | | Scheduled work date |
| completed_date | TIMESTAMP | | Actual completion timestamp |
| notes | TEXT | | Additional notes/comments |
| attachments | TEXT | | JSON or comma-separated file URLs |
| category | VARCHAR(100) | | Task category (e.g., AIRE, Compliance) |
| tags | TEXT | | Comma-separated tags for filtering |
| created_by_id | INTEGER | | User who created the task |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Record last update time |

### Indexes Created

- `idx_aire_tasks_status` - For filtering by status
- `idx_aire_tasks_priority` - For filtering by priority
- `idx_aire_tasks_assigned_to` - For finding tasks by assignee
- `idx_aire_tasks_property` - For finding tasks by property
- `idx_aire_tasks_service_user` - For finding tasks by service user
- `idx_aire_tasks_due_date` - For due date queries
- `idx_aire_tasks_category` - For category filtering
- `idx_aire_tasks_created_at` - For chronological sorting

## Troubleshooting

### Table not found error
```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'aire_tasks';

-- If not found, run the CREATE TABLE script again
```

### Foreign key constraint errors
```sql
-- Verify related tables exist
SELECT * FROM information_schema.tables WHERE table_name IN ('users', 'service_users', 'hotels');

-- Check referenced IDs exist
SELECT id FROM public.users WHERE id = <assigned_to_id>;
SELECT id FROM public.hotels WHERE id = <property_id>;
```

### Connection issues
```bash
# Verify PostgreSQL is running
# Check environment variables in .env file
# Ensure DB credentials are correct
# Test connection
psql -U postgres -h localhost -c "SELECT 1;"
```

## Sample Inserts

Insert sample AIRE tasks for testing:

```sql
INSERT INTO public.aire_tasks (reference, task_type, title, description, priority, status, assigned_to_id, assigned_to_name, property_id, property_name, due_date, category)
VALUES
  ('AIRE-2025-a1b2c3d4', 'Passport & VISA Verification', 'Verify VISA status', 'Operation work required as per inspection report.', 'High', 'Completed', 1, 'John Smith', 1, 'Crown Lodge Hotel', '2025-02-08', 'AIRE'),
  ('AIRE-2025-e5f6g7h8', 'Resident Data Update', 'Update all resident records', 'Operation work required as per inspection report.', 'Medium', 'Pending', NULL, 'Unassigned', 2, 'Garden House Hotel', '2025-09-26', 'AIRE'),
  ('AIRE-2025-i9j0k1l2', 'AIRE Annual Reporting', 'Complete annual report', 'Operation work required as per inspection report.', 'Low', 'In Progress', 2, 'Jane Doe', 1, 'Crown Lodge Hotel', '2025-06-02', 'AIRE'),
  ('AIRE-2025-m3n4o5p6', 'Immigrant Status Validation', 'Validate status', 'Operation work required as per inspection report.', 'Urgent', 'Completed', 3, 'Bob Wilson', 3, 'Seaview Hotel', '2025-03-17', 'AIRE');

-- Verify inserts
SELECT id, reference, title, status, priority FROM public.aire_tasks;
```

## Next Steps

1. ✅ Database table created
2. ✅ Backend CRUD routes implemented
3. ✅ Routes wired into server
4. 🔄 Frontend integration with AIRETasks.jsx component (already created, just connect to /api/aire-tasks)
5. Future: Add role-based access control, audit logging, file attachments

## Additional Notes

- The `reference` field is auto-generated in `AIRE-YYYY-<random_hex>` format
- All timestamps use timezone-aware PostgreSQL TIMESTAMP WITH TIME ZONE
- Soft deletes are not implemented (actual deletion occurs)
- Status and Priority are stored as VARCHAR for flexibility (can be changed to ENUM if needed)
- The denormalized fields (`assigned_to_name`, `property_name`) help avoid N+1 queries in the UI

