# SDC Task 2 · Task Manager

Built by Venkatesh Kalyane ([@Lord-Ship-VK](https://github.com/Lord-Ship-VK)) for the Software Development Cell at Android Club, VIT Bhopal.

Create tasks with a title, optional description, and priority. Edit, complete, reopen, and delete them, or switch between **All**, **Active**, and **Completed**. The React 19 and Tailwind CSS frontend uses the Task 1 dark emerald palette. The FastAPI backend persists changes to SQLite through SQLModel.

## Run locally

Use Python 3.11+ and Node.js 20.19+ or 22.12+.

From the project root, start the API in one terminal.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

On Windows PowerShell, activate with `./.venv/Scripts/Activate.ps1`. Uvicorn creates `backend/database.db` on first start.

Start the frontend from the project root in a second terminal.

```bash
cd frontend
npm ci
npm run dev
```

Open the [task board](http://localhost:5173). The frontend defaults to `http://127.0.0.1:8000` for API requests. To use a different address, copy `frontend/.env.example` to `frontend/.env.local`, set `VITE_API_URL`, and restart Vite. The backend permits the local Vite development and preview origins by default. Set `TASK_CORS_ORIGINS` to a comma-separated list to allow other origins.

## API

- [Swagger UI](http://127.0.0.1:8000/docs) for interactive requests
- [ReDoc](http://127.0.0.1:8000/redoc) for the API reference
- [OpenAPI JSON](http://127.0.0.1:8000/openapi.json) for the schema

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/tasks` | Lists tasks, newest first |
| POST | `/tasks` | Creates a task and returns it with status 201 |
| PUT | `/tasks/{id}` | Replaces editable fields and returns the updated task |
| DELETE | `/tasks/{id}` | Removes the task and returns status 204 |

Example request body for creating a task or updating its editable fields.

```json
{
  "title": "Review the SDC submission",
  "description": "Check the mobile layout and try the API.",
  "priority": "high",
  "completed": false
}
```

Priority accepts `low`, `medium`, or `high`. The server assigns the ID and UTC creation time. Missing task IDs return 404 on update and delete, and invalid request bodies return 422.

## Build and check

In `frontend/`, run `npm run build` to generate `dist/`, then `npm run preview` to serve it at [localhost:4173](http://localhost:4173). Keep the API running while you preview the build.

In `backend/` with the virtual environment active, run `python -m pip check` and `python -m compileall -q main.py` to check dependencies and syntax. Start Uvicorn and open Swagger UI to exercise the API against SQLite.
