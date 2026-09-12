"""
Carbonyx POST /score endpoint — FastAPI Router

Receives evidence bundles, runs the full AI pipeline:
  1. Isolation Forest anomaly detection
  2. N-of-M cross-source correlation check
  3. Confidence scoring & risk classification
  4. XAI plain-English explanation generation

Returns a ScoreResponse with confidence, risk level, mint eligibility,
anomaly flags, and the full explanation.
"""

import time
from fastapi import APIRouter, HTTPException
from app.schemas.evidence_schema import ScoreRequest, ScoreResponse
from app.models.anomaly_detector import AnomalyDetector
from app.models.correlation_checker import CorrelationChecker
from app.models.xai_reasoner import XAIReasoner
from app.utils.verifier_matcher import VerifierMatcher

router = APIRouter()

# Initialize models once at module load (singleton pattern for performance)
anomaly_detector = AnomalyDetector()
correlation_checker = CorrelationChecker()
xai_reasoner = XAIReasoner()
verifier_matcher = VerifierMatcher()


# Confidence thresholds from spec
AUTO_MINT_THRESHOLD = 85   # >= 85 → auto-mint eligible
MEDIUM_RISK_FLOOR = 60     # 60-84 → MEDIUM, < 60 → HIGH


@router.post("/score", response_model=ScoreResponse)
def score_evidence_bundle(request: ScoreRequest):
    """
    POST /score — Evaluate an evidence bundle for anomalies and risk.

    Implements the complete Patent Module 110 pipeline:
    - Isolation Forest multivariate outlier detection
    - Cross-source correlation validation (IoT ↔ Satellite ≤ 15%)
    - Domain boundary rule checks
    - Confidence scoring with risk classification
    - Explainable AI reason generation
    """
    start_ms = time.time()

    # --- Validate input ---
    if not request.evidenceItems:
        raise HTTPException(
            status_code=422,
            detail="evidenceItems array must contain at least 1 item"
        )

    # Convert Pydantic models to dicts for the ML pipeline
    items_dicts = [item.model_dump() for item in request.evidenceItems]

    # --- Stage 1: Anomaly Detection (Isolation Forest + Z-Score + Domain Rules) ---
    anomaly_deduction, anomaly_flags = anomaly_detector.detect(
        evidence_items=items_dicts,
        declared_tonnage=request.declaredTonnage,
        project_type=request.projectType,
    )

    # --- Stage 2: Cross-Source Correlation Check ---
    correlation_met, max_deviation_pct, correlation_flags = correlation_checker.check(
        evidence_items=items_dicts,
        declared_tonnage=request.declaredTonnage,
    )

    # Add correlation failure as an additional deduction
    correlation_deduction = 0
    if not correlation_met:
        correlation_deduction = min(25, int(max_deviation_pct - 15) + 10)

    # --- Stage 3: Compute final confidence score ---
    all_flags = anomaly_flags + [f for f in correlation_flags if "MISMATCH" in f or "DEVIATION" in f or "SINGLE_SOURCE" in f]

    total_deduction = anomaly_deduction + correlation_deduction
    confidence_score = max(0, min(100, 100 - total_deduction))

    # --- Stage 4: Risk classification ---
    if confidence_score >= AUTO_MINT_THRESHOLD:
        risk_level = "LOW"
    elif confidence_score >= MEDIUM_RISK_FLOOR:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    auto_mint_eligible = confidence_score >= AUTO_MINT_THRESHOLD
    verifier_required = not auto_mint_eligible

    # Match a staked verifier if human review is required
    recommended_verifier = None
    if verifier_required:
        recommended_verifier = verifier_matcher.match_verifier(request.projectType)

    # --- Stage 5: XAI Explanation ---
    explanation = xai_reasoner.generate_explanation(
        confidence_score=confidence_score,
        risk_level=risk_level,
        anomaly_flags=all_flags,
        correlation_met=correlation_met,
        max_deviation_pct=max_deviation_pct,
        declared_tonnage=request.declaredTonnage,
        project_type=request.projectType,
        source_count=len(request.evidenceItems),
    )

    execution_time_ms = int((time.time() - start_ms) * 1000)

    return ScoreResponse(
        bundleId=request.bundleId,
        confidenceScore=confidence_score,
        riskLevel=risk_level,
        autoMintEligible=auto_mint_eligible,
        verifierRequired=verifier_required,
        anomalyFlags=all_flags,
        explanationReason=explanation,
        recommendedVerifier=recommended_verifier,
        executionTimeMs=execution_time_ms,
        modelInfo=anomaly_detector.info(),
    )
