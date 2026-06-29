import json
import subprocess
import tempfile
import os

EXTENSIONS = {
    "python": ".py",
    "javascript": ".js",
    "java": ".java",
    "go": ".go",
    "c": ".c",
    "cpp": ".cpp"
}

async def run_scan(
    code: str,
    language: str | None = None
):

    extension = (
        EXTENSIONS.get(language.lower(), ".txt")
        if language
        else ".txt"
    )

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=extension,
        delete=False,
        encoding="utf-8"
    ) as temp_file:

        temp_file.write(code)
        temp_path = temp_file.name

    try:

        result = subprocess.run(
            [
                "semgrep",
                "scan",
                "--config",
                "p/security-audit",
                temp_path,
                "--json"
            ],
            capture_output=True,
            text=True
        )
        if result.returncode not in (0, 1):
            raise Exception(result.stderr)
        data = json.loads(result.stdout)

        findings = []

        for finding in data.get("results", []):
            findings.append(
                {
                    "scanner": "semgrep",
                    "rule_id": finding.get("check_id"),
                    "line": finding.get("start", {}).get("line"),
                    "severity": finding.get("extra", {}).get("severity"),
                    "message": finding.get("extra", {}).get("message"),
                    "owasp": finding.get("extra", {}).get("metadata", {}).get("owasp", []),
                    "likelihood": finding.get("extra", {}).get("metadata", {}).get("likelihood", []),
                    "impact": finding.get("extra", {}).get("metadata", {}).get("impact", []),
                    "confidence": finding.get("extra", {}).get("metadata", {}).get("confidence", []),
                    "cwe": finding.get("extra", {}).get("metadata", {}).get("cwe", []),
                    "vulnerability_class": finding.get("extra", {}).get("metadata", {}).get("vulnerability_class", [])
                }
            )

        return findings

    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)