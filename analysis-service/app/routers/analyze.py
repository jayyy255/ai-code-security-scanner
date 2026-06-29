from fastapi import APIRouter
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from uuid import uuid4
from app.services.semgrep_service import run_scan
from app.services.gitleaks_service import run_secret_scan
from app.services.scoring_service import generate_summary

router = APIRouter(
    prefix="/analyze"
    )

@router.post("/")
async def analyze_code(request: AnalyzeRequest):
    # Placeholder for analysis logic
    # In a real implementation, you would process the code and generate findings
    analysis_id = uuid4()
    semgrep_findings = await run_scan(
        code=request.code,
        language=request.language
    )

    gitleaks_findings = await run_secret_scan(
        code=request.code,
        language=request.language
    )

    findings = semgrep_findings + gitleaks_findings
    print("FINDINGS:")
    print(findings)

    summary = generate_summary(findings)
    print("SUMMARY:")
    print(summary)
    return AnalyzeResponse(
    analysis_id=analysis_id,
    summary=summary,
    findings=findings
    )