# College Gatepass Management System

Modern, interactive SaaS-style gatepass platform.

## Tech

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios, Recharts, Socket.IO client
- **Backend**: Node.js (Express), JWT auth, Socket.IO
- **Database**: MySQL

## Project structure

- `frontend/`: React web app
- `backend/`: Express REST API + Socket.IO

## Setup (local)

### 1) Database

Create a MySQL database and tables by running:

- **File**: `backend/src/db/schema.sql`

Quick way (MySQL CLI):

```bash
mysql -u root -p < backend/src/db/schema.sql
```

### 2) Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Then create demo accounts via the UI:

- Student: sign up with role **Student** (creates `Students` row)
- Admin: sign up with role **Admin**
- Security: sign up with role **Security**

### 3) Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (or `5174`) and backend at `http://localhost:4000`.

## Demo flow

1. Sign up as **Student** and create a request
2. Sign up as **Admin** and approve/reject (student gets a real-time toast)
3. Sign up as **Security** and verify the student?s QR payload (copy/paste for now)

## API (high level)

- `POST /api/auth/signup` (student/admin/security)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/gatepasses` (student)
- `GET /api/gatepasses/mine` (student)
- `GET /api/admin/gatepasses` (admin)
- `POST /api/admin/gatepasses/:id/approved` (admin)
- `POST /api/admin/gatepasses/:id/rejected` (admin)
- `GET /api/admin/analytics` (admin)
- `POST /api/security/verify` (security)
- `POST /api/security/gatepasses/:id/exit` (security)
- `POST /api/security/gatepasses/:id/entry` (security)
- `GET /api/security/logs` (security)

