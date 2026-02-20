# Research Summary: BYOK Credential Management for Malice

**Domain:** LLM API Credential Management (Trial + Freemium)
**Researched:** 2026-01-24
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

Production BYOK systems (OpenRouter, Portkey, LiteLLM) use a consistent pattern: virtual key indirection (hiding raw credentials), encrypted storage at rest, immediate validation on credential add, and multi-gate trial enforcement (both action count AND time limit). The research reveals that credential management in BYOK systems is less about complexity and more about consistency - ensuring all code paths enforce the same trial rules and that decrypted keys never linger in memory.

For Malice's 50-actions-OR-30-minutes trial system, the key insight is **dual-gate enforcement**: both conditions must pass before allowing an LLM call. Off-by-one errors are common in trial systems. Provider error translation (converting technical API errors into player-friendly messages) is critical for UX - raw provider errors confuse players.

The architecture pattern is simple: (1) Credential Storage (encrypted), (2) Trial Gate (check before any LLM call), (3) Key Validation (test on add, trust until failure), (4) Error Translation (player-facing messages). All critical pitfalls stem from violating these patterns - caching decrypted keys, skipping the trial gate in some code paths, or exposing raw provider errors.

## Key Findings

**Stack:** AES-256 encryption at rest, stateless trial gate (no caching), virtual key indirection pattern, encrypted MongoDB storage

**Architecture:** Four-component pattern: Credential Manager (storage) → Trial Gate → Key Validation → Error Translation. All LLM entry points must route through trial gate.

**Critical pitfall:** Caching decrypted keys in memory extends exposure window; benchmark decryption first (AES-256: ~5ms acceptable)

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Foundation (Credential & Trial Storage)**
   - Design: Define trial clearly (wall-clock time OR action count, both must pass)
   - Implement: Player.apiCredentials property + Player.trial properties
   - Implement: AES-256 encryption/decryption for keys
   - Implement: Trial counter and expiry tracking
   - Addresses: All core table-stakes features, prevents most pitfalls
   - Avoids: Pitfall of unclear trial duration; pitfall of caching decrypted keys

2. **Phase 2: Credential Management UI (Terminal Settings)**
   - Design: @settings menu integration via $.prompt.menu()
   - Implement: Add/Remove/List credentials
   - Implement: Immediate validation on add (small API test call)
   - Implement: Error translation for validation failures
   - Addresses: Player-facing UX, validation feedback, error guidance
   - Avoids: Pitfall of confusing error messages; pitfall of expired keys in list

3. **Phase 3: Trial Enforcement & Gating**
   - Design: Identify all LLM entry points (narration, direct calls, MCP)
   - Implement: Trial gate before EACH LLM call
   - Implement: Both action + time checks (neither can bypass)
   - Implement: Clear "trial exhausted" messages with upgrade guidance
   - Addresses: Prevents abuse, enforces business model
   - Avoids: Pitfall of trial not enforced in all paths; pitfall of off-by-one errors

4. **Phase 4: Monitoring & Graceful Degradation**
   - Implement: Audit logs (all credential operations)
   - Implement: Request tracking (which player used which key)
   - Implement: Fallback chain (BYOK → trial house key → rejection)
   - Implement: Provider error monitoring (detect patterns, alert on issues)
   - Addresses: Observability, debugging, incident response
   - Avoids: Pitfall of no audit trail; pitfall of cryptic provider errors

**Phase ordering rationale:**
- Foundation first (encryption + trial logic) is prerequisite for all others
- UI (Phase 2) depends on foundation; players need to add keys
- Gating (Phase 3) depends on both; must check trial for all paths
- Monitoring (Phase 4) is observability; doesn't block earlier phases

**Research flags for phases:**
- Phase 1: Standard encryption patterns, unlikely to need research
- Phase 2: Terminal UI integration - verify $.prompt.menu() API (library-specific)
- Phase 3: Critical integration point - needs comprehensive audit of all LLM entry points
- Phase 4: Monitoring/observability - standard patterns, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | AES-256 is standard; OpenRouter/Portkey/LiteLLM all use encrypted MongoDB + virtual keys |
| Features | MEDIUM-HIGH | Table stakes clear; differentiators depend on scope; verified with production systems |
| Architecture | MEDIUM-HIGH | Four-component pattern verified across OpenRouter/Portkey/LiteLLM; trial gating pattern confirmed |
| Pitfalls | HIGH | Critical pitfalls (caching keys, skipping trial gate, error translation) confirmed across multiple sources |

## Gaps to Address

- **Multi-Provider Support (post-MVP):** Research needed on provider-agnostic key validation if supporting OpenAI, Anthropic, Bedrock simultaneously
- **Cost Tracking:** Provider pricing APIs vary (OpenAI v1, Anthropic v1, Bedrock differently); research needed for accurate cost attribution
- **Key Rotation Strategy:** Implemented but requires testing with real keys and backup procedures
- **Terminal UI Library:** Verify $.prompt.menu() API in codebase before Phase 2 implementation

## Success Criteria

Research is complete when implementation can proceed with:
1. Clear definition of trial system (50 actions AND 30 minutes wall-clock)
2. Identified all LLM entry points (narration, direct MCP, etc.)
3. Error translation map for common provider failures
4. Encryption strategy documented (master key rotation, test plans)
5. Design review confirms no credential caching in memory

