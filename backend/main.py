import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import StringConstraints, field_validator
from sqlalchemy import URL
from sqlmodel import Field, Session, SQLModel, create_engine, select


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskInput(SQLModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""
    priority: Priority = Priority.medium
    completed: bool = False


class Task(TaskInput, table=True):
    __table_args__ = {"sqlite_autoincrement": True}

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TaskResponse(TaskInput):
    id: int
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def restore_utc(cls, value: datetime) -> datetime:
        # SQLite returns naive datetimes. The database stores UTC.
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value


database_path = Path(
    os.environ.get("TASK_DATABASE_PATH", Path(__file__).with_name("database.db"))
).expanduser().resolve()
engine = create_engine(
    URL.create("sqlite", database=str(database_path)),
    connect_args={"check_same_thread": False},
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    SQLModel.metadata.create_all(engine)
    try:
        yield
    finally:
        engine.dispose()


app = FastAPI(
    title="SDC Task Manager API",
    description="Create, list, update, and delete tasks stored in SQLite.",
    version="1.0.0",
    lifespan=lifespan,
)

local_origins = ",".join(
    f"http://{host}:{port}"
    for host in ("localhost", "127.0.0.1")
    for port in (5173, 4173)
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get("TASK_CORS_ORIGINS", local_origins).split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


def get_session():
    with Session(engine) as session:
        yield session


DatabaseSession = Annotated[Session, Depends(get_session)]
not_found_response = {404: {"description": "Task not found"}}


def get_task_or_404(task_id: int, session: Session) -> Task:
    task = session.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


@app.get("/tasks", response_model=list[TaskResponse], tags=["Tasks"])
def list_tasks(session: DatabaseSession):
    return session.exec(select(Task).order_by(Task.created_at.desc(), Task.id.desc())).all()


@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(payload: TaskInput, session: DatabaseSession):
    task = Task.model_validate(payload)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.put("/tasks/{task_id}", response_model=TaskResponse, responses=not_found_response, tags=["Tasks"])
def update_task(task_id: int, payload: TaskInput, session: DatabaseSession):
    task = get_task_or_404(task_id, session)
    task.sqlmodel_update(payload.model_dump())
    session.commit()
    session.refresh(task)
    return task


@app.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=not_found_response,
    tags=["Tasks"],
)
def delete_task(task_id: int, session: DatabaseSession):
    session.delete(get_task_or_404(task_id, session))
    session.commit()
