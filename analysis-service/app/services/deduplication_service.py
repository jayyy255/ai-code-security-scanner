def deduplicate_findings(
    findings: list[dict]
) -> list[dict]:
    unique = {}
    severity_rank = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1
    }

    for finding in findings:

        line = finding.get("line")

        vuln_class = [
            v.lower()
            for v in finding.get(
                "vulnerability_class",
                []
            )
        ]

        rule_id = (
            finding.get("rule_id", "")
            .lower()
        )

        is_secret = (
            "secret" in " ".join(vuln_class)
            or "token" in rule_id
            or "pat" in rule_id
            or "secret" in rule_id
        )

        if is_secret:
            key = ("secret", line,finding.get("message", ""))
        else:
            key = (
                line,
                finding.get("rule_id")
            )

        if key not in unique:
            unique[key] = finding
            continue

        existing = unique[key]

        existing_score = severity_rank.get(
            existing.get("severity", "LOW"),
            1
        )

        new_score = severity_rank.get(
            finding.get("severity", "LOW"),
            1
        )

        if new_score > existing_score:
            unique[key] = finding

    findings = list(unique.values())
    return findings