# CafeTrac

CafeTrac is a PWA SaaS for cafe waste, inventory, procurement, and operational alerts.

## Local Development

### Prerequisites
- Node.js 20+
- MongoDB Atlas (or local MongoDB)

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Production Deployment

### 1) Push to GitHub
```bash
git add .
git commit -m "feat: CafeTrac complete v1.0"
git push origin main
```

### 2) Deploy Backend (Render)
- Create a new Web Service in Render.
- Connect the repo and select `backend/`.
- Use `backend/render.yaml` or set:
  - Build: `npm ci && npm run build`
  - Start: `node dist/server.js`
- Add all environment variables from `backend/.env.example`.
- Deploy and copy the backend URL.

### 3) Deploy Frontend (Vercel)
- Create a new project in Vercel.
- Connect the repo and select `frontend/`.
- Vercel config is in `frontend/vercel.json`.
- Set env vars:
  - `VITE_API_BASE_URL` = Render backend URL
  - `VITE_VAPID_PUBLIC_KEY` = VAPID public key
- Deploy and copy the frontend URL.

### 4) Update Backend CORS
- In Render, update:
  - `CORS_ORIGINS` = Vercel frontend URL
  - `CLIENT_URL` = Vercel frontend URL
- Redeploy backend.

### 5) Production Smoke Test
- Open frontend URL.
- Register/login.
- Log a waste entry.
- Check inventory and reports.
- Install PWA on mobile/desktop.
- Verify push notifications.

## CI
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs backend/frontend type checks, frontend build, and high-severity dependency audits.
