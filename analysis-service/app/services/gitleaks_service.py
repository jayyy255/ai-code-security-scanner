import tempfile
from pathlib import Path
import subprocess
import json

EXTENSIONS = {
    "python": ".py",
    "javascript": ".js",
    "java": ".java",
    "go": ".go",
    "c": ".c",
    "cpp": ".cpp"
}

SEVERITY_MAP = {
    "github-pat": "CRITICAL",
    "aws-access-key": "CRITICAL",
    "aws-secret-key": "CRITICAL",
    "slack-token": "HIGH",
    "google-api-key": "HIGH",
    "heroku-api-key": "HIGH"
}

async def run_secret_scan(
    code: str,
    language: str | None = None
) -> list[dict]:
    
    with tempfile.TemporaryDirectory() as temp_dir:
        extension = EXTENSIONS.get(language, ".txt")
        file_path = Path(temp_dir) / f"scan{extension}"

        file_path.write_text(code, encoding="utf-8")

        result = subprocess.run(
        [
            r"E:\gitleaks.exe",
            "dir",
            temp_dir,
            "-f",
            "json",
            "-r",
            "-"
        ],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
        
    if result.returncode not in (0, 1):
        raise RuntimeError(result.stderr)
    
    if not result.stdout.strip():
        return []
    
    raw_findings = json.loads(result.stdout)

    findings = []

    for finding in raw_findings:
        findings.append(
            {
                "scanner": "gitleaks",
                "rule_id": finding.get("RuleID", "unknown"),
                "line": finding.get("StartLine"),
                "severity": SEVERITY_MAP.get(
                    finding.get("RuleID"),
                    "HIGH"
                ),
                "message": finding.get("Description",""),
            }
        )

    return findings