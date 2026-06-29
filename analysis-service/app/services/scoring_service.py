def classify_finding(finding: dict) -> str:

    severity = finding.get("severity")

    if severity:

        severity = severity.upper()

        if severity in (
            "CRITICAL",
            "HIGH",
            "MEDIUM",
            "LOW"
        ):
            return severity

    likelihood = (
        finding.get("likelihood") or ""
    ).upper()

    impact = (
        finding.get("impact") or ""
    ).upper()

    if likelihood == "HIGH" and impact == "HIGH":
        return "CRITICAL"

    if likelihood == "HIGH" or impact == "HIGH":
        return "HIGH"

    if likelihood == "MEDIUM" or impact == "MEDIUM":
        return "MEDIUM"

    return "LOW"


def generate_summary(
    findings: list[dict]
) -> dict:

    critical = 0
    high = 0
    medium = 0
    low = 0

    for finding in findings:

        severity = classify_finding(
            finding
        )

        if severity == "CRITICAL":
            critical += 1

        elif severity == "HIGH":
            high += 1

        elif severity == "MEDIUM":
            medium += 1

        else:
            low += 1

    score = 100

    score -= critical * 25
    score -= high * 15
    score -= medium * 8
    score -= low * 3

    score = max(score, 0)

    return {
        "security_score": score,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low
    }