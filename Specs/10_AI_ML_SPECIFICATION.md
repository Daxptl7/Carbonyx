# AI/ML Specification

## 1. Engine Objective

Implement the patent's Multi-Source Correlation, Risk Assessment and Anomaly Detection Engine (Patent Module 110) and Protocol-Managed Verifier Assignment (Patent Module 112). 

The AI/ML service analyzes multi-source environmental evidence (IoT telemetry, satellite remote-sensing indices like NDVI/biomass change, and project documentation), calculates an explainable confidence score (0–100%), flags anomalies, and determines whether an evidence bundle is eligible for instant automated minting or must be escalated to a staked human verifier.

## 2. Model Architecture & Pipeline

```
[Raw Evidence Bundle JSON]
           │
           ▼
[1. Preprocessing & Normalization]
  - Sensor time-series aggregation
  - Satellite NDVI / Biomass delta extraction
  - Declared baseline comparison
           │
           ▼
[2. Anomaly Detection Ensemble]
  ├── Isolation Forest (Multi-variate outlier detection)
  ├── Statistical Z-Score / IQR Delta Test (Cross-source mismatch)
  └── Rule-Based Domain Boundary Checker (Thermodynamic & Ecological limits)
           │
           ▼
[3. Confidence Scoring & Risk Matrix]
  - Base Score = 100
  - Deductions applied for cross-source discrepancies and anomaly confidence
  - Classification: LOW RISK (>= 85%), MEDIUM RISK (60-84%), HIGH RISK (< 60%)
           │
           ▼
[4. Explainable AI (XAI) Reason Generator]
  - Heuristic / LLM synthesized plain-English explanation
  - Specific discrepancy breakdown (e.g. "Sensor claims +45% CO2 capture, but satellite biomass index shows 0% growth")
           │
           ▼
[5. Verifier Assignment Matrix (Module 112)]
  - If Confidence < 85%: Ranks available staked verifiers by specialization match, reputation score, and active stake.
```

## 3. Input & Output API Schema

### Service Endpoint: `POST /score`

**Input Payload:**
```json
{
  "bundleId": "0x4a9f...",
  "projectId": "0x1b2c...",
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
      "timestamp": 1726000000
    }
  ]
}
```

**Output Response:**
```json
{
  "bundleId": "0x4a9f...",
  "confidenceScore": 94,
  "riskLevel": "LOW",
  "autoMintEligible": true,
  "verifierRequired": false,
  "anomalyFlags": [],
  "explanationReason": "High multi-source consistency. In-situ flux sensors and Sentinel-2 canopy delta corroborate claimed 500 tCO2e capture within 2.3% margin of error.",
  "recommendedVerifier": null,
  "executionTimeMs": 42
}
```

## 4. Test Scenarios for Hackathon Demo

1. **Scenario A (Clean / Auto-Mint Pass):**
   - Inputs: Sensors, satellite NDVI, and operational docs corroborate each other within 5% tolerance.
   - Result: `confidenceScore = 94%`, `riskLevel = "LOW"`, `autoMintEligible = true`.
2. **Scenario B (Anomalous / Verifier Escalation Pass):**
   - Inputs: Sensors claim 1000 tCO2e increase, but satellite NDVI reports severe canopy degradation.
   - Result: `confidenceScore = 38%`, `riskLevel = "HIGH"`, `verifierRequired = true`, `explanationReason = "Critical divergence: Sensor flux claims +1000 tCO2e while satellite vegetation index reflects 15% deforestation."`
