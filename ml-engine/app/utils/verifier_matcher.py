"""
Carbonyx Verifier Matcher Module

Multi-criteria verifier assignment algorithm:
Matches low/medium confidence evidence bundles requiring human verification
to active staked verifiers in the network, prioritized by:
  1. Domain specialization match (e.g. REFORESTATION, BLUE_CARBON, AFOLU)
  2. Reputation score (higher is prioritized)
  3. Staked collateral (minimum 0.1 ETH / collateral threshold)
  4. Workload balance
"""

import logging
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback pre-qualified verifiers (Anvil demo accounts) if Supabase is offline or empty
DEFAULT_VERIFIERS = [
    {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",  # Anvil Account #1
        "name": "Verra EcoAudit Labs",
        "specialization": "REFORESTATION",
        "reputation_score": 98,
        "staked_amount": 2.5,
        "active": True,
    },
    {
        "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",  # Anvil Account #2
        "name": "GoldStandard Oceanic Verifications",
        "specialization": "BLUE_CARBON",
        "reputation_score": 95,
        "staked_amount": 5.0,
        "active": True,
    },
    {
        "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",  # Anvil Account #3
        "name": "Climeworks Industrial Capture Audit",
        "specialization": "METHANE_CAPTURE",
        "reputation_score": 92,
        "staked_amount": 1.0,
        "active": True,
    },
    {
        "address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",  # Anvil Account #4
        "name": "TÜV SÜD CleanTech Verification",
        "specialization": "RENEWABLE_ENERGY",
        "reputation_score": 96,
        "staked_amount": 3.0,
        "active": True,
    },
]


class VerifierMatcher:
    """
    Selects the optimal independent staked verifier to assign
    for secondary manual review when evidence confidence falls below 85%.
    """

    def __init__(self):
        self._supabase_client = None
        self._init_supabase()

    def _init_supabase(self):
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                from supabase import create_client
                self._supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
            except Exception as e:
                logger.warning(f"Could not connect to Supabase for verifier querying: {e}")
                self._supabase_client = None

    def match_verifier(self, project_type: str) -> Optional[str]:
        """
        Finds the highest-reputation active staked verifier matching the project type.
        Returns the Ethereum address of the selected verifier.
        """
        norm_type = project_type.upper().replace(" ", "_")
        if "FOREST" in norm_type or "AFOLU" in norm_type:
            target_spec = "REFORESTATION"
        elif "OCEAN" in norm_type or "BLUE" in norm_type or "MANGROVE" in norm_type:
            target_spec = "BLUE_CARBON"
        elif "METHANE" in norm_type or "GAS" in norm_type:
            target_spec = "METHANE_CAPTURE"
        else:
            target_spec = "RENEWABLE_ENERGY"

        # 1. Try querying active verifiers from Supabase
        if self._supabase_client:
            try:
                res = (
                    self._supabase_client.table("verifier_stakes")
                    .select("verifier_address, staked_amount, reputation_score, specialization, active_in_pool")
                    .eq("active_in_pool", True)
                    .gte("staked_amount", 0.1)
                    .order("reputation_score", desc=True)
                    .execute()
                )
                candidates = res.data or []
                # Try exact specialization match
                spec_matches = [c for c in candidates if c.get("specialization") == target_spec]
                if spec_matches:
                    return spec_matches[0]["verifier_address"]
                if candidates:
                    return candidates[0]["verifier_address"]
            except Exception as e:
                logger.warning(f"Error querying verifier_stakes from Supabase: {e}")

        # 2. Fallback to pre-qualified verifiers list
        spec_matches = [v for v in DEFAULT_VERIFIERS if v["specialization"] == target_spec and v["active"]]
        if spec_matches:
            best = max(spec_matches, key=lambda v: v["reputation_score"])
            return best["address"]

        # Default fallback to Account #1
        return DEFAULT_VERIFIERS[0]["address"]
