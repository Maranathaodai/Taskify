# Taskify Backend

## Setup

1. Create a `.env` file and fill values:

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/taskify
JWT_SECRET=change-me-in-production
```

2. Install deps and run dev:

```
npm install
npm run dev
```

## Tech
- Node.js + Express
- Apollo Server (GraphQL)
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication

## GraphQL
- Auth: register, login
- Task: createTask, updateTask, deleteTask, toggleTaskComplete, assignTask
- Query: me, tasks

## Notes
- JWT required on all mutations except register and login
- User is injected into Apollo context from Authorization header

