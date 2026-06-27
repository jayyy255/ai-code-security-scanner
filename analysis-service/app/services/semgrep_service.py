async def run_scan(
    code: str,
    language: str | None = None
) -> list[dict]:
    return [
        {
            "severity": "HIGH",
            "issue": "Dummy SQL Injection",
            "line": 27
        }
    ]