# AI/ML Specification

## 1. Objective

Detect inconsistencies and suspicious environmental evidence, and produce a confidence score plus a human-readable reason that determines whether a bundle auto-issues or escalates to a human verifier.

This module implements the patent's Multi-Source Correlation, Risk Assessment and Anomaly Detection Engine (Module 110). Per the Project Constitution (Section 7), it must never return a black-box pass/fail — every result carries a numeric score, a risk classification, and a plain-language reason.

The AI/ML Service does **not** decide correlation-threshold pass/fail (that is the backend Evidence Service's N-of-M diversity check, per Technical Architecture Section 5 and 09 Smart Contract Spec's `correlationThresholdMet` field). The AI/ML Service decides `confidenceThresholdMet` and the escalation recommendation.

## 2. Inputs

The service receives one standardized, already integrity-checked evidence bundle (failed-integrity items have already been excluded upstream by the Cryptographic Validation Engine, per 05_USER_FLOWS Flow 3). Fields per evidence item:

- **sourceType** — `sensor | satellite | verifier_attestation | documentation`
- **sensor readings** — structured numeric measurements (e.g., estimated CO2e captured/avoided, area covered, measurement device ID)
- **project report values** — issuer-submitted claimed figures (from `documentation` source type: claimed CO2e, claimed area, claimed activity dates)
- **external/reference measurements** — satellite/remote-sensing change-detection output (e.g., estimated biomass/area change, independent CO2e estimate)
- **timestamps** — `submittedAt` per item, plus the project's declared monitoring-period start/end
- **project metadata** — `projectType` (reforestation, renewable_energy, methane_capture, other), `location`, `baselineDescription` — used only as categorical context, never as a trust signal on their own

Bundle-level input also includes `bundleId`, `projectId`, and the list of `sourceTypesPresent` (for context; diversity pass/fail itself is decided by the backend before this service is called).

## 3. Feature Engineering

Each evidence bundle is reduced to a fixed-length numeric feature vector before scoring. All monetary/quantity values are normalized to tonnes CO2e for cross-source comparability.

| Feature | Description | Source |
|---|---|---|
| `co2e_sensor` | Sensor-estimated CO2e for the period | sensor |
| `co2e_satellite` | Satellite/remote-sensing-estimated CO2e for the period | satellite |
| `co2e_documentation` | Issuer-claimed CO2e for the period | documentation |
| `co2e_pairwise_deviation` | Max relative % deviation between any two available `co2e_*` values | derived |
| `area_reported_vs_detected` | % difference between claimed project area (documentation) and satellite-detected area, if both present | derived |
| `source_count` | Number of distinct source types present in the bundle | all |
| `timestamp_spread_hours` | Max gap between earliest and latest item `submittedAt` within the bundle | all |
| `monitoring_period_fit` | 1 if all item timestamps fall inside the project's declared monitoring period, else 0 | all |
| `verifier_attestation_present` | 1 if a `verifier_attestation` item is present, else 0 | verifier_attestation |
| `historical_baseline_deviation` | % deviation from this project's prior accepted bundle's CO2e figure, if a prior bundle exists (else null/neutral) | derived, historical |

Missing values (a source type absent, or no prior bundle for baseline comparison) are represented as an explicit `null`/"not applicable" feature state, not zero — zero is a valid, meaningfully different measurement and must never silently stand in for missing data (Section 13 covers handling).

## 4. Validation Rules

Deterministic checks applied before any model scoring. These are cheap, explainable, and catch obvious problems without needing the anomaly model:

