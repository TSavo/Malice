# Feature Landscape: BYOK Credential Management

**Domain:** LLM API Credential Management (BYOK - Bring Your Own Key)
**Researched:** 2026-01-24
**Scope:** Credential management, trial/freemium models, and player UX patterns

## Table Stakes

Features users expect. Missing = product feels incomplete and frustrating.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add/Remove Credentials | Core workflow - players must be able to input API keys | Low | Simple form input with encryption |
| Immediate Key Validation | Verify key works before saving | Med | Test with small API call to provider (detects typos, revoked keys) |
| Encrypted Storage | Keys must not be readable in database | Low | Use AES-256 at rest, rotate keys properly |
| Remove Expired Keys | Must handle trial expiration gracefully | Low | Detection + cleanup when trial ends |
| Trial System (50 actions OR 30min) | Core freemium model from project context | High | Action counter + timer, both must halt when hit |
| Error Messages with Guidance | Must direct confused players to @settings | Med | Context-aware messages: expired vs invalid vs rate-limited |
| Trial Status Display | Players must see actions remaining, time remaining | Low | Display on `@check-trial` or in status bar |
| Settings Menu Integration | Terminal-based UI via $.prompt.menu() | Med | Integrates with existing player command system |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-Provider Support | Support OpenAI, Anthropic, etc., not just one | High | Requires provider-agnostic key validation, abstraction layer |
| Unified Key Pool | Players can add multiple keys; system auto-selects best fit | High | Requires load balancing logic, provider detection, fallback chains |
| Cost Tracking | Show estimated spend for trial period | Med | Integrate provider APIs for real-time pricing, track by player |
| Key Rotation Schedule | Automatic key cycling for security | Med | Background job to rotate keys, zero-downtime switching |
| Per-Provider Trial Limits | Different trial quotas per provider (e.g., Claude: 50 actions, GPT: 100) | High | Complex trial logic matrix, multiple counters per player |
| Usage Analytics Dashboard | View action breakdown by provider, model, time | Med | Query aggregation, time-series data, charting |
| Rate Limit Monitoring | Warn player before hitting provider rate limits | Med | Track provider-specific rate windows, predict overages |
| Graceful Degradation | Fall back to different provider if primary is rate-limited | High | Requires request interception, dynamic retry logic |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Web UI for Settings | Scope creep - terminal UI sufficient per project context | Use $.prompt.menu() - players already comfortable with terminal commands |
| Auto-Billing | Creates trust issues, complexity, legal exposure | Require explicit trial-to-paid conversion decision by player |
| Hidden Trial Limits | Surprise expiration frustrates players | Show countdown on every action near limits (last 10 actions, final minute) |
| Store Raw Keys in Logs | Security nightmare, breach liability | Log only key ID and operation type, never the key itself |
| Silent Failures | Players unaware trial expired and commands are failing | Return explicit "trial expired" messages with path to upgrade |
| Per-Action Validation | Performance killer - validating every call slows game | Validate once on add, then assume valid until expiration/rate-limit |
| Hard Expiration Walls | Trial ends mid-action, looks like a bug | Allow in-flight requests to complete; block only NEW requests |
| Duplicate Keys | Database bloat, confusion about which key is active | Detect duplicates on input, reject or prompt to remove old |

## Feature Dependencies

```
Core Infrastructure
├─ Encrypted Storage (required by all others)
└─ Trial System (core freemium gate)

Key Management
├─ Add Credentials (depends on: Encrypted Storage)
├─ Remove Credentials (no deps)
├─ Immediate Key Validation (depends on: Add Credentials)
└─ Encrypted Storage

Trial Enforcement
├─ Trial System (depends on: Encrypted Storage)
├─ Error Messages (depends on: Trial System)
├─ Remove Expired Keys (depends on: Trial System)
└─ Trial Status Display (depends on: Trial System)

Differentiators (all optional, depend on core features)
├─ Multi-Provider Support (depends on: Key Validation, Trial System)
├─ Unified Key Pool (depends on: Multi-Provider)
├─ Cost Tracking (depends on: Key Validation)
├─ Key Rotation (depends on: Encrypted Storage)
├─ Per-Provider Trial Limits (depends on: Trial System, Multi-Provider)
├─ Usage Analytics (depends on: Trial System, Cost Tracking)
└─ Graceful Degradation (depends on: Unified Key Pool)

UX Features
├─ Settings Menu Integration (depends on: Encrypted Storage, Trial System)
├─ Trial Status Display (depends on: Trial System)
└─ Error Messages (depends on: Key Validation, Trial System)
```

## MVP Recommendation

For MVP, prioritize these in order:

1. **Encrypted Storage** - Foundation for everything else
2. **Trial System (50 actions OR 30min)** - Core freemium gate
3. **Add/Remove Credentials** - Core UX workflow
4. **Immediate Key Validation** - Detect bad keys instantly
5. **Error Messages with Guidance** - Direct confused players to help
6. **Trial Status Display** - Transparency on countdown
7. **Settings Menu Integration** - Terminal UX entry point

**Defer to post-MVP:**
- Multi-Provider Support: Requires abstraction layer research
- Per-Provider Trial Limits: Complex logic, can start with flat 50 actions
- Cost Tracking: Provider APIs vary, can use estimates later
- Usage Analytics: Post-MVP nice-to-have
- Key Rotation: Security nice-to-have, not urgent
- Graceful Degradation: Load balancing complexity, test single provider first
- Rate Limit Monitoring: Can monitor manually during beta

