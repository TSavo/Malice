# Architecture Patterns: BYOK Multi-Provider Routing

**Domain:** Multi-tenant AI credential routing
**Researched:** 2026-01-24

## Recommended Architecture

Direct SDK instantiation with per-player credential routing:
- AIQuery Wrapper intercepts all calls
- Checks player for BYOK credential (DB lookup)
- Decrypts credential (tweetnacl-ts)
- Routes to provider SDK (Anthropic, Bedrock, or Vertex)
- Manages session history in MongoDB
- Attaches cache control directives
- Falls back to trial system if no BYOK

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **MOO Layer** | Game logic, player commands | AIQuery Wrapper (unchanged) |
| **AIQuery Wrapper** | Route to provider, attach cache | Credential DB, Redis trial, AI SDKs |
| **Credential Manager** | Encrypt/decrypt keys | MongoDB, tweetnacl-ts |
| **Trial Manager** | Track actions + time limits | Redis (Lua script) |
| **Provider Router** | Select + instantiate SDK | All three provider SDKs |
| **Session Manager** | Store/retrieve history | MongoDB |
| **Cache Controller** | Attach cache_control directives | All three SDKs |

## Data Flow: BYOK Player Action

1. Player runs command → $aiQuery(systemPrompt, prompt)
2. AIQuery Wrapper intercepts
3. Check player has BYOK key (DB lookup)
4. Decrypt credential (tweetnacl-ts)
5. Trial Manager (if no BYOK) checks Redis for 50 actions + 30 min limits
6. Provider Router instantiates correct SDK client
7. Session Manager fetches conversation history from MongoDB
8. Attach cache_control directives to system prompt + messages
9. Call AI SDK with cached context
10. Store response in session history
11. Increment trial action counter (Redis)
12. Return to MOO unchanged

## Key Patterns

### Pattern 1: Direct SDK Instantiation

No proxy layers. Instantiate SDK per request based on credential provider:

```typescript
async function getClientForPlayer(playerId) {
  const player = await $load(playerId);
  if (!player.aiCredential) return new Anthropic({ apiKey: TRIAL_KEY });
  
  const cred = await decryptCredential(player.aiCredential);
  switch (cred.provider) {
    case 'anthropic': return new Anthropic({ apiKey: cred.apiKey });
    case 'bedrock': return new BedrockRuntime({ credentials: {...} });
    case 'vertex': return new VertexAI({ projectId: cred.vertexProjectId });
  }
}
```

**Why:** Simpler than proxy, full control over errors, per-provider customization.

### Pattern 2: Atomic Trial Limiting (Redis Lua)

Single Lua script checks both time and action limits atomically:

```lua
local actions = redis.call('GET', KEYS[1]) or 0
local started = redis.call('GET', KEYS[2])

if not started then
  redis.call('SET', KEYS[2], ARGV[1])
  redis.call('EXPIRE', KEYS[2], 1800)  -- 30 min
  return 1  -- Allowed
end

local elapsed = (tonumber(ARGV[1]) - tonumber(started)) / 1000
if elapsed > 1800 then return -1 end  -- Time expired
if tonumber(actions) >= 50 then return -2 end  -- Actions exceeded

redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], 1800)
return 1  -- Allowed
```

**Why:** Prevents race conditions with concurrent commands. Dual limits (time + action).

### Pattern 3: Session History with Cache Control

MongoDB stores conversation with cache_control metadata:

```typescript
{
  playerId: 42,
  messages: [
    { role: 'system', content: '...', cacheable: true },
    { role: 'user', content: '...', cacheable: true },
    { role: 'assistant', content: '...', cacheable: false },
  ]
}

// Before API call:
const messages = session.messages.map(m => ({
  ...m,
  cache_control: m.cacheable ? { type: 'ephemeral' } : undefined
}));
```

**Why:** We own history. Enables model switching mid-conversation. Cache reuse across models.

### Pattern 4: Encrypted Credentials at Rest

tweetnacl-ts XSalsa20-Poly1305 with random nonce per encryption:

```typescript
const plaintext = JSON.stringify(credential);
const nonce = crypto.getRandomValues(new Uint8Array(24));
const ciphertext = secretbox(Buffer.from(plaintext), nonce, MASTER_KEY);

// Store: { nonce: hex, ciphertext: hex, algorithm: 'xsalsa20-poly1305' }
// Retrieve: plaintext = secretbox.open(ciphertext, nonce, MASTER_KEY)
```

**Why:** DB compromise doesn't expose keys. MASTER_KEY in env separate from data.

### Pattern 5: Fail-Fast Key Validation

Test API key immediately before storing:

```typescript
async function validateCredential(cred) {
  const client = new Anthropic({ apiKey: cred.apiKey });
  await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'ping' }],
  });
  // No error = valid
}
```

**Why:** Reject bad keys before storing. Clear feedback to player. ~$0.0001 per validation.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|---|---|---|
| Validate keys on first use | Player gets error mid-game | Validate on key add (fail-fast) |
| Let Agent SDK manage history | Can't switch models; locked in | Own history in MongoDB |
| Unencrypted keys in environment | Compromised if .env leaked | Encrypt in MongoDB + env MASTER_KEY |
| Trial limit (time OR action) | Players exploit one dimension | Both limits (time AND action) |
| Per-player in-memory cache | Memory bloat, lost on restart | Leverage native SDK caching |
| Synchronous rate limit checks | Redis becomes bottleneck | Lua script atomicity |

---

## Multi-Tenant Isolation

All data keyed by playerId. No cross-contamination:

- Encrypted credential: `player.aiCredential`
- Conversation history: `sessions.{playerId}`
- Trial state: `trial:{playerId}:*`
- Cache state: Provider handles

Each player independent. One player's expired key doesn't affect others.

---

## Scalability

| Concern | Solution |
|---------|----------|
| Credential lookup | In-memory player load (O(1)) |
| Trial rate limiting | Redis <5ms, Lua atomic ops |
| Session history | MongoDB indexed by playerId, shard if needed |
| Encryption/decryption | tweetnacl <1ms per key, parallelizable |
| Provider SDK clients | Instantiate per request (lightweight) |

Bottleneck likely: MongoDB session fetch if history very long (1000+ msgs). Solution: pagination.

