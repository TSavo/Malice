# DevTools Security Specification

## Threat Model

The DevTools server provides **full administrative access** to the game database. An attacker with DevTools access can:

- ❌ Read all object source code
- ❌ Modify game logic
- ❌ Delete objects
- ❌ Steal user credentials (if stored in objects)
- ❌ Execute arbitrary code on the server
- ❌ Crash the game server

**Therefore: DevTools MUST be secured properly.**

## Security Layers

### 1. Network Binding (Primary Defense)

**Default:** Bind only to localhost (127.0.0.1)

```typescript
// v2/src/transport/devtools/devtools-server.ts
export class DevToolsServer {
  constructor(
    private config: {
      host: string;  // Default: '127.0.0.1'
      port: number;  // Default: 9999
    }
  ) {}

  start() {
    const wss = new WebSocketServer({
      host: this.config.host,
      port: this.config.port
    });
  }
}
```

**Configuration:**

```typescript
// Development
const devToolsServer = new DevToolsServer({
  host: '127.0.0.1', // Localhost only
  port: 9999
});

// Production
const devToolsServer = null; // Don't start at all!
```

**Never expose DevTools to:**
- External networks (0.0.0.0)
- Public internet
- Untrusted users

### 2. Environment-Based Enablement

**Only start DevTools in development:**

```typescript
// v2/src/index.ts
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  const devToolsServer = new DevToolsServer({
    host: '127.0.0.1',
    port: 9999
  });
  devToolsServer.start();
  console.log('DevTools server running on ws://localhost:9999');
} else {
  console.log('DevTools disabled in production');
}
```

**Environment Variables:**

```bash
# Development (.env.development)
NODE_ENV=development
DEVTOOLS_ENABLED=true
DEVTOOLS_PORT=9999

# Production (.env.production)
NODE_ENV=production
DEVTOOLS_ENABLED=false
```

### 3. Authentication (Optional, Secondary)

For environments where localhost isn't trusted (shared servers, remote development):

#### Token-Based Auth

```typescript
export class DevToolsServer {
  constructor(
    private config: {
      host: string;
      port: number;
      requireAuth: boolean;
      authToken?: string;
    }
  ) {}

  start() {
    const wss = new WebSocketServer({
      host: this.config.host,
      port: this.config.port,
      verifyClient: (info, callback) => {
        if (!this.config.requireAuth) {
          return callback(true);
        }

        const url = new URL(info.req.url!, 'ws://localhost');
        const token = url.searchParams.get('token');

        if (token === this.config.authToken) {
          callback(true);
        } else {
          console.warn('DevTools: Invalid token attempt');
          callback(false, 401, 'Unauthorized');
        }
      }
    });
  }
}
```

**Usage:**

```typescript
// Server
const devToolsServer = new DevToolsServer({
  host: '127.0.0.1',
  port: 9999,
  requireAuth: true,
  authToken: process.env.DEVTOOLS_TOKEN || crypto.randomUUID()
});

// Client
const ws = new WebSocket('ws://localhost:9999/devtools?token=your-secret-token');
```

**Token Management:**

```bash
# Generate secure token
$ node -e "console.log(require('crypto').randomUUID())"
a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Store in environment
DEVTOOLS_TOKEN=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 4. Rate Limiting

Prevent abuse (DoS, brute force):

```typescript
import { RateLimiter } from 'limiter';

export class DevToolsServer {
  private rateLimiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: 'second'
  });

  private async handle(msg: any, ws: WebSocket) {
    const allowed = await this.rateLimiter.removeTokens(1);
    if (!allowed) {
      return this.sendError(ws, msg.id, -32000, 'Rate limit exceeded');
    }

    // Process request
  }
}
```

### 5. Input Validation

Sanitize all inputs to prevent injection attacks:

```typescript
private async handle(msg: any) {
  // Validate object IDs
  if (typeof msg.params?.objectId !== 'number') {
    return { error: { code: -32602, message: 'Invalid objectId' } };
  }

  // Validate method names (alphanumeric + underscore only)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(msg.params?.name)) {
    return { error: { code: -32602, message: 'Invalid method name' } };
  }

  // Validate code length
  if (msg.params?.code && msg.params.code.length > 1_000_000) {
    return { error: { code: -32602, message: 'Code too large' } };
  }

  // Continue processing...
}
```

### 6. MongoDB Injection Prevention

Use parameterized queries:

```typescript
// BAD (vulnerable):
await db.collection('objects').findOne({
  _id: parseInt(msg.params.objectId)
});

