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

What's remaining / planned
- Optional: GraphQL Subscriptions for real-time updates (not implemented yet).
- Dockerization and docker-compose for local dev.
- Vitest tests for backend resolvers and auth flow.
- Seed script to create sample data / admin user.
- Frontend: add reusable Apollo hooks and optimistic UI flows.

---

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
- Current authorization model allows any authenticated user to call `assignTask`. If you want stricter rules (e.g., only the task creator or ADMIN may assign/unassign), I can implement role-based checks quickly.
- Subscriptions (task updates in real time) are a planned enhancement. I recommend `graphql-ws` + an in-memory PubSub for development and Redis PubSub for production.

---

## Next suggested steps I can implement for you
- Add an in-memory `taskUpdated` subscription and publish events when tasks are created/updated/assigned.
- Add `assignedBy`/`assignedAt` audit fields to the `Task` model and expose them in the schema.
- Harden `assignTask` so only ADMIN or task creator can assign/unassign.
- Add a seed script and Dockerfiles / docker-compose for quick local development.
- Add Vitest tests and CI workflow.

If you'd like me to create a short seed script and a `README`-level GraphQL examples file inside `Backend/` next, tell me and I will add it.

---

If you want this committed and pushed, tell me and I will create the README file (done) and then I can walk you through the git commands to commit and push, or run them here if you want me to (confirm).
