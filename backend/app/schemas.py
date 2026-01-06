from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    completed: bool = False

    model_config = {
        "from_attributes": True
    }

class TaskUpdate(BaseModel):
    title: str
    completed: bool

    model_config = {
        "from_attributes": True
    }

class TaskOut(BaseModel):
    id: int
    title: str
    completed: bool

    model_config = {
        "from_attributes": True
    }