// GOOD:
const objectId = parseInt(msg.params.objectId, 10);
if (!Number.isInteger(objectId) || objectId < 0) {
  throw new Error('Invalid object ID');
}
await db.collection('objects').findOne({ _id: objectId });
```

### 7. Logging and Monitoring

Track all DevTools activity:

```typescript
export class DevToolsServer {
  private log(action: string, params: any, clientId: string) {
    console.log(`[DevTools] ${clientId} - ${action}`, params);

    // Optional: Write to audit log
    this.auditLog.write({
      timestamp: new Date(),
      clientId,
      action,
      params
    });
  }

  private async handle(msg: any, ws: WebSocket, clientId: string) {
    this.log(msg.method, msg.params, clientId);

    // Process request
  }
}
```

**Audit critical operations:**
- Object creation/deletion
- Method modifications
- Property changes affecting authentication
- Failed authentication attempts

## Multi-Server Considerations

### MongoDB Change Streams

DevTools uses **MongoDB change streams** to detect external modifications. This has security implications:

#### What Change Streams Expose

Change streams broadcast:
- ✅ Object IDs that changed
- ✅ Operation type (insert/update/delete)
- ✅ Full document content (with `fullDocument: 'updateLookup'`)

**Risk:** If MongoDB is compromised, all object data is exposed via change stream.

**Mitigation:**
- MongoDB bound to localhost only (never expose 27017 to internet)
- Use MongoDB authentication in production
- TLS for MongoDB connections

#### Multi-Server Cache Invalidation

When one DevTools instance modifies an object:

```
DevTools 1 → MongoDB → Change Stream → DevTools 2
                                    → Game Server
```

**All servers see the change immediately.**

**Risk:** Malicious DevTools client could:
- Monitor all object modifications
- Detect when game logic changes

**Mitigation:**
- DevTools only in trusted environments
- Production deployments disable DevTools entirely

## Deployment Scenarios

### Local Development (Safe)

```typescript
const devToolsServer = new DevToolsServer({
  host: '127.0.0.1',
  port: 9999,
  requireAuth: false
});
```

✅ Safe: Only accessible from same machine
✅ Change streams only visible to localhost processes

### Shared Dev Server (Needs Auth)

```typescript
const devToolsServer = new DevToolsServer({
  host: '127.0.0.1', // Still localhost only
  port: 9999,
  requireAuth: true,
  authToken: process.env.DEVTOOLS_TOKEN
});
```

⚠️ Use SSH tunneling for remote access:
```bash
# On your local machine:
ssh -L 9999:localhost:9999 user@dev-server.com

# Then connect to ws://localhost:9999 locally
```

✅ MongoDB change streams secured via SSH tunnel

### Production (Disabled)

```typescript
if (process.env.NODE_ENV === 'production') {
  // Don't start DevTools at all
  console.log('DevTools disabled in production');
} else {
  const devToolsServer = new DevToolsServer({ ... });
  devToolsServer.start();
}
```

✅ Best practice: No code = no vulnerability

## VS Code Extension Security

### Trusted Workspaces Only

```typescript
// extension.ts
export async function activate(context: vscode.ExtensionContext) {
  // Check if workspace is trusted
  if (!vscode.workspace.isTrusted) {
    vscode.window.showWarningMessage(
      'Malice DevTools requires a trusted workspace'
    );
    return;
  }

  // Continue activation
}
```

### Secure Token Storage

```typescript
// Store token in VS Code secrets (not in plaintext)
const token = await context.secrets.get('malice.devtools.token');