## Feature Categories by Effort

### Low Complexity (implement first)
- Remove Credentials (delete from encrypted store)
- Encrypted Storage (use bcrypt or libsodium)
- Trial Status Display (query counter/timer from MongoDB)
- Error Messages (standard strings + context variables)

### Medium Complexity (core MVP work)
- Trial System (action counter + timer, both gates must work)
- Add Credentials (form input → validation → encryption → storage)
- Immediate Key Validation (call provider with test prompt)
- Settings Menu Integration (wire into $.prompt.menu())

### High Complexity (post-MVP research)
- Multi-Provider Support (need abstraction over different APIs)
- Per-Provider Trial Limits (feature matrix, multiple counters)
- Unified Key Pool (load balancing, provider selection)
- Cost Tracking (provider pricing APIs, currency handling)
- Graceful Degradation (request interception, retry chains)

## Architecture Patterns from Production Systems

Based on research of OpenRouter, Portkey, and LiteLLM:

### Pattern 1: Virtual Key Indirection
**What:** Never expose raw API keys to player code. Generate "virtual keys" that map to encrypted secrets.
**When:** For any system where players shouldn't see the actual provider key.
**Example:**
```typescript
// Player adds key
const virtualKey = await $player.addKey('sk-ant-xxx', 'anthropic');
// Stores as encrypted: { virtualKeyId: 'vk_abc123', provider: 'anthropic', encrypted: '...' }

// Player uses in prompt
const response = await $ai.prompt('hello', { keyId: virtualKey });
// System decrypts and uses actual key internally
```

### Pattern 2: Stateful Trial Gates
**What:** Use two independent conditions (action count AND time), both block when hit.
**When:** Implementing freemium with hard limits.
**Example:**
```typescript
// Both must be checked
if (trial.actionsRemaining <= 0) throw new TrialExpiredError('actions');
if (new Date() > trial.expiresAt) throw new TrialExpiredError('time');
// Either violation blocks the action
```

### Pattern 3: Test Validation on Add
**What:** Validate credentials immediately with a small test call, before saving.
**When:** Detecting typos, revoked keys, rate limits early.
**Example:**
```typescript
async function validateKey(key, provider) {
  try {
    // Small, cheap test call
    await provider.testConnection({ key });
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}
```

### Pattern 4: Encrypted Storage with Rotation
**What:** Store keys encrypted at rest (AES-256), never log raw values, rotate encryption keys periodically.
**When:** Storing sensitive data that survives server restarts.
**Key principles from research:**
- Encrypt in transit (HTTPS/TLS)
- Encrypt at rest (AES-256 minimum)
- Rotate master key every 90 days
- Never log raw key values - only key IDs
- Use dedicated secret management system (AWS KMS, HashiCorp Vault)

### Pattern 5: Graceful Degradation with Clear Messages
**What:** When trial expires or key fails, return specific error messages that guide players.
**When:** Handling failure states.
**Example messages:**
```
"Trial expired (50 actions used). Upgrade to continue: @settings upgrade"
"API key invalid (possibly revoked). Re-add it: @settings keys add"
"Rate limited by provider. Wait 60 seconds, then try again."
"Provider down. Try again in 5 minutes or switch to @settings keys alternate-key"
```

## Research Findings Summary

### From Production Systems (OpenRouter, Portkey, LiteLLM)

**Credential Management:**
- Virtual keys abstract raw credentials (prevents embedding sensitive data)
- Keys stored encrypted with role-based access control
- Support for budget limits and rate limiting per key
- Disable/enable keys without deletion (audit trail)

**Trial Systems:**
- Trial keys have expiration dates (7-30 days standard)
- Budget limits (max spend per key) automatically enforce ceiling
- Rate limits (tokens/minute, requests/minute) prevent abuse
- Soft limits (warnings) + hard limits (blocks) for UX

**Error Handling Best Practices (from 2026 API security research):**
- Clear, non-technical language
- Actionable guidance ("do this to fix it")
- Include error codes and timestamps
- Link to documentation
- Avoid jargon; assume non-technical player audience

**UX Patterns (SaaS 2026 trends):**
- Action-focused design: break workflows into clear steps
- Progressive disclosure: reveal options gradually
- Transparent limits: show remaining actions/time
- Reinforce before expiration: alert at 10% of quota remaining

## Sources

- [GitHub Copilot BYOK Enhancements (2026)](https://github.blog/changelog/2026-01-15-github-copilot-bring-your-own-key-byok-enhancements/)
- [OpenRouter API Key Management & Provisioning](https://openrouter.ai/docs/guides/overview/auth/provisioning-api-keys)
- [Portkey Virtual Key System](https://portkey.ai/docs/integrations/llms/openrouter)
- [LiteLLM Virtual Keys & Budget Limits](https://docs.litellm.ai/docs/proxy/virtual_keys)
- [API Key Security Best Practices 2026](https://dev.to/alixd/api-key-security-best-practices-for-2026-1n5d)
- [REST API Security Best Practices 2026](https://www.levo.ai/resources/blogs/rest-api-security-best-practices)
- [Best Practices for API Error Handling](https://blog.postman.com/best-practices-for-api-error-handling/)
- [B2B SaaS UX Design in 2026: Patterns](https://www.onething.design/post/b2b-saas-ux-design)
- [SaaS Free Trial Best Practices](https://userpilot.com/blog/saas-free-trial-best-practices/)
- [Designing Free Trials That Actually Convert](https://blog.logrocket.com/ux-design/designing-free-trials-tips/)

