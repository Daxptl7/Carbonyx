from pydantic import BaseModel
from typing import List, Literal, Optional

class EvidenceItemInput(BaseModel):
    sourceType: Literal['IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC', 'VERIFIER_AUDIT']
    metric: str
    value: float
    calculatedTonnage: float
    timestamp: int

class ScoreRequest(BaseModel):
    bundleId: str
    projectId: str
    projectType: str
    declaredTonnage: float
    evidenceItems: List[EvidenceItemInput]

class ScoreResponse(BaseModel):
    bundleId: str
    confidenceScore: int
    riskLevel: Literal['LOW', 'MEDIUM', 'HIGH']
    autoMintEligible: bool
    verifierRequired: bool
    anomalyFlags: List[str]
    explanationReason: str
    recommendedVerifier: Optional[str] = None
    executionTimeMs: int
