# Roadmap: BYOK Scaling Infrastructure

**Project:** Enable unlimited player scaling via Bring Your Own Key (BYOK)
**Timeline:** 2 phases (foundation → player-facing)
**Model:** YOLO mode (auto-approve), quick depth (3-5 phases), budget profile (Haiku agents)

## Phase Overview

| Phase | Focus | Duration Estimate | Status |
|-------|-------|------------------|--------|
| Phase 1 | BYOK Infrastructure & Model Routing | TBD | ⏳ Planning |
| Phase 2 | @settings Menu + Trial System | TBD | ⏸️ Blocked |

## Phase 1: BYOK Infrastructure & Model Routing

**Goal:** Seamless credential routing with model tier support, backward-compatible with existing `$aiQuery`

**Success Criteria:**
- `$aiQuery(..., { model: 'haiku' })` works with player credentials
- Session history owned by application (not Agent SDK)
- All LLM calls route through trial gate
- House keys provide 50 actions OR 30 minutes trial

### Milestone 1.1: Credential Storage Foundation
**Files:** `src/database/credential-manager.ts`, `src/types/credentials.ts`

**Tasks:**
- [ ] Define credential schema: `{ id, playerId, provider, encryptedKey, createdAt, lastValidated }`
- [ ] Implement AES-256 encryption/decryption using master key from env
- [ ] Add `player.apiCredentials` array property to Player prototype
- [ ] Implement `CredentialManager.add(playerId, provider, rawKey)`
- [ ] Implement `CredentialManager.get(playerId, provider)` → decrypts just-in-time
- [ ] Implement `CredentialManager.remove(playerId, credentialId)`
- [ ] Implement `CredentialManager.validate(playerId, credentialId)` → small test API call
- [ ] Write unit tests for encryption roundtrip
- [ ] Verify no decrypted keys cached in memory

**Dependencies:** MongoDB (existing), Node crypto (built-in)

**Research flags:** None (standard encryption patterns)

---

### Milestone 1.2: Trial System
**Files:** `src/game/trial-manager.ts`, player prototype updates

**Tasks:**
- [ ] Add trial properties to Player: `{ trialStarted, trialActions, trialExhausted }`
- [ ] Implement `TrialManager.startTrial(playerId)` → sets trialStarted timestamp
- [ ] Implement `TrialManager.incrementAction(playerId)` → increments trialActions
- [ ] Implement `TrialManager.checkTrial(playerId)` → returns { allowed, reason }
  - Check: `trialActions < 50 AND now - trialStarted < 30min`
  - Both conditions must pass
- [ ] Implement `TrialManager.exhaustTrial(playerId)` → sets trialExhausted = true
- [ ] Write tests for off-by-one errors (exactly 50 actions, exactly 30 minutes)
- [ ] Write tests for edge cases (offline for days, returns mid-trial)

**Dependencies:** MongoDB (existing)

**Research flags:** None (dual-gate pattern verified)

---

### Milestone 1.3: Provider Routing
**Files:** `src/llm/provider-router.ts`, provider implementations in `src/llm/providers/`

**Tasks:**
- [ ] Define `Provider` interface: `{ call(model, messages, options), validate(key) }`
- [ ] Implement `AnthropicProvider` using `@anthropic-ai/sdk`
- [ ] Implement `BedrockProvider` using AWS SDK
- [ ] Implement `VertexAIProvider` using GCP SDK
- [ ] Implement `ProviderRouter.selectProvider(playerId)` → returns provider + decrypted key
  - Logic: Check player credentials → fallback to house key if none/trial active
- [ ] Implement error translation: map provider errors → player messages
- [ ] Write integration tests with mock providers
- [ ] Document provider error codes and translations

**Dependencies:** `@anthropic-ai/sdk`, `@aws-sdk/client-bedrock-runtime`, `@google-cloud/aiplatform`

**Research flags:** Provider SDK APIs may differ (verify Bedrock/Vertex error handling)

---

### Milestone 1.4: Session Management
**Files:** `src/llm/session-manager.ts`, update `src/database/object-manager.ts`

