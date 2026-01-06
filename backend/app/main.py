import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Task
from app.schemas import TaskCreate, TaskOut, TaskUpdate
from fastapi.middleware.cors import CORSMiddleware
from ollama import chat
from ollama import Client
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL")
FRONTEND_URL = os.getenv("FRONTEND_URL")

app = FastAPI()

origins = [
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/tasks/", response_model=TaskOut)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(title=task.title, completed=task.completed)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=list[TaskOut])
async def read_tasks(db: Session = Depends(get_db)):
    result = await db.execute(select(Task))
    tasks = result.scalars().all()
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskOut)
async def read_task(task_id: int, db: Session = Depends(get_db)):
    task = await db.execute(select(Task).filter(Task.id == task_id))
    task = task.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.put("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = await db.execute(select(Task).filter(Task.id == task_id))
    db_task = db_task.scalar_one_or_none()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.title = task.title
    db_task.completed = task.completed
    await db.commit()
    await db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}", response_model=TaskOut)
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = await db.execute(select(Task).filter(Task.id == task_id))
    db_task = db_task.scalar_one_or_none()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(db_task)
    await db.commit()
    return db_task

ollama_client = Client(host=OLLAMA_URL)

@app.post("/suggestions/")
async def suggest_task_completion(title: str):
    prompt = f"Just answer only steps for this task short: '{title}'?"
    try:
        response = ollama_client.chat(
            model='gemma3:4b-it-qat',
            messages=[{"role": "user", "content": prompt}]
        )
        return {"suggestion": response["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")