import time
import asyncio

from fastapi import APIRouter
from uuid import uuid4

from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse
)

from app.services.semgrep_service import run_scan
from app.services.gitleaks_service import run_secret_scan
from app.services.explanation_service import generate_explanations
from app.services.deduplication_service import deduplicate_findings
from app.services.scoring_service import generate_summary


router = APIRouter(
    prefix="/analyze"
)


@router.post("/")
async def analyze_code(request: AnalyzeRequest):

    analysis_id = uuid4()

    scan_start = time.time()

    semgrep_findings, gitleaks_findings = await asyncio.gather(
        asyncio.to_thread(
            run_scan,
            request.code,
            request.language
        ),
        asyncio.to_thread(
            run_secret_scan,
            request.code,
            request.language
        )
    )

    scan_end = time.time()

    print(
        f"Scanning took "
        f"{scan_end - scan_start:.2f}s"
    )

    findings = (
        semgrep_findings +
        gitleaks_findings
    )

    findings = deduplicate_findings(findings)

    summary = generate_summary(findings)

    findings = await generate_explanations(
        findings,
        request.code
    )

    print(findings)

    return AnalyzeResponse(
        analysis_id=analysis_id,
        summary=summary,
        findings=findings
    )