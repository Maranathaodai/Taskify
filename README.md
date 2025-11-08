# Taskify — Team Task Tracker

This repository contains a full-stack Task Tracker app prototype split into two folders:

- `Frontend/` — Next.js + React frontend (TypeScript, Tailwind).
- `Backend/` — Node.js + Express + Apollo GraphQL server (TypeScript, Mongoose/MongoDB).

This README summarizes what exists, how to run each part locally, current progress, and quick GraphQL examples to exercise the backend.

---

## Quick status summary

Backend (what's implemented)
- Apollo Server (Express) running at `/graphql`.
- Mongoose models: `User`, `Task` (timestamps, assignedTo, createdBy, completed).
- Authentication: register & login mutations using bcrypt + JWT.
- Auth middleware: validates JWT, attaches `user` to Apollo context.
- GraphQL schema & resolvers for:
  - Queries: `me`, `tasks(filter)` (supports `mine` and `completed`).
  - Mutations: `register`, `login`, `createTask`, `updateTask`, `toggleTaskComplete`, `deleteTask`, `assignTask`.
- `assignTask` lets an authenticated user assign/unassign a task to a user (no role restrictions yet).

Frontend (what's implemented)
- Next.js app in `Frontend/` (TypeScript + Tailwind CSS).
- Pages and components for auth UI, dashboard, and task UI.
- Frontend currently wired to use the GraphQL backend or local mock API depending on development needs.



## Backend — get started locally

1. Open a terminal and change into the backend folder:

```powershell
cd Backend
```

2. Install dependencies:

```powershell
npm install
```

3. Create an `.env` file (or copy `.env.example`):

- `MONGODB_URI` — your MongoDB connection string (Atlas or local). Example format in `Backend/.env.example`.
- `JWT_SECRET` — a secret string for signing JWTs.
- `PORT` — optional (defaults to 4000).

Note: For security, do not commit your real `.env` to Git. Use `.env.example` for public documentation.

4. Start the dev server:

```powershell
npm run dev
```

You should see:

```
Connected to MongoDB
GraphQL server ready at http://localhost:4000/graphql
```

Open `http://localhost:4000/graphql` to use Apollo Studio / Playground.

### GraphQL quick examples

Register a user (returns token):

```graphql 
mutation Register {
  register(name: "Test User", email: "test@example.com", password: "pass123") {
    token
    user { id name email role }
  }
}
```

Login:

```graphql
mutation Login {
  login(email: "test@example.com", password: "pass123") {
    token
    user { id name email role }
  }
}
```

Create a task (requires Authorization header `Bearer <token>`):

```graphql
mutation CreateTask {
  createTask(title: "New task", description: "Do this") {
    id
    title
    completed
    createdBy { id name }
  }
}
```

Assign a task to a user:

```graphql
mutation AssignTask($id: ID!, $userId: ID) {
  assignTask(id: $id, userId: $userId) {
    id
    title
    assignedTo { id name email }
  }
}
```

Query tasks with filters (example):

```graphql
query GetTasks($filter: TaskFilter) {
  tasks(filter: $filter) {
    id
    title
    description
    completed
    assignedTo { id name }
    createdBy { id name }
    createdAt
  }
}
```

Variables example:

```json
{ "filter": { "mine": true, "completed": false } }
```

---

## Frontend — get started locally

1. Change into the frontend folder:

```powershell
cd Frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Start the dev server:

```powershell
npm run dev
```

By default the Next app serves locally (e.g. http://localhost:3000). The frontend is wired to the GraphQL endpoint (`http://localhost:4000/graphql`) for the backend flows; you can change API wiring in `Frontend/lib/api.ts` or via environment variables depending on your setup.

---

## Notes, security, and recommendations
- The repo contains an `.env.example` in `Backend/`. Ensure you do not commit real secrets — add `.env` to `.gitignore` in your project root if not already ignored.
- Subscriptions (task updates in real time) are a planned enhancement. I recommend `graphql-ws` + an in-memory PubSub for development and Redis PubSub for production.

---

## How I deployed this project

I deployed the backend to Render and the frontend to Vercel. Below are the exact steps, commands, and environment variables I used.

Backend (Render)

Repository path / Root: Backend
Build command I used:
npm ci --include=dev && npm run build
(this installs devDependencies so TypeScript and @types/* are available during the build)
Start command:
npm run start
(runs the compiled dist/index.js)
Health check path: /health
Environment variables I added on Render (server-only — mark as secrets):
MONGODB_URI — MongoDB Atlas connection string (do NOT commit)
JWT_SECRET — a long random secret for signing JWTs (do NOT commit)
NODE_ENV=production
Optional: MONGO_CONNECT_MAX_ATTEMPTS (if you want retry behavior), FRONTEND_URL or CORS_ORIGIN (if the server reads it)
Operational steps I performed:
Whitelisted Render outbound IPs (or temporarily allowed 0.0.0.0/0) in MongoDB Atlas so the service could connect.
Watched Render build logs to confirm tsc compiled successfully and node dist/index.js started and connected to MongoDB.
Used scripts/clear-db.js during testing to wipe the DB when I wanted the first user to become ADMIN.
Public service URL (example I got):
https://taskify-ktvl.onrender.com
GraphQL endpoints:
HTTP: https://taskify-ktvl.onrender.com/graphql
WS: wss://taskify-ktvl.onrender.com/graphql
Frontend (Vercel)

Project Root: Frontend (set this so Vercel builds only the Next app)
Install & build commands I used (npm workflow):
Install command: npm ci && npm run build
Build command: npm run start
Environment variables I added on Vercel (client-visible):
NEXT_PUBLIC_GRAPHQL_URL = https://taskify-ktvl.onrender.com/graphql
NEXT_PUBLIC_GRAPHQL_WS = wss://taskify-ktvl.onrender.com/graphql
Important notes:
NEXT_PUBLIC_* envs are baked into the frontend at build time — after adding or changing them, trigger a full redeploy so the new values are included in the bundle.
Use https:// and wss:// for production endpoints (browsers block mixed http/https and ws/wss mismatches).
Do NOT put MONGODB_URI or JWT_SECRET on Vercel — those are server-only secrets and must remain on Render.
Quick verification commands (replace <your-render-host> with your Render host)

Health check:
curl -i https://<your-render-host>/health
GraphQL sanity check:
curl -s -X POST https://<your-render-host>/graphql -H "Content-Type: application/json" -d "{"query":"query { __typename }"}" -i
Security & operational reminders

Never commit .env to git. If you accidentally pushed secrets, rotate the MongoDB user password and JWT_SECRET immediately and update Render with new values.
If you enforce CORS by origin in the backend, add your Vercel domain to the allowlist (or set FRONTEND_URL/CORS_ORIGIN env and use it in server CORS config).
For production with multiple backend instances, replace in-process PubSub with Redis PubSub (or a managed realtime service) to ensure subscriptions work across instances.

