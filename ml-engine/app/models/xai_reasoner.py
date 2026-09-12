"""
Carbonyx Explainable AI (XAI) Reasoner

Generates plain-English explanations for risk assessment decisions.
Maps anomaly flags, correlation results, and confidence scores into
a human-readable narrative suitable for auditors, verifiers, and regulators.
"""

from typing import List


class XAIReasoner:
    """
    Produces structured plain-English explanations that justify the ML
    engine's confidence score and risk classification.
    """

    def generate_explanation(
        self,
        confidence_score: int,
        risk_level: str,
        anomaly_flags: List[str],
        correlation_met: bool,
        max_deviation_pct: float,
        declared_tonnage: float,
        project_type: str,
        source_count: int,
    ) -> str:
        """
        Synthesize a comprehensive plain-English explanation.

        Args:
            confidence_score: Final score 0-100
            risk_level: LOW / MEDIUM / HIGH
            anomaly_flags: All flags from anomaly detector + correlation checker
            correlation_met: Whether cross-source correlation passed
            max_deviation_pct: Largest pairwise source deviation %
            declared_tonnage: Declared tCO2e from the project
            project_type: REFORESTATION / BLUE_CARBON / etc.
            source_count: Number of evidence items submitted

        Returns:
            A plain-English explanation string
        """
        parts: List[str] = []

        # --- Opening summary ---
        if risk_level == "LOW":
            parts.append(
                f"High multi-source consistency detected for this {project_type.replace('_', ' ').title()} project. "
                f"Evidence bundle passed all verification gates with a confidence score of {confidence_score}%."
            )
        elif risk_level == "MEDIUM":
            parts.append(
                f"Moderate discrepancies detected in the {project_type.replace('_', ' ').title()} evidence bundle. "
                f"Confidence score of {confidence_score}% indicates manual verifier review is recommended."
            )
        else:
            parts.append(
                f"Critical anomalies detected in the {project_type.replace('_', ' ').title()} evidence bundle. "
                f"Confidence score of {confidence_score}% — this bundle requires mandatory staked verifier escalation."
            )

        # --- Correlation summary ---
        if correlation_met:
            parts.append(
                f"Cross-source correlation check PASSED: {source_count} independent data source(s) "
                f"corroborate the declared {declared_tonnage:.0f} tCO2e capture within "
                f"{max_deviation_pct:.1f}% margin of error."
            )
        else:
            parts.append(
                f"Cross-source correlation check FAILED: Maximum inter-source deviation of "
                f"{max_deviation_pct:.1f}% exceeds the 15% tolerance threshold. "
                f"The declared {declared_tonnage:.0f} tCO2e cannot be independently corroborated."
            )

        # --- Anomaly flag details ---
        critical_flags = [f for f in anomaly_flags if any(kw in f for kw in [
            "MISMATCH", "OUTLIER", "EXCEEDS", "NEGATIVE", "DEVIATION"
        ])]
        info_flags = [f for f in anomaly_flags if f not in critical_flags]

        if critical_flags:
            parts.append(f"Anomaly flags raised ({len(critical_flags)}):")
            for flag in critical_flags:
                # Extract the flag name (before the colon) for cleaner output
                flag_name = flag.split(":")[0].strip()
                flag_detail = ":".join(flag.split(":")[1:]).strip()
                parts.append(f"  • {flag_name} — {flag_detail}")

        if not anomaly_flags:
            parts.append(
                "No anomaly flags were raised. All sensor readings, satellite indices, "
                "and tonnage calculations fall within expected ecological boundaries."
            )

        # --- Recommendation ---
        if risk_level == "LOW":
            parts.append(
                "Recommendation: Bundle is eligible for automated policy-gated minting. "
                "No human verifier intervention required."
            )
        elif risk_level == "MEDIUM":
            parts.append(
                "Recommendation: Assign to a staked verifier with specialization in "
                f"{project_type.replace('_', ' ').title()} for secondary review before minting."
            )
        else:
            parts.append(
                "Recommendation: MANDATORY verifier escalation. This bundle must not be "
                "auto-minted. A staked verifier must independently audit the evidence "
                "before any carbon credit issuance can proceed."
            )

        return " ".join(parts)
