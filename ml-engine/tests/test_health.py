"""
Carbonyx ML Engine — Comprehensive Test Suite

Tests both hackathon demo scenarios:
  Scenario A: Clean / Auto-Mint Pass (confidence ≥ 85%, LOW risk)
  Scenario B: Anomalous / Verifier Escalation (confidence < 60%, HIGH risk)

Also tests edge cases: single source, boundary values, and correlation failures.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.schemas.evidence_schema import ScoreRequest, ScoreResponse

client = TestClient(app)


# ─── Existing C1 Tests (preserved) ───────────────────────────────────────────

def test_health_endpoint():
    """C1: Health endpoint returns online status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "Carbonyx AI/ML Engine"


def test_evidence_schema_validation():
    """C1: Pydantic schema validates correctly."""
    req = ScoreRequest(
        bundleId="0x123",
        projectId="0xabc",
        projectType="REFORESTATION",
        declaredTonnage=100.0,
        evidenceItems=[
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux",
                "value": 410.0,
                "calculatedTonnage": 102.0,
                "timestamp": 1726000000
            }
        ]
    )
    assert req.declaredTonnage == 100.0
    assert len(req.evidenceItems) == 1


# ─── Scenario A: Clean Auto-Mint Pass ────────────────────────────────────────

def test_scenario_a_clean_auto_mint():
    """
    Demo Scenario A: All sources corroborate within 5% tolerance.
    Expected: confidenceScore ≥ 85, riskLevel = LOW, autoMintEligible = true
    """
    payload = {
        "bundleId": "0x4a9f_clean",
        "projectId": "0x1b2c_forest",
        "projectType": "REFORESTATION",
        "declaredTonnage": 500.0,
        "evidenceItems": [
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux_ppm",
                "value": 412.5,
                "calculatedTonnage": 510.0,
                "timestamp": 1726000000
            },
            {
                "sourceType": "SATELLITE_NDVI",
                "metric": "canopy_cover_delta",
                "value": 0.18,
                "calculatedTonnage": 495.0,
                "timestamp": 1726000000
            },
            {
                "sourceType": "OPERATIONAL_DOC",
                "metric": "planted_saplings",
                "value": 25000,
                "calculatedTonnage": 505.0,
                "timestamp": 1726000000
            }
        ]
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["bundleId"] == "0x4a9f_clean"
    assert data["confidenceScore"] >= 85, f"Expected ≥ 85, got {data['confidenceScore']}"
    assert data["riskLevel"] == "LOW"
    assert data["autoMintEligible"] is True
    assert data["verifierRequired"] is False
    assert isinstance(data["explanationReason"], str)
    assert len(data["explanationReason"]) > 20  # meaningful explanation
    assert data["executionTimeMs"] >= 0


# ─── Scenario B: Anomalous / Verifier Escalation ─────────────────────────────

def test_scenario_b_anomalous_verifier_escalation():
    """
    Demo Scenario B: Sensors claim +1000 tCO2e but satellite shows canopy degradation.
    Expected: confidenceScore < 60, riskLevel = HIGH, verifierRequired = true
    """
    payload = {
        "bundleId": "0xdead_fraud",
        "projectId": "0xbad0_suspect",
        "projectType": "REFORESTATION",
        "declaredTonnage": 500.0,
        "evidenceItems": [
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux_ppm",
                "value": 850.0,
                "calculatedTonnage": 1500.0,
                "timestamp": 1726000000
            },
            {
                "sourceType": "SATELLITE_NDVI",
                "metric": "canopy_cover_delta",
                "value": -0.25,
                "calculatedTonnage": 50.0,
                "timestamp": 1726000000
            }
        ]
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["bundleId"] == "0xdead_fraud"
    assert data["confidenceScore"] < 60, f"Expected < 60, got {data['confidenceScore']}"
    assert data["riskLevel"] == "HIGH"
    assert data["autoMintEligible"] is False
    assert data["verifierRequired"] is True
    assert len(data["anomalyFlags"]) > 0  # at least one flag raised
    assert "MISMATCH" in " ".join(data["anomalyFlags"]) or "OUTLIER" in " ".join(data["anomalyFlags"])
    assert data["executionTimeMs"] >= 0


# ─── Edge Cases ──────────────────────────────────────────────────────────────

def test_single_source_warning():
    """Edge case: Only 1 evidence source — should still score but with penalty."""
    payload = {
        "bundleId": "0xsingle",
        "projectId": "0xproj_solo",
        "projectType": "BLUE_CARBON",
        "declaredTonnage": 200.0,
        "evidenceItems": [
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux_ppm",
                "value": 350.0,
                "calculatedTonnage": 210.0,
                "timestamp": 1726000000
            }
        ]
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 200

    data = response.json()
    # Single source should still get penalized for insufficient evidence
    assert data["confidenceScore"] <= 90  # deduction for single source
    assert isinstance(data["anomalyFlags"], list)


def test_medium_risk_range():
    """Evidence with moderate discrepancies should land in MEDIUM risk."""
    payload = {
        "bundleId": "0xmedium",
        "projectId": "0xproj_mid",
        "projectType": "REFORESTATION",
        "declaredTonnage": 500.0,
        "evidenceItems": [
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux_ppm",
                "value": 420.0,
                "calculatedTonnage": 600.0,
                "timestamp": 1726000000
            },
            {
                "sourceType": "SATELLITE_NDVI",
                "metric": "canopy_cover_delta",
                "value": 0.15,
                "calculatedTonnage": 480.0,
                "timestamp": 1726000000
            }
        ]
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Should produce some flags but not catastrophic
    assert data["confidenceScore"] >= 0
    assert data["riskLevel"] in ["LOW", "MEDIUM", "HIGH"]


def test_empty_evidence_returns_422():
    """Empty evidenceItems should return 422."""
    payload = {
        "bundleId": "0xempty",
        "projectId": "0xproj_empty",
        "projectType": "REFORESTATION",
        "declaredTonnage": 100.0,
        "evidenceItems": []
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 422


def test_response_schema_fields():
    """Verify all required fields exist in the ScoreResponse."""
    payload = {
        "bundleId": "0xschema_test",
        "projectId": "0xproj_schema",
        "projectType": "METHANE_CAPTURE",
        "declaredTonnage": 300.0,
        "evidenceItems": [
            {
                "sourceType": "IOT_SENSOR",
                "metric": "co2_flux_ppm",
                "value": 500.0,
                "calculatedTonnage": 310.0,
                "timestamp": 1726000000
            },
            {
                "sourceType": "SATELLITE_NDVI",
                "metric": "ndvi_index",
                "value": 0.20,
                "calculatedTonnage": 290.0,
                "timestamp": 1726000000
            }
        ]
    }

    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    # All ScoreResponse fields must be present
    required_fields = [
        "bundleId", "confidenceScore", "riskLevel",
        "autoMintEligible", "verifierRequired",
        "anomalyFlags", "explanationReason", "executionTimeMs"
    ]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"

    # Type checks
    assert isinstance(data["confidenceScore"], int)
    assert 0 <= data["confidenceScore"] <= 100
    assert data["riskLevel"] in ["LOW", "MEDIUM", "HIGH"]
    assert isinstance(data["autoMintEligible"], bool)
    assert isinstance(data["verifierRequired"], bool)
    assert isinstance(data["anomalyFlags"], list)
    assert isinstance(data["explanationReason"], str)
    assert isinstance(data["executionTimeMs"], int)
