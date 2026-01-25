# Domain Pitfalls: BYOK Multi-Provider AI Integration

**Domain:** Multi-tenant LLM credential management with trial limiting
**Researched:** 2026-01-24

## Critical Pitfalls

Mistakes that cause security breaches, scaling failures, or complete rewrites.

### Pitfall 1: Decrypted Key Caching

**What goes wrong:** Decrypted API keys cached in memory across requests. A process crash or inspection reveals unencrypted credentials.

**Why it happens:** Developers optimize to avoid re-decrypting the same key repeatedly. "Just cache it in memory for 5 minutes."

**Consequences:** 
- If server memory dumped or inspected, all player keys exposed
- No way to revoke a compromised key mid-session
- Regulatory compliance nightmare (PCI-DSS equivalent for API keys)

**Prevention:**
- Decrypt on every request (tweetnacl-ts is fast: <1ms per key)
- Never store plaintext credential in memory longer than function call
- Use wipe/zero functions to clear sensitive data after use
- Use `crypto.timingSafeEqual()` for comparison (prevents timing attacks)

**Detection:**
- Add monitoring: "How many times is decryption called per request?"
- Should be exactly 1
- If seeing 0, check for caching bugs

### Pitfall 2: Trial Gate Bypassed in Some Code Paths

**What goes wrong:** Trial limiting enforced in narration, but not in direct MCP calls. Or enforced on most AI calls, but not on background tasks.

**Why it happens:** Different code paths call AI separately. Developer adds trial check to narration, forgets about MCP.

**Consequences:**
- Trial players can exhaust limits in specific paths (exploit)
- Some players get to play unlimited; others hit limits
- Inconsistent behavior = support tickets

**Prevention:**
- Central trial gate function called by ALL AI entry points
- Audit every place that calls provider SDK:
  - Narration (`$narrator.describe()`)
  - MCP session queries (`$aiQuery`)
  - Background tasks (`$scheduler` jobs)
  - Command responses (custom verbs)
- Create integration test: "Trial player runs command in each path, verify limit enforced"

**Detection:**
- Trial player can make 50+ actions if they find a path without gating
- Analytics: "What % of trial players exhaust limits?" (should be ~80%)
- If much lower, trial gate is leaky

### Pitfall 3: Off-by-One Errors in Dual Limits

**What goes wrong:** Trial is "50 actions OR 30 minutes" but implemented as "50 actions AND 30 minutes" or with off-by-one boundary condition.

**Why it happens:** Trial logic is complex (two counters, two thresholds, two error messages). Easy to confuse OR/AND or get boundary wrong.

**Consequences:**
- Trial behavior unpredictable ("I thought I had 2 more actions left?")
- Support floods with "why did I hit limit early?"

**Prevention:**
- Write trial logic as atomic Lua script (not application code)
- Lua ensures both checks happen together, no race conditions
- Unit test both conditions separately:
  - Test 1: Player makes 50 actions before 30 min. Should be denied.
  - Test 2: Player waits 30 min without reaching 50 actions. Should be denied.
  - Test 3: Player makes 49 actions in 30 min. Should be allowed (next action denied).

**Detection:**
- Trial player reports inconsistent behavior ("I had actions left but got denied")
- Check Redis state: `redis.call('GET', 'trial:{playerId}:actions')` vs time elapsed
- Write debug function to check trial state for any player

### Pitfall 4: Cryptic Provider Error Messages Exposed to Players

**What goes wrong:** Bedrock returns "ValidationException: Model not supported in region" and player sees exactly that. Player has no idea what to do.

**Why it happens:** Lazy error handling; just bubble up provider error without translation.

**Consequences:**
- Players blame game ("Your game is broken")
- Support burden; players don't know to retry or add different key
- Bad UX (technical error ≠ player action)

**Prevention:**
- Create error translation map for each provider:
  - Bedrock 403 → "Your AWS credentials don't have Bedrock access. Check AWS console."
  - Anthropic 401 → "API key invalid. Check it's copied correctly (starts with 'sk-ant-')."
  - Vertex "Not Found" → "Service account doesn't have access. Check GCP permissions."
- Validate credential formats on add (reject 'sk-ant-xyz-' before storing)
- Test small API call on add to catch auth errors early
- Log original error for debugging; show translated error to player

**Detection:**
- Monitor error logs: What % are raw provider errors vs translated?
- Survey players: "Did error message make sense?"
- If >20% raw provider errors reaching players, fix translation map

### Pitfall 5: Credential Validation Not Tested on Add

**What goes wrong:** Player adds API key, system stores it without testing. Later, when player runs first command, key is invalid (typo, expired, wrong region). Player hits error mid-gameplay.

**Why it happens:** Skipping validation to speed up UX. "Just store it and find out if it works later."

**Consequences:**
- Player tries key, game errors mid-action ("Cannot narrate: Invalid key")
- Player confused (thought they added it correctly)
- Immersion broken

**Prevention:**
- Always make small test API call on add:
  - Anthropic: Send one message with max_tokens=10
  - Cost: ~$0.0001
  - Latency: ~500ms
  - Tells you: Format valid, auth works, quota available
