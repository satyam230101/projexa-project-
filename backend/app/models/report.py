from pydantic import BaseModel, Field


class ReportAnalysisResponse(BaseModel):
    summary: str
    risk_level: str
    recommendations: list[str]
    citations: list[dict]


class AnalyzeTextRequest(BaseModel):
    text: str = Field(min_length=20, max_length=30000)
    context: str | None = None
