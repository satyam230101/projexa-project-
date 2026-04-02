from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)
    model_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    citations: list[dict]
