# AI Coding Guidelines

## 1. Core Directives for AI Coding Agents

1. **Strict Spec Compliance:** Never introduce ad-hoc features, alter function signatures, or modify database models without consulting and updating the respective specification document.
2. **Preserve Patent Integrity:** Ensure every developed component maps cleanly back to its designated Patent Module (102 through 124).
3. **No Black-Box Logic:** Any AI or analytical component must return structured confidence metrics and human-readable explanation strings.
4. **Defensive Smart Contract Design:**
   - Always adhere to Checks-Effects-Interactions (CEI).
   - Use OpenZeppelin `ReentrancyGuard` on all state-changing financial functions (`stake`, `unstake`, `buyWithEscrow`, `releaseEscrow`, `refundEscrow`).
   - Use custom errors instead of `require(string)` to optimize gas.
5. **Fail Loud and Explicitly:** In backend and frontend code, surface exact failure causes (e.g. `InsufficientVerifierStake`, `DiscrepancyBetweenSensorAndSatellite`) rather than generic error banners.
6. **Test-Driven Verification:** Accompany all contract additions with Foundry unit tests, all ML additions with Pytest test cases, and all API endpoints with integration tests.