if (!token) {
  const newToken = await vscode.window.showInputBox({
    prompt: 'Enter DevTools authentication token',
    password: true
  });

  if (newToken) {
    await context.secrets.store('malice.devtools.token', newToken);
  }
}
```

### Connection Validation

```typescript
// Verify we're connecting to localhost
const url = new URL(config.devToolsUrl);
if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
  vscode.window.showErrorMessage(
    'DevTools must connect to localhost only'
  );
  return;
}
```

## Attack Scenarios & Mitigations

### 1. Malicious Code Injection

**Attack:** Attacker modifies object methods to execute malicious code

**Impact:**
- Server compromise
- Data exfiltration
- Privilege escalation

**Mitigation:**
- DevTools localhost-only (attacker needs local access)
- Token authentication (if needed)
- Audit logging (detect suspicious changes)

**Future:** Code sandboxing (VM2, isolated-vm)

### 2. Network Exposure

**Attack:** DevTools bound to 0.0.0.0, exposed to internet

**Impact:**
- Remote code execution
- Full database access

**Mitigation:**
- **Never bind to 0.0.0.0**
- Fail-safe default: `host: '127.0.0.1'`
- Production: Don't start DevTools at all

### 3. Token Theft

**Attack:** Authentication token stolen from environment, logs, or memory

**Impact:**
- Unauthorized DevTools access

**Mitigation:**
- Rotate tokens regularly
- Use VS Code secrets storage (not plaintext)
- Rate limiting (slow brute force)
- Monitor for suspicious activity

### 4. Man-in-the-Middle

**Attack:** Attacker intercepts WebSocket traffic

**Impact:**
- Token theft
- Session hijacking

**Mitigation:**
- Localhost-only (no network transit)
- Future: WSS (TLS) for remote scenarios

### 5. Denial of Service

**Attack:** Spam requests to crash server

**Impact:**
- Server unresponsive
- Resource exhaustion

**Mitigation:**
- Rate limiting (100 req/sec)
- Max message size (1MB)
- Connection limits (10 clients max)

## Security Checklist

Before deploying:

- [ ] DevTools bound to `127.0.0.1` only
- [ ] DevTools disabled in production (`NODE_ENV=production`)
- [ ] Authentication token configured (if multi-user)
- [ ] Token stored in environment, not hardcoded
- [ ] Rate limiting enabled
- [ ] Input validation on all params
- [ ] Audit logging configured
- [ ] Max message size enforced
- [ ] Connection limit enforced
- [ ] VS Code extension validates localhost
- [ ] Token stored in VS Code secrets

## Incident Response

If DevTools is compromised:

1. **Immediately stop the server**
   ```bash
   pkill -f devtools-server
   ```

2. **Rotate authentication tokens**
   ```bash
   DEVTOOLS_TOKEN=$(node -e "console.log(require('crypto').randomUUID())")
   ```

3. **Review audit logs**
   ```bash
   grep "DevTools" /var/log/malice.log
   ```

4. **Check MongoDB for suspicious changes**
   ```bash
   db.objects.find({ modified: { $gte: incidentTime } })
   ```

5. **Restore from backup if needed**
   ```bash
   mongorestore --db malice backup/2025-12-05/
   ```

## Future Enhancements

### 1. Code Sandboxing

Execute user methods in isolated VM:
```typescript
import { VM } from 'vm2';

const vm = new VM({
  timeout: 1000,
  sandbox: { self, $, args }
});

const result = await vm.run(methodCode);
```

### 2. Object-Level Permissions

```typescript
interface GameObject {
  owner: number;        // User who created it
  permissions: {
    read: number[];     // User IDs who can read
    write: number[];    // User IDs who can modify
  };
}
```

### 3. TLS Support

```typescript
const wss = new WebSocketServer({
  host: '127.0.0.1',
  port: 9999,
  perMessageDeflate: false,
  clientTracking: true,
  // TLS options for remote scenarios:
  // server: https.createServer({ key, cert })
});
```

### 4. Two-Factor Authentication

Require TOTP token + static token:
```typescript
const valid = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: msg.params.totp
});
```

## Summary

**DevTools security relies on defense in depth:**

1. ✅ **Network binding** (localhost only) - Primary defense
2. ✅ **Environment gating** (dev only) - Fail-safe
3. ✅ **Authentication** (optional tokens) - Secondary defense
4. ✅ **Input validation** (sanitize params) - Prevent injection
5. ✅ **Rate limiting** (prevent abuse) - DoS protection
6. ✅ **Audit logging** (detect misuse) - Forensics
7. ✅ **SSH tunneling** (remote access) - Secure remote dev

**Most Important:** Never expose DevTools to untrusted networks!
