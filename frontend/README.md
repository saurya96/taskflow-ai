# TaskFlow AI frontend

The React/Vite dashboard connects to the existing Express API. It supports JWT
registration and login, project management, task history and details, and
automatically refreshes task status while a worker is processing.

## Requirements

- Node.js 20.19+ or 22.12+
- The TaskFlow backend available at `http://localhost:5000` by default

## Local setup

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the backend API base URL if it differs from
`http://localhost:5000/api`. The backend must allow the frontend's browser
origin through its `CLIENT_URL` CORS setting.

## Available commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## API contract used by the dashboard

- `POST /api/auth/register` and `POST /api/auth/login` return a JWT and user
  summary. The frontend stores them in browser local storage and sends the
  token as a Bearer authorization header.
- `GET /api/projects` returns the authenticated user's projects.
- Project create/update requests use `repository`, `branchPolicy`, and
  `techStack`, matching the existing backend model.
- Task history is assembled from `GET /api/tasks/project/:projectId` for each
  project because the existing backend does not expose a global task-list
  endpoint.
- Tasks are created through `POST /api/tasks` and read, updated, or deleted
  through the existing `/api/tasks/:id` routes.
- The task details page polls for task status every 3 seconds. Dashboard,
  project details, and task history refresh every 5 seconds.

The backend's task update API does not support changing task input text or
operation after submission. Project deletion removes only the project record;
the existing API does not cascade-delete its tasks.