- Show player result immediately: "Key valid! Ready to play." or "Key rejected: [reason]"
- Allow player to retry without re-entering everything

**Detection:**
- First command error rate for new BYOK players (should be <1%)
- Monitor validation pass/fail ratio
- If >10% fail validation, credentials are bad or validation is too strict

---

## Moderate Pitfalls

Mistakes that cause technical debt, delays, or operational headaches.

### Pitfall 6: No Audit Trail for Credential Access

**What goes wrong:** Player key is compromised; you can't tell who accessed what, when, or how much.

**Why it happens:** Auditing seems like "nice to have"; left for later. Then someone's bill spikes and you have no visibility.

**Consequences:**
- No way to trace credential abuse
- Can't detect compromised key until player complains
- Compliance issues if you're handling sensitive data

**Prevention:**
- Log every credential decryption: timestamp, playerId, success/failure
- Log every API call: provider, model, tokens, error if any
- Retain logs for 90 days minimum
- Create audit report: "Show me all API calls from player 42 in the last week"

**Detection:**
- If audit logs don't exist, add them before MVP

### Pitfall 7: Redis Trial State Flushed; Players Confused

**What goes wrong:** Redis restarts, trial state is lost. Player who thought they had 10 actions left suddenly has 50 again.

**Why it happens:** Redis is ephemeral by design. Doesn't affect correctness (trial restarts), but confuses players.

**Consequences:**
- Support tickets: "My trial reset?"
- Player might think they exploited a bug

**Prevention:**
- Document that trial is ephemeral: "Trial progress is lost if server restarts"
- Set Redis TTL to match trial duration + grace period (30 min + 5 min)
- Use `redis-dump` or replication if you want persistence
- Accept that trial is "best effort," not guaranteed

**Detection:**
- Player reports trial state change; check Redis logs for restarts

### Pitfall 8: Credential Rotation Never Tested

**What goes wrong:** Company generates new Bedrock credentials; old ones should be revoked. But old keys still work, and nobody knows why.

**Why it happens:** Key rotation is a "future task"; never actually tested.

**Consequences:**
- Compromised key remains active longer than planned
- False sense of security

**Prevention:**
- Test credential rotation in staging:
  1. Player adds key A
  2. Works fine
  3. Rotate key A (mark as old in your system)
  4. Verify key A no longer works
  5. Add key B, works fine
- Document rotation procedure
- Run rotation test monthly

**Detection:**
- Old credentials still work when they shouldn't
- No rotation procedure documented

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 9: No Rate Limiting Between Providers

**What goes wrong:** Player switches from Anthropic (10K RPM) to trial key (100 RPM). No rate limiting applied. Suddenly getting rate limited on every 10th action.

**Why it happens:** Assumed each provider enforces their own limits. "Let the SDK handle it."

**Consequences:**
- Unexpected rate limit errors from trial key usage
- Poor UX (inconsistent responsiveness)

**Prevention:**
- Implement local rate limiting before calling SDK:
  - Trial key: 1 req/sec, 100 req/min, 1000 req/hour
  - BYOK Anthropic: Allow higher limits
- Back off exponentially on rate limit error
- Show player: "Server is busy, try again in 30s"

**Detection:**
- Monitor rate limit errors: Should be near zero
- If spikes, check for provider transitions or trial limit changes

### Pitfall 10: Credential Provider Mismatch

**What goes wrong:** Player stores Anthropic key, switches model to one only available in Bedrock. System tries to call Bedrock with Anthropic key.

**Why it happens:** Model availability differs by provider. Didn't validate model availability for player's credential.

**Consequences:**
- Confusing error ("key invalid" but actually model unavailable)
- Player doesn't understand why their key won't work

**Prevention:**
- Track model availability per provider
- On model switch, verify player's current credential provider has that model
- Show available models for current credential: "Your Anthropic key supports: Haiku, Sonnet, Opus"

**Detection:**
- Player switches model, gets cryptic error
- Check model availability map; ensure it's updated when new models launch

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---|---|
| Phase 1 | Encryption | Decryption caching for perf | Benchmark tweetnacl first; likely <1ms per key. Don't cache. |
| Phase 1 | Trial limits | Off-by-one in logic | Use Lua script atomicity; write unit tests for both conditions. |
| Phase 2 | Key validation | Skipping test API call | Always test on add; cost is negligible, UX is critical. |
| Phase 2 | Error messages | Raw provider errors | Create translation map; test with real credentials. |
| Phase 3 | Model switching | Credential mismatch | Validate model available for credential provider. |
| Phase 3 | Session history | No encryption | Encrypt conversation history (may contain sensitive info). |
| Phase 4 | Monitoring | No audit trail | Add logging for all credential access before launch. |

---

## Recommendations

**Must-haves before MVP:**
1. Atomic trial limiting (Lua script, dual conditions)
2. Fail-fast key validation on add
3. Error translation map for common failures
4. Central trial gate function (all paths go through it)
5. Audit logging for credential access

**Should-haves before beta:**
1. Credential rotation testing
2. Rate limiting per provider
3. Model availability validation

**Nice-to-haves post-MVP:**
1. Observability dashboards
2. Automated credential refresh (Bedrock 12h tokens)
3. Cost tracking per player

