# Institutional Decision Support Analytics Dashboard
## SC003 — Sathakathon 2.0

### Quick start (5 minutes)

```bash
# 1. Frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install recharts @radix-ui/react-tabs lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. Backend
mkdir backend && cd backend
npm init -y
npm install express cors
node server.js

# 3. Run both
# Terminal 1: cd frontend && npm run dev
# Terminal 2: cd backend && node server.js
```

### Deploy
- Frontend → vercel.com (drag and drop the dist/ folder)
- Backend  → railway.app (connect GitHub repo, auto-deploys)
