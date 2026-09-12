"""
Carbonyx N-of-M Cross-Source Correlation Checker

Cross-validates IoT ground sensors against Satellite NDVI data to ensure
the sensor-to-satellite tonnage delta is ≤ 15%.

If only one source type provides tonnage, correlation cannot be performed
and a warning flag is raised instead of a hard failure.
"""

from typing import List, Dict, Tuple
import math


# Maximum acceptable tonnage deviation between any two independent sources
CORRELATION_THRESHOLD_PCT = 15.0


class CorrelationChecker:
    """
    N-of-M cross-source correlation analyzer.

    Groups evidence items by sourceType, extracts calculatedTonnage from each,
    and checks pairwise deviations. If any pair exceeds the 15% threshold,
    the correlation check fails.
    """

    def check(
        self,
        evidence_items: List[Dict],
        declared_tonnage: float,
    ) -> Tuple[bool, float, List[str]]:
        """
        Run the correlation check.

        Args:
            evidence_items: List of evidence item dicts with sourceType, calculatedTonnage, etc.
            declared_tonnage: The project's declared tCO2e.

        Returns:
            correlation_met (bool): True if all pairwise deviations are within threshold
            max_deviation_pct (float): The largest pairwise deviation found
            flags (List[str]): Human-readable descriptions of any correlation issues
        """
        # Group tonnage estimates by source type
        source_tonnages: Dict[str, List[float]] = {}
        for item in evidence_items:
            src = item.get("sourceType", "UNKNOWN")
            tonnage = item.get("calculatedTonnage", 0.0)
            if tonnage > 0:
                source_tonnages.setdefault(src, []).append(tonnage)

        # Compute average tonnage per source type
        source_averages: Dict[str, float] = {}
        for src, values in source_tonnages.items():
            source_averages[src] = sum(values) / len(values)

        flags: List[str] = []
        max_deviation_pct = 0.0
        correlation_met = True

        source_types = list(source_averages.keys())

        # --- Edge case: fewer than 2 source types with tonnage ---
        if len(source_types) < 2:
            flags.append(
                f"SINGLE_SOURCE_TONNAGE: Only {len(source_types)} source type(s) "
                f"provided calculatedTonnage — cross-source validation not possible"
            )
            # Fall back to comparing the single source against declaredTonnage
            if source_types and declared_tonnage > 0:
                solo_avg = source_averages[source_types[0]]
                dev = abs(solo_avg - declared_tonnage) / declared_tonnage * 100.0
                max_deviation_pct = dev
                if dev > CORRELATION_THRESHOLD_PCT:
                    correlation_met = False
                    flags.append(
                        f"DECLARED_DEVIATION: {source_types[0]} avg tonnage "
                        f"({solo_avg:.1f}) deviates {dev:.1f}% from declared "
                        f"{declared_tonnage:.1f} tCO2e (threshold: {CORRELATION_THRESHOLD_PCT}%)"
                    )
            return correlation_met, max_deviation_pct, flags

        # --- Pairwise comparison across all source types ---
        for i in range(len(source_types)):
            for j in range(i + 1, len(source_types)):
                src_a = source_types[i]
                src_b = source_types[j]
                avg_a = source_averages[src_a]
                avg_b = source_averages[src_b]

                reference = max(avg_a, avg_b)
                if reference == 0:
                    continue

                deviation_pct = abs(avg_a - avg_b) / reference * 100.0
                max_deviation_pct = max(max_deviation_pct, deviation_pct)

                if deviation_pct > CORRELATION_THRESHOLD_PCT:
                    correlation_met = False
                    flags.append(
                        f"CROSS_SOURCE_MISMATCH: {src_a} ({avg_a:.1f} tCO2e) vs "
                        f"{src_b} ({avg_b:.1f} tCO2e) — deviation {deviation_pct:.1f}% "
                        f"exceeds {CORRELATION_THRESHOLD_PCT}% threshold"
                    )
                else:
                    flags.append(
                        f"CORRELATION_OK: {src_a} ({avg_a:.1f}) ↔ {src_b} ({avg_b:.1f}) "
                        f"— delta {deviation_pct:.1f}% within tolerance"
                    )

        # --- Also check each source against declared tonnage ---
        for src, avg in source_averages.items():
            if declared_tonnage > 0:
                dev = abs(avg - declared_tonnage) / declared_tonnage * 100.0
                if dev > CORRELATION_THRESHOLD_PCT:
                    correlation_met = False
                    max_deviation_pct = max(max_deviation_pct, dev)
                    flags.append(
                        f"DECLARED_MISMATCH: {src} avg ({avg:.1f}) deviates "
                        f"{dev:.1f}% from declared {declared_tonnage:.1f} tCO2e"
                    )

        return correlation_met, max_deviation_pct, flags