**Tasks:**
- [ ] Define session schema: `{ id, playerId, messages, metadata, createdAt, updatedAt }`
- [ ] Implement `SessionManager.create(playerId)` → returns sessionId
- [ ] Implement `SessionManager.addMessage(sessionId, role, content)`
- [ ] Implement `SessionManager.getHistory(sessionId)` → returns full conversation
- [ ] Implement prompt caching detection (system prompt unchanged → use cache)
- [ ] Migrate `$aiQuery` from Agent SDK to SessionManager
  - Remove `query()` from Agent SDK
  - Add session ownership to ObjectManager
  - Pass full history to provider on each call
- [ ] Write tests for session persistence across server restarts
- [ ] Benchmark: verify < 10ms latency overhead vs Agent SDK

**Dependencies:** MongoDB (existing), SessionManager, ProviderRouter

**Research flags:** Prompt caching API may differ per provider (verify Bedrock/Vertex support)

---

### Milestone 1.5: Trial Gate Integration
**Files:** Update `src/database/object-manager.ts`, add trial checks to all LLM entry points

**Tasks:**
- [ ] Audit all LLM entry points: `$aiQuery`, narrator calls, MCP session tools
- [ ] Add trial gate before EACH LLM call: `if (!TrialManager.checkTrial(playerId)) { ... }`
- [ ] Implement trial exhaustion message: "Trial expired. Enter @settings to add your API key."
- [ ] Implement action counter increment on successful LLM calls
- [ ] Write integration tests: verify trial gate blocks after 50 actions
- [ ] Write integration tests: verify trial gate blocks after 30 minutes
- [ ] Write integration tests: verify BYOK bypasses trial gate

**Dependencies:** TrialManager, CredentialManager, ProviderRouter

**Research flags:** **CRITICAL** - Comprehensive audit needed to find all LLM entry points

---

### Milestone 1.6: Model Parameter Support
**Files:** Update `src/database/object-manager.ts`

**Tasks:**
- [ ] Add `model?: 'haiku' | 'sonnet' | 'opus'` to `$aiQuery` options
- [ ] Default to `haiku` if not specified
- [ ] Map model tier to provider-specific model names:
  - `haiku` → `claude-3-5-haiku-20241022`
  - `sonnet` → `claude-3-5-sonnet-20241022`
  - `opus` → `claude-opus-4-5-20251101`
- [ ] Pass model to ProviderRouter for API call
- [ ] Write tests: verify model parameter works for all 3 tiers
- [ ] Update existing `$aiQuery` calls to be backward-compatible (no model = haiku)

**Dependencies:** ProviderRouter, SessionManager

**Research flags:** None (model mapping is straightforward)

---

## Phase 2: @settings Menu + Trial System

**Goal:** Player-facing credential management with clear UX

**Success Criteria:**
- Players can add/remove credentials via `@settings`
- Clear trial status visibility
- Actionable error messages for invalid keys
- Audit logs for all credential operations

### Milestone 2.1: Settings Menu Foundation
**Files:** `src/game/settings-command.ts`, update command routing

**Tasks:**
- [ ] Research `$.prompt.menu()` API (verify signature and capabilities)
- [ ] Register `@settings` command verb
- [ ] Implement main menu: [Add Key] [Remove Key] [List Keys] [View Trial] [Back]
- [ ] Implement "View Trial" screen: show actions used, time remaining, status
- [ ] Write tests for menu navigation
- [ ] Update help text with `@settings` command

**Dependencies:** `$.prompt.menu()` system (existing)

**Research flags:** **VERIFY** `$.prompt.menu()` API before implementation

---

### Milestone 2.2: Add Key Workflow
**Files:** Update `src/game/settings-command.ts`

**Tasks:**
- [ ] Implement provider selection submenu: [Anthropic] [AWS Bedrock] [GCP Vertex AI]
- [ ] Implement key input prompt (masked text entry)
- [ ] Implement immediate validation:
  - Call `CredentialManager.validate(playerId, provider, key)`
  - Small test API call (e.g., list models, check quota)
  - Display result: ✅ Valid or ❌ Invalid with error translation
- [ ] Implement key storage on successful validation
- [ ] Implement error translation for common validation failures:
  - Invalid key format → "Key format incorrect. Expected: sk-ant-..."
  - Rate limited → "API key is rate limited. Try again in a few minutes."
  - Quota exceeded → "API quota exhausted. Upgrade your plan or use a different key."
  - Network error → "Unable to reach provider. Check your connection."
- [ ] Write tests for all validation scenarios

