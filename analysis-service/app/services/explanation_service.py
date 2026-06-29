import os
import json
import time

from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


async def generate_explanations(
    findings: list[dict],
    source_code: str
) -> list[dict]:

    if not findings:
        return findings

    prompt = f"""
You are a senior application security engineer.

Analyze the provided source code and security findings.

SOURCE CODE:
{source_code}

SECURITY FINDINGS:
{json.dumps(findings, indent=2)}

For each finding provide:

- explanation (maximum 2 sentences)
- risk (maximum 2 sentences)
- remediation (maximum 3 bullet points)
- fixed_code

Be concise and practical.
Do not repeat information.
Return ONLY valid JSON.

Format:

[
  {{
    "rule_id": "",
    "explanation": "",
    "risk": "",
    "remediation": "",
    "fixed_code": ""
  }}
]
"""

    try:
        print(
            f"Generating explanations for "
            f"{len(findings)} findings"
        )
        gemini_start=time.time()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )
        gemini_end=time.time()
        print(f"Gemini took {gemini_end-gemini_start:.2f}s")

        cleaned = response.text.strip()
        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```", "")

        explanations = json.loads(cleaned)

        explanation_map = {
            item["rule_id"]: item
            for item in explanations
        }

        for finding in findings:

            rule_id = finding.get("rule_id")

            if rule_id in explanation_map:

                finding["explanation"] = explanation_map[
                    rule_id
                ].get("explanation")

                finding["risk"] = explanation_map[
                    rule_id
                ].get("risk")

                finding["remediation"] = explanation_map[
                    rule_id
                ].get("remediation")

                finding["fixed_code"] = explanation_map[
                    rule_id
                ].get("fixed_code")

        return findings

    except Exception as e:

        print(f"Gemini explanation error: {e}")

        return findings