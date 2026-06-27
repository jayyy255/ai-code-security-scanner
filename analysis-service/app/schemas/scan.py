from pydantic import BaseModel, Field, field_validator
from uuid import UUID

class AnalyzeRequest(BaseModel):
    code: str
    language: str | None = None

    @field_validator("code")
    def validate_code(cls, value):
        # validation logic
        if not value.strip():
            raise ValueError("Code cannot be empty or whitespace.")
        return value
    
class AnalyzeSummary(BaseModel):
    security_score: float
    critical: int
    high: int
    medium: int
    low: int

class AnalyzeResponse(BaseModel):
    analysis_id: UUID
    summary: AnalyzeSummary
    findings: list = Field(default_factory=list)