**Dependencies:** CredentialManager, ProviderRouter

**Research flags:** Provider-specific validation patterns may vary

---

### Milestone 2.3: Remove/List Key Workflows
**Files:** Update `src/game/settings-command.ts`

**Tasks:**
- [ ] Implement "List Keys" screen: show provider, ID, status (last validated), mask partial key
- [ ] Implement "Remove Key" confirmation: "Remove Anthropic key *****xyz? [Yes/No]"
- [ ] Implement removal with audit log entry
- [ ] Handle edge case: removing last key → player reverts to trial mode
- [ ] Write tests for list/remove workflows

**Dependencies:** CredentialManager

**Research flags:** None

---

### Milestone 2.4: Monitoring & Audit Logging
**Files:** `src/llm/audit-logger.ts`, update CredentialManager and ProviderRouter

**Tasks:**
- [ ] Define audit event schema: `{ timestamp, playerId, event, details }`
- [ ] Log events: `credential_added`, `credential_removed`, `credential_validated`, `llm_call_success`, `llm_call_failed`, `trial_exhausted`
- [ ] Implement `AuditLogger.log(playerId, event, details)`
- [ ] Implement `AuditLogger.query(playerId, filters)` → for admin debugging
- [ ] Add audit logging to all credential operations
- [ ] Add audit logging to all LLM calls (which player, which key, which model)
- [ ] Write tests for audit log completeness

**Dependencies:** MongoDB (existing)

**Research flags:** None (standard logging patterns)

---

### Milestone 2.5: Error Handling & Graceful Degradation
**Files:** Update all provider implementations, ProviderRouter

**Tasks:**
- [ ] Implement fallback chain: BYOK → house trial key → rejection
- [ ] Implement automatic retry with exponential backoff for network errors
- [ ] Implement error translation map for all providers:
  - Anthropic errors → player messages
  - Bedrock errors → player messages
  - Vertex AI errors → player messages
- [ ] Implement provider outage detection (3 consecutive failures → log alert)
- [ ] Write tests for fallback chain scenarios
- [ ] Write tests for retry logic (network failures)

**Dependencies:** ProviderRouter, AuditLogger

**Research flags:** Provider error codes may vary (document all error types)

---

## Phase Ordering Rationale

**Phase 1 before Phase 2:**
- Foundation (credentials, trial, routing, sessions) is prerequisite
- Phase 2 UI depends on all Phase 1 components working
- Phase 1 can be tested via direct API calls (no UI needed)

**Within Phase 1:**
- 1.1 (Credentials) → 1.2 (Trial) → 1.3 (Providers) → 1.4 (Sessions) → 1.5 (Trial Gate) → 1.6 (Model)
- Each milestone builds on previous
- Trial Gate (1.5) requires all earlier components
- Model support (1.6) is final polish (can be skipped for MVP)

**Within Phase 2:**
- 2.1 (Menu) → 2.2 (Add) → 2.3 (List/Remove) → 2.4 (Monitoring) → 2.5 (Errors)
- 2.2-2.3 are core UX (blocking for MVP)
- 2.4-2.5 are observability (nice-to-have, can defer)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Trial gate missed in some code path | Comprehensive audit of all LLM entry points (Milestone 1.5) |
| Decrypted keys cached in memory | Code review + memory profiling after 1.1 |
| Provider error codes vary | Document all error types during 1.3 integration testing |
| Off-by-one errors in trial counter | Edge case tests (exactly 50 actions, exactly 30 minutes) in 1.2 |
| $.prompt.menu() API unclear | Verify API before starting Phase 2 |

## Definition of Done

**Phase 1 Complete:**
- All Phase 1 milestones ✅
- Integration tests pass (full flow: trial → BYOK → model routing)
- No regression in existing `$aiQuery` behavior
- Performance benchmarks meet targets (< 10ms overhead)

**Phase 2 Complete:**
- All Phase 2 milestones ✅
- End-to-end test: new player → trial → exhaust → add key → continue playing
- Error messages reviewed by non-technical user (clear and actionable)
- Audit logs capture all credential operations

## Next Steps

1. **Finalize STATE.md** - Create state tracking document
2. **Begin Phase 1.1** - Credential storage foundation
3. **Set up test environments** - Mock providers for integration testing
4. **Verify dependencies** - Ensure all SDK packages available
