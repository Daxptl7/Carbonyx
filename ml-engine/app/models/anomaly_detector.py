"""
Carbonyx Isolation Forest Anomaly Detector (Patent Module 110)

Multi-variate outlier detection on carbon credit evidence bundles.
Uses an ensemble approach:
  1. Isolation Forest for multivariate outlier detection
  2. Statistical Z-Score boundary checking
  3. Rule-based domain limits (thermodynamic & ecological ceilings)

Scoring: Base score of 100 with deductions for each anomaly detected.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Tuple

# --- Domain boundary limits (thermodynamic / ecological ceilings) ---
DOMAIN_LIMITS = {
    "REFORESTATION": {
        "max_co2_flux_ppm": 600.0,
        "min_co2_flux_ppm": 50.0,
        "max_tonnage_per_hectare": 40.0,      # tCO2e/ha/yr realistic ceiling
        "max_ndvi_delta": 0.60,                # seasonal NDVI swing ceiling
        "min_ndvi_delta": -0.10,               # slight degradation tolerable
    },
    "BLUE_CARBON": {
        "max_co2_flux_ppm": 500.0,
        "min_co2_flux_ppm": 30.0,
        "max_tonnage_per_hectare": 25.0,
        "max_ndvi_delta": 0.40,
        "min_ndvi_delta": -0.15,
    },
    "METHANE_CAPTURE": {
        "max_co2_flux_ppm": 800.0,
        "min_co2_flux_ppm": 100.0,
        "max_tonnage_per_hectare": 80.0,
        "max_ndvi_delta": 0.50,
        "min_ndvi_delta": -0.20,
    },
    "RENEWABLE_ENERGY": {
        "max_co2_flux_ppm": 700.0,
        "min_co2_flux_ppm": 0.0,
        "max_tonnage_per_hectare": 60.0,
        "max_ndvi_delta": 0.50,
        "min_ndvi_delta": -0.30,
    },
}


class AnomalyDetector:
    """
    Isolation Forest-based multivariate anomaly detector for carbon
    credit evidence bundles. Operates on extracted feature vectors
    from IoT, satellite, and operational document evidence items.
    """

    def __init__(self, contamination: float = 0.15, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_state,
        )
        self._fit_baseline()

    def _fit_baseline(self):
        """
        Fit the Isolation Forest on a synthetic baseline distribution
        representing 'normal' carbon credit evidence signatures.
        In production this would be trained on historical verified bundles.
        """
        rng = np.random.RandomState(42)
        n_samples = 200

        # Features: [co2_flux, ndvi_delta, tonnage_deviation_pct, source_count]
        normal_data = np.column_stack([
            rng.normal(loc=400, scale=40, size=n_samples),     # co2_flux
            rng.normal(loc=0.18, scale=0.06, size=n_samples),  # ndvi_delta
            rng.normal(loc=0.0, scale=5.0, size=n_samples),    # tonnage_deviation_%
            rng.choice([2, 3], size=n_samples),                 # source_count
        ])
        self.model.fit(normal_data)

    def extract_features(
        self,
        evidence_items: List[Dict],
        declared_tonnage: float,
    ) -> np.ndarray:
        """
        Extract a feature vector from raw evidence items.
        Returns shape (1, 4): [co2_flux, ndvi_delta, tonnage_dev_pct, source_count]
        """
        co2_flux = 0.0
        ndvi_delta = 0.0
        avg_tonnage = 0.0
        tonnage_values = []
        source_count = len(evidence_items)

        for item in evidence_items:
            src = item.get("sourceType", "")
            metric = item.get("metric", "")
            value = item.get("value", 0.0)
            calc_tonnage = item.get("calculatedTonnage", 0.0)

            if src == "IOT_SENSOR" and "co2" in metric.lower():
                co2_flux = value
            elif src == "SATELLITE_NDVI" and "ndvi" in metric.lower():
                ndvi_delta = value
            elif src == "SATELLITE_NDVI" and "canopy" in metric.lower():
                ndvi_delta = value

            if calc_tonnage > 0:
                tonnage_values.append(calc_tonnage)

        if tonnage_values:
            avg_tonnage = np.mean(tonnage_values)

        tonnage_dev_pct = 0.0
        if declared_tonnage > 0:
            tonnage_dev_pct = ((avg_tonnage - declared_tonnage) / declared_tonnage) * 100.0

        return np.array([[co2_flux, ndvi_delta, tonnage_dev_pct, source_count]])

    def detect(
        self,
        evidence_items: List[Dict],
        declared_tonnage: float,
        project_type: str = "REFORESTATION",
    ) -> Tuple[int, List[str]]:
        """
        Run the full anomaly detection pipeline.

        Returns:
            score_deduction (int): Total points to deduct from base score of 100
            anomaly_flags (List[str]): Human-readable flags for each anomaly found
        """
        features = self.extract_features(evidence_items, declared_tonnage)
        anomaly_flags: List[str] = []
        total_deduction = 0

        # --- 1. Isolation Forest prediction ---
        prediction = self.model.predict(features)       # -1 = outlier, 1 = inlier
        anomaly_score = self.model.decision_function(features)[0]

        if prediction[0] == -1:
            severity = min(30, int(abs(anomaly_score) * 100))
            total_deduction += severity
            anomaly_flags.append(
                f"ISOLATION_FOREST_OUTLIER: Multivariate feature vector flagged as statistical outlier "
                f"(anomaly_score={anomaly_score:.3f}, deduction={severity}pts)"
            )

        # --- 2. Z-Score / deviation checks ---
        tonnage_dev = features[0, 2]  # tonnage deviation %
        if abs(tonnage_dev) > 15.0:
            deduction = min(25, int(abs(tonnage_dev) - 15) + 10)
            total_deduction += deduction
            anomaly_flags.append(
                f"TONNAGE_DEVIATION: Calculated tonnage deviates {tonnage_dev:+.1f}% from declared "
                f"{declared_tonnage:.0f} tCO2e (threshold: ±15%, deduction={deduction}pts)"
            )

        # --- 3. Domain boundary checks ---
        limits = DOMAIN_LIMITS.get(project_type, DOMAIN_LIMITS["REFORESTATION"])
        co2_flux = features[0, 0]
        ndvi_delta = features[0, 1]

        if co2_flux > 0 and co2_flux > limits["max_co2_flux_ppm"]:
            total_deduction += 15
            anomaly_flags.append(
                f"CO2_FLUX_EXCEEDS_CEILING: Sensor CO2 flux {co2_flux:.1f} ppm exceeds "
                f"ecological limit {limits['max_co2_flux_ppm']:.0f} ppm for {project_type} (deduction=15pts)"
            )

        if co2_flux > 0 and co2_flux < limits["min_co2_flux_ppm"]:
            total_deduction += 10
            anomaly_flags.append(
                f"CO2_FLUX_BELOW_FLOOR: Sensor CO2 flux {co2_flux:.1f} ppm below "
                f"minimum {limits['min_co2_flux_ppm']:.0f} ppm for {project_type} (deduction=10pts)"
            )

        if ndvi_delta != 0.0 and ndvi_delta > limits["max_ndvi_delta"]:
            total_deduction += 10
            anomaly_flags.append(
                f"NDVI_EXCEEDS_CEILING: Satellite NDVI delta {ndvi_delta:.3f} exceeds "
                f"seasonal limit {limits['max_ndvi_delta']:.2f} for {project_type} (deduction=10pts)"
            )

        if ndvi_delta != 0.0 and ndvi_delta < limits["min_ndvi_delta"]:
            total_deduction += 20
            anomaly_flags.append(
                f"NDVI_NEGATIVE_GROWTH: Satellite NDVI delta {ndvi_delta:.3f} indicates "
                f"vegetation loss below {limits['min_ndvi_delta']:.2f} threshold (deduction=20pts)"
            )

        # --- 4. Insufficient sources penalty ---
        source_count = int(features[0, 3])
        if source_count < 2:
            total_deduction += 15
            anomaly_flags.append(
                f"INSUFFICIENT_SOURCES: Only {source_count} evidence source(s) provided, "
                f"minimum 2 required for cross-validation (deduction=15pts)"
            )

        return total_deduction, anomaly_flags
