# Project: BYOK Scaling Infrastructure

## What This Is

**Current bottleneck:** Shared Anthropic API key hit rate limits at 0.8 concurrent players. Every player action requires AI narration, and the single key can't keep up.

**Solution:** Bring Your Own Key (BYOK) architecture that routes player actions through their own API credentials, removing the shared bottleneck and enabling unlimited scaling.

## Core Value

**Players provide their own Anthropic API keys.** Their actions use their credentials, hit their rate limits, charge their account. The server becomes a coordinator, not a bottleneck.

## Why This Matters

- **Scaling:** From 0.8 concurrent players to unlimited (bounded by individual player limits, not shared pool)
- **Cost:** Server costs become fixed (infrastructure only), not variable per-player
- **Audience:** Self-selects for engaged players willing to pay for AI access
- **Flexibility:** Support multiple providers (Anthropic direct, AWS Bedrock, GCP Vertex AI) for enterprise players with existing cloud credits

## Success Criteria

After Phase 2 completion:
- New player can start trial → play for 50 actions or 30 min → hit trial limit → add API key via `@settings` → continue playing
- Existing `$aiQuery()` calls work unchanged (backward compatible)
- Player actions route through their own credentials seamlessly (no API changes)
- Multiple concurrent players don't impact each other's rate limits
- Server can support 10+ concurrent players without degradation

## Constraints

### Technical
- Must work with existing MOO architecture (`$aiQuery`, session management)
- Must support session history ownership (model can change mid-conversation)
- Must support prompt caching for cost efficiency
- No external dependencies like LiteLLM proxy (direct SDK calls only)

### Business
- Trial system must prevent abuse (time AND action limits)
- Keys must be encrypted at rest
- Invalid/expired keys must fail gracefully with clear instructions

### User Experience
- Existing gameplay unaffected (no API changes for MOO code)
- Settings menu uses existing `$.prompt.menu()` system (no new UI paradigm)
- Error messages must be clear and actionable

## Out of Scope

- Model tier assignment strategy (everything defaults to haiku for now)
- Automatic model routing based on complexity (future phase)
- Cost tracking/budgeting per player (future phase)
- Alternative LLM providers (OpenAI, Google) - Anthropic models only
- Web-based settings UI (terminal-only for now)

## Open Questions

None - requirements are clear from playtesting.

## Context

### Current Architecture
- `$aiQuery(systemPrompt, prompt, session?, options?)` uses Agent SDK
- Single shared `ANTHROPIC_API_KEY` from environment
- Rate limits: ~50 RPM shared across all players
- Session management via Agent SDK (we don't own conversation history)

### Playtesting Results
- 0.8 concurrent players before rate limit errors
- Every command requires AI call (look, move, talk, interact)
- Players hitting "please try again" messages constantly

### Research Findings
From `.planning/codebase/`:
- Existing `$aiQuery` in `src/database/object-manager.ts`
- Player object system supports custom properties
- `$.prompt` utility for menu-driven interaction
- No existing credential management

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| BYOK required (minimal house keys) | Trial prevents abuse, BYOK enables scaling | 50 actions or 30 min trial, then require key |
| Direct SDK calls (no LiteLLM) | Simpler, less latency, we control routing | Call Anthropic SDK directly |
| Support 3 providers | Players may have AWS/GCP credits | Anthropic direct, Bedrock, Vertex AI |
| Model param defaults to haiku | Assess tier assignment later | Phase 1: infrastructure only, all haiku |
| `$.prompt.menu()` for settings | Consistent with existing UX | No AI-driven settings, use existing prompt system |
| Test keys on add | Fail fast, clear errors | Small API call to validate before storing |

---
*Last updated: 2026-01-24 after initialization*
