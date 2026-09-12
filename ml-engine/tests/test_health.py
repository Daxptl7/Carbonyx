from fastapi.testclient import TestClient
from app.main import app
from app.schemas.evidence_schema import ScoreRequest, ScoreResponse

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "Carbonyx AI/ML Engine"

def test_evidence_schema_validation():
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
