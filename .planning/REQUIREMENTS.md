# Requirements: BYOK Scaling Infrastructure

**Project:** Enable unlimited player scaling via Bring Your Own Key (BYOK)
**Created:** 2026-01-24
**Status:** Initial planning phase

## Functional Requirements

### FR-1: Trial System
- **FR-1.1:** New players start with house API key providing 50 actions OR 30 minutes of play
- **FR-1.2:** Trial limit must check BOTH conditions (actions AND time) - neither can bypass the other
- **FR-1.3:** When trial exhausted, display clear message pointing to `@settings` command
- **FR-1.4:** Trial counter must persist across sessions (MongoDB storage)
- **FR-1.5:** Trial expiry uses wall-clock time from first connection, not cumulative playtime

### FR-2: Credential Management
- **FR-2.1:** Players can add their own API credentials via `@settings` menu
- **FR-2.2:** Support 3 providers: Anthropic direct, AWS Bedrock, GCP Vertex AI
- **FR-2.3:** Credentials encrypted at rest using AES-256
- **FR-2.4:** Immediate validation on credential add (small test API call)
- **FR-2.5:** Players can list, remove, and update their stored credentials
- **FR-2.6:** Virtual key indirection (players never see raw keys after initial add)

### FR-3: Model Routing
- **FR-3.1:** `$aiQuery` accepts optional `model` parameter: `'haiku' | 'sonnet' | 'opus'`
- **FR-3.2:** Default model is `haiku` for cost efficiency
- **FR-3.3:** Model tier selection is explicit (caller controls, not automatic classification)
- **FR-3.4:** Model can change mid-conversation (session history owned by application, not Agent SDK)

### FR-4: Session Management
- **FR-4.1:** Application owns conversation history (not Agent SDK)
- **FR-4.2:** Session history stored in MongoDB for persistence
- **FR-4.3:** Provider calls are stateless (full history passed on each request)
- **FR-4.4:** Support prompt caching for 90% cost reduction on repeated context

### FR-5: Error Handling
- **FR-5.1:** Translate technical provider errors into player-friendly messages
- **FR-5.2:** Invalid/expired keys fail gracefully with clear instructions
- **FR-5.3:** Rate limit errors suggest waiting or upgrading API tier
- **FR-5.4:** Network errors trigger automatic retry with exponential backoff

### FR-6: Settings UI
- **FR-6.1:** `@settings` command uses existing `$.prompt.menu()` system (not AI-driven chat)
- **FR-6.2:** Menu options: Add Key, Remove Key, List Keys, View Trial Status
- **FR-6.3:** Terminal-only interface (no web UI in MVP)
- **FR-6.4:** Clear feedback on all operations (success/failure with reasons)

## Non-Functional Requirements

### NFR-1: Security
- **NFR-1.1:** Credentials never cached in decrypted form in memory
- **NFR-1.2:** Decryption happens just-in-time for API calls
- **NFR-1.3:** Master encryption key stored in environment variable (not in code/database)
- **NFR-1.4:** Audit log for all credential operations (add, remove, validation)

### NFR-2: Performance
- **NFR-2.1:** Decryption latency < 10ms (acceptable for AES-256)
- **NFR-2.2:** Trial check latency < 5ms (in-memory counter, no DB query per action)
- **NFR-2.3:** No degradation in `$aiQuery` latency compared to current Agent SDK approach

### NFR-3: Scalability
- **NFR-3.1:** Support unlimited concurrent players (each uses own credentials)
- **NFR-3.2:** No shared bottlenecks (rate limits per player, not global)
- **NFR-3.3:** Graceful handling of provider outages (fallback chain: BYOK → house key → rejection)

### NFR-4: Maintainability
- **NFR-4.1:** No external dependencies like LiteLLM proxy (direct SDK calls only)
- **NFR-4.2:** Provider abstraction allows adding new providers without `$aiQuery` API changes
- **NFR-4.3:** Clear separation: credential storage, trial gate, provider routing, session management

## Success Criteria

After Phase 2 completion:
- ✅ New player can play 50 actions or 30 min on house key
- ✅ Trial exhaustion prompts `@settings` with clear instructions
- ✅ Player can add API key via `@settings` menu
- ✅ Existing `$aiQuery()` calls work unchanged (backward compatible)
- ✅ Player actions route through their own credentials seamlessly
- ✅ Multiple concurrent players don't impact each other's rate limits
- ✅ Server supports 10+ concurrent players without degradation
- ✅ Invalid keys provide actionable error messages
- ✅ Model parameter works: `$aiQuery(..., { model: 'opus' })`

## Out of Scope (Future Phases)

- ❌ Automatic model routing based on complexity (Phase 1 is explicit only)
- ❌ Cost tracking/budgeting per player
- ❌ Alternative LLM providers (OpenAI, Google)
- ❌ Web-based settings UI
- ❌ Multi-provider support in single session (Phase 1: one provider per player)
- ❌ Cost attribution reporting
- ❌ Key rotation automation

## Open Questions

None - requirements clear from playtesting and research.

## Dependencies

- **MongoDB:** For credential storage (encrypted) and session history
- **Anthropic SDK:** For direct API calls to Claude models
- **AWS SDK:** For Bedrock access (if player provides Bedrock credentials)
- **GCP SDK:** For Vertex AI access (if player provides GCP credentials)
- **Node crypto:** For AES-256 encryption/decryption

## Constraints

- Must work with existing MOO architecture (`$aiQuery`, session management)
- Must support session history ownership (model can change mid-conversation)
- Must support prompt caching for cost efficiency
- No external dependencies like LiteLLM proxy
- Trial system must prevent abuse (time AND action limits)
- Keys must be encrypted at rest
- Settings menu uses existing `$.prompt.menu()` system