- Every numeric value must be non-negative and within a plausible physical range for its `projectType` (e.g., CO2e claim not exceeding a configurable sanity ceiling for the project's declared scale) — violation → hard flag, `severity: high`.
- Every item's timestamp must fall within the project's declared monitoring period — violation → `monitoring_period_fit = 0`, contributes to `temporal_consistency` penalty (Section 8).
- At least one `co2e_*`-bearing source type must be present — if the bundle reaches this service with zero quantitative sources (should not happen if the backend's N-of-M gate ran correctly), the service returns a hard escalation with `reason: "no quantitative evidence source available"` rather than attempting to score.
- Evidence items already marked `integrityStatus: FAILED` upstream must not appear in this service's input at all — if one is received (a contract-of-input violation), the service rejects the call with an error rather than scoring around it (fail loud, per Technical Architecture Section 9).

## 5. Anomaly Detection

**Model:** Isolation Forest (scikit-learn `IsolationForest`), supplemented by a per-feature z-score threshold check.

**Why:**
- Isolation Forest is unsupervised — no labeled fraud dataset is needed or available for a hackathon-scale seeded dataset, and it isolates outliers efficiently in low-to-moderate dimensional numeric feature spaces like the one in Section 3.
- It is fast enough for interactive/demo latency (Section 15) and deterministic given a fixed random seed, which matters for a live, repeatable demo.
- Its raw anomaly score alone is not human-readable, so it is paired with per-feature z-scores (computed against the seeded "clean" population, Section 14) to identify *which specific feature* drove the anomaly — this is what makes Section 11's explainability requirement possible. The isolation-forest score answers "is this bundle unusual overall"; the z-scores answer "unusual in what way," and the reason string is built from the latter.

Model output per bundle:
```
{
  "isolation_score": float,      // raw model output, more negative = more anomalous
  "is_outlier": bool,             // isolation_score below a fitted contamination threshold
  "feature_zscores": { "<feature_name>": float, ... }
}
```

## 6. Rule-Based Validation

Rule-based checks run alongside the model and can independently force an escalation regardless of model score (rules take precedence — a statistically "normal-looking" bundle can still be rejected on a hard rule):

- `co2e_pairwise_deviation` exceeds a configurable hard ceiling (e.g., >50%) → forced escalation, `severity: high`, regardless of isolation-forest outcome.
- `monitoring_period_fit == 0` for any item → forced escalation, `severity: medium`.
- Duplicate `payloadHash` reused from a prior bundle (any project) → forced escalation, `severity: high` — signals a resubmitted/copy-pasted evidence payload.
- `source_count < 2` reaching this service → forced escalation (defensive check; should already be caught by the backend's N-of-M gate).

## 7. Source Correlation

**Important distinction from the backend's correlation check:** the backend Evidence Service (07 Technical Architecture, Section 5) computes `correlationThresholdMet` as a binary **diversity** check — "are at least N of M source *types* present." That check happens before this service is ever called and is a separate on-chain field (09 Smart Contract Spec).

This service computes a **quantitative agreement** score — "given that the required source types are present, how closely do their independent CO2e estimates actually agree with each other." This is `source_correlation_score` in Section 8, and it is one input to the confidence score, not a gate on its own.

```
source_correlation_score = 100 - min(100, co2e_pairwise_deviation_pct)
```
A bundle can pass the backend's diversity gate (N-of-M sources present) and still receive a low `source_correlation_score` here if those sources disagree — this is precisely the "sensor and satellite readings diverge beyond tolerance" case described in 05_USER_FLOWS Flow 5.

## 8. Confidence Score

```
confidence_score =
    0.35 × source_correlation_score
  + 0.35 × anomaly_score
  + 0.20 × data_integrity_score
  + 0.10 × temporal_consistency_score
```

All four components are normalized to a 0–100 scale before weighting; `confidence_score` is therefore also 0–100.

- **`source_correlation_score`** — Section 7.
- **`anomaly_score`** — `100` if `is_outlier == false`; otherwise scaled down based on how far `isolation_score` falls below the fitted threshold (more negative → closer to 0). Any rule-based forced escalation (Section 6) caps `anomaly_score` at 40 regardless of the model's raw output.
- **`data_integrity_score`** — reflects the proportion of originally-submitted evidence items that survived upstream integrity checking (Cryptographic Validation Engine): `100 × (valid_items / total_submitted_items)`. A bundle where nothing failed integrity scores 100 here; a bundle where, say, 1 of 4 items was excluded scores 75.
- **`temporal_consistency_score`** — `100` if `monitoring_period_fit == 1` for all items and `timestamp_spread_hours` is within a configurable window (e.g., 72h); linearly penalized otherwise, floored at 0.

Weights are configuration, not hardcoded constants — they live in the service's config so they can be tuned against the seeded dataset (Section 14) without a code change.

## 9. Risk Classification

| Confidence Score | Risk Level |
|---|---|
| 80–100 | LOW |
| 50–79 | MEDIUM |
| 0–49 | HIGH |

Risk level is the human-facing label shown on the Confidence Gauge (06_UI_UX_SPECIFICATION, Section 6); `confidence_score` is the underlying number. Risk level is inversely related to confidence by construction.

## 10. Decision Thresholds

```
recommendation = "auto_approve" if (
    confidence_score >= AUTO_APPROVE_THRESHOLD (default 80)
    AND no anomaly with severity == "high"
) else "escalate"
```

- `AUTO_APPROVE_THRESHOLD` is configurable per Scope Spec's "configurable confidence threshold" language and the patent's alternative embodiment allowing category-specific thresholds (higher-risk project types may use a stricter threshold in a future iteration; the MVP uses a single global threshold).
- A high-severity rule-based flag (Section 6) always forces `escalate`, even if the numeric `confidence_score` happens to clear 80 — rules override the score, never the reverse.
- There is no `auto_reject` path in the MVP. The service only ever recommends `auto_approve` or `escalate`; outright rejection is always a human verifier decision (Flow 5), consistent with Technical Architecture Section 11 treating the AI output as an input to routing, not a final authority.

## 11. Explainability

Every response includes a `reason` string, generated from the single largest contributing factor to the score — never a generic "confidence below threshold."

**Generation rule:** identify the component (Section 8) with the lowest normalized sub-score; phrase the reason around that component's underlying feature(s).

Examples:
- `"Satellite evidence differs 64% from reported capture volume."` (low `source_correlation_score`, driven by `co2e_pairwise_deviation`)
- `"All sources consistent, no statistical outliers."` (high confidence, clean bundle — Flow 4's stated example)
- `"Evidence timestamp falls 9 days outside the declared monitoring period."` (low `temporal_consistency_score`)
- `"1 of 4 submitted evidence items failed integrity verification and was excluded."` (low `data_integrity_score`)

If more than one component is near-equally low, the reason string lists up to two, prioritized by weight (Section 8's weighting order).

## 12. API

Exposed as a single scoring endpoint, called by the backend after the Evidence Service has hashed, integrity-checked, and diversity-gated the bundle (per 07 Technical Architecture, Section 7, step 3).

### `POST /score`

**Request:**
```json
{
  "bundleId": "string",
  "projectId": "string",
  "projectType": "reforestation | renewable_energy | methane_capture | other",
  "monitoringPeriod": { "start": "ISO 8601", "end": "ISO 8601" },
  "priorBundle": { "co2eQuantity": "number | null" },
  "evidenceItems": [
    {
      "evidenceId": "string",
      "sourceType": "sensor | satellite | verifier_attestation | documentation",
      "payload": { "...": "source-type-specific structured data" },
      "payloadHash": "string",
      "submittedAt": "ISO 8601"
    }
  ]
}
```

**Response — 200 OK:**
```json
{
  "bundleId": "string",
  "confidenceScore": 0,
  "riskLevel": "LOW | MEDIUM | HIGH",
  "anomaliesDetected": [
    { "type": "string", "description": "string", "severity": "low | medium | high" }
  ],
  "reason": "string",
  "recommendation": "auto_approve | escalate",
  "modelVersion": "string",
  "scoredAt": "ISO 8601"
}
```

This response maps directly onto the `RiskAssessment` schema (08_DOMAIN_DATA_MODEL, Section 7); the backend persists it as-is and derives `bundles[bundleId].confidenceThresholdMet` and `verifierRequired` (09 Smart Contract Spec) from `recommendation`.

**Response — 4xx/5xx:** standard error envelope (Section 13).

## 13. Failure / Missing Data

Per Technical Architecture Section 9 ("fail loud, not silent") — this service must never guess:

- **Missing source type reaching this service** (should be pre-filtered by the backend's diversity gate, but defensively handled): return `recommendation: "escalate"` with `reason` naming the missing source type, not a numeric score computed on incomplete data.
- **No prior bundle for `historical_baseline_deviation`**: treat as neutral (excluded from scoring, not penalized) — a project's first bundle cannot be judged against a history that doesn't exist.
- **Model not yet fit / insufficient seed data to fit Isolation Forest** (Section 14 dataset unavailable at startup): fall back to rule-based-only scoring (Sections 4 and 6) with `anomaly_score` fixed at a neutral 60 and `modelVersion: "rule-based-fallback"` clearly marked in the response, so the backend/UI can surface that the ML layer degraded rather than silently trusting a stub score.
- **Service unreachable / timeout**: the backend (per 07 Technical Architecture Section 9) retries once, then surfaces a explicit "risk scoring unavailable" error to the issuer — this service never returns a default confidence score to mask an outage; there is no such thing as a default score in this API.
- **Malformed request** (missing required fields): `400` with a field-level error message, no partial scoring attempted.

## 14. Synthetic Dataset

Two dataset roles, kept separate:

1. **Model-fitting population** — a set of ~30–50 synthetic "clean" bundles (varied `projectType`, varied but internally-consistent `co2e_*` values, tight `co2e_pairwise_deviation`, timestamps inside their monitoring periods) used to fit the Isolation Forest's baseline notion of "normal" and to compute the z-score population statistics referenced in Section 5. Generated programmatically with small randomized noise around plausible per-project-type baselines, not hand-authored one by one.
2. **Demo bundles** — the two specific, hand-crafted bundles referenced in 02_PRODUCT_SPECIFICATION Section 14 and 03_SCOPE_SPECIFICATION item 5: one clean bundle engineered to score in the LOW-risk/auto-approve range, and one anomalous bundle engineered so `co2e_pairwise_deviation` clearly exceeds tolerance (e.g., sensor vs. satellite reporting figures roughly 60%+ apart) to guarantee it lands in HIGH risk with a specific, demo-legible reason string. These are fixed, version-controlled fixtures — not regenerated randomly — so the live demo is reproducible every run.

Exact seed values (specific numbers, units, and per-project-type baselines) are defined in the forthcoming Seed/Demo Data Specification, which this document should be read alongside.

## 15. Evaluation Metrics

Given a small seeded dataset and no labeled ground-truth fraud corpus, formal precision/recall is not meaningful at hackathon scale. Evaluation instead targets:

- **Separation:** the clean demo bundle and anomalous demo bundle must land in different risk tiers (LOW vs. HIGH) with a clear numeric gap (target: ≥30-point `confidenceScore` difference) — this is the single metric the demo actually depends on.
- **Determinism:** identical input produces identical output across repeated calls (fixed random seed on the Isolation Forest) — required for a reliable live demo.
- **Latency:** `P95 < 2s` per `/score` call against the seeded model, since this sits in the live UI's Validation & Risk Result screen loading path (06_UI_UX_SPECIFICATION).
- **No silent degradation:** any fallback path (Section 13) must be visibly flagged in the response, never indistinguishable from a normal model-backed score.

## 16. Test Cases

| ID | Scenario | Expected Result |
|---|---|---|
| TC1 | Clean bundle: all sources present, `co2e_pairwise_deviation` small, timestamps in-period | `recommendation: auto_approve`, `riskLevel: LOW`, reason cites source consistency |
| TC2 | Anomalous bundle: sensor and satellite CO2e diverge >50% | `recommendation: escalate`, `riskLevel: HIGH`, reason names the specific deviation and % |
| TC3 | Bundle missing a required source type (defensive case) | `recommendation: escalate`, reason names missing source type, no numeric score fabricated |
| TC4 | Bundle where 1 of 4 items already excluded upstream for failed integrity | Scoring proceeds on remaining valid items; `data_integrity_score` reduced; reason may cite the exclusion if it's the dominant factor |
| TC5 | Item timestamp outside declared monitoring period | Forced escalation regardless of other scores (Section 6), reason names the timestamp mismatch |
| TC6 | Duplicate `payloadHash` reused from a different bundle | Forced escalation, `severity: high`, reason flags reused evidence |
| TC7 | AI/ML service unreachable (simulated outage) | Backend retries once, then surfaces "risk scoring unavailable" — no default/fabricated score returned |
| TC8 | Model-fitting dataset unavailable at service startup | Falls back to rule-based-only scoring, `modelVersion: "rule-based-fallback"` clearly present in response |
| TC9 | Repeated call with identical bundle input | Identical `confidenceScore` and `reason` returned both times (determinism check) |
| TC10 | Bundle with no prior project history (`priorBundle: null`) | `historical_baseline_deviation` excluded from scoring, not penalized as missing |
