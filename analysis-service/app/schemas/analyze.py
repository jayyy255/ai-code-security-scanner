from pydantic import BaseModel, Field, field_validator
from uuid import UUID

class Finding(BaseModel):
    scanner: str
    rule_id: str
    line: int | None
    severity: str
    message: str

    owasp: list[str] = Field(default_factory=list)
    cwe: list[str] = Field(default_factory=list)
    vulnerability_class: list[str] = Field(default_factory=list)

    likelihood: str | None = None
    impact: str | None = None
    confidence: str | None = None
    explanation: str | None = None
    risk: str | None = None
    remediation: list[str] = Field(default_factory=list)
    fixed_code: str | None = None

class AnalyzeRequest(BaseModel):
    code: str
    language: str | None = Field(
    default=None,
    description="Programming language of the code"
    )

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
    findings: list[Finding]