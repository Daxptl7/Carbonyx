from pydantic import BaseModel
from typing import List, Literal, Optional, Any

class EvidenceItemInput(BaseModel):
    sourceType: Literal['IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC', 'VERIFIER_AUDIT']
    metric: Optional[str] = "co2_flux_ppm"
    value: Optional[float] = 412.5
    calculatedTonnage: Optional[float] = 500.0
    timestamp: Optional[int] = 1726000000
    payload: Optional[dict] = None

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        if isinstance(obj, dict):
            p = obj.get("payload") or {}
            if "metric" not in obj or not obj["metric"]:
                st = obj.get("sourceType")
                if st == "IOT_SENSOR":
                    obj["metric"] = "co2_flux_ppm"
                    obj["value"] = float(p.get("co2FluxPpm") or p.get("co2_flux_ppm") or p.get("value") or 412.5)
                    obj["calculatedTonnage"] = float(p.get("calculatedTonnage") or p.get("calculated_tonnage") or 500.0)
                elif st == "SATELLITE_NDVI":
                    obj["metric"] = "canopy_cover_delta"
                    obj["value"] = float(p.get("canopyCoverDelta") or (p.get("meanNdvi", 0.83) - 0.65) if "meanNdvi" in p else 0.18)
                    obj["calculatedTonnage"] = float(p.get("calculatedTonnage") or p.get("calculated_tonnage") or 500.0)
                elif st == "OPERATIONAL_DOC":
                    obj["metric"] = "planted_saplings"
                    obj["value"] = float(p.get("plantedSaplings") or p.get("saplings") or 25000.0)
                    obj["calculatedTonnage"] = float(p.get("calculatedTonnage") or p.get("calculated_tonnage") or 500.0)
                else:
                    obj["metric"] = "audit_metric"
                    obj["value"] = float(p.get("value") or 1.0)
                    obj["calculatedTonnage"] = float(p.get("calculatedTonnage") or 500.0)
            if ("timestamp" not in obj or not obj["timestamp"]) and "timestamp" in p:
                obj["timestamp"] = int(p["timestamp"])
        return super().model_validate(obj, *args, **kwargs)

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
    modelInfo: Optional[dict] = None
