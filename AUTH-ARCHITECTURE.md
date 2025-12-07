# Authentication Architecture

## Philosophy

**ALL authentication logic lives in MOO code (MongoDB), not TypeScript.**

The transport layer only:
1. Extracts credentials from the transport mechanism (SSL cert, HTTP headers, etc.)
2. Passes them to System object
3. System object decides what to do

## Two Authentication Modes

### Mode 1: "Authenticate" (Interactive Login)

User arrives **unauthenticated** and must log in interactively.

**Examples:**
- Raw telnet connection
- Anonymous WebSocket
- Guest connections

**Flow:**
```
Client connects (no credentials)
  ↓
Transport creates Connection (auth: null)
  ↓
GameCoordinator.handleConnection(connection)
  ↓
Creates ConnectionContext(connection)
  ↓
System#2.onConnection(context)
  ↓ (MOO CODE DECIDES)
if context.authInfo === null:
  ↓
  Load AuthManager#3
  Set as handler
  Show login screen
  ↓
User enters username/password
  ↓
AuthManager#3.onInput(context, input)
  ↓ (MOO CODE VALIDATES)
Lookup user in database
Verify password
  ↓
context.authenticate(userId)
  ↓
Load user object, enter game
```

### Mode 2: "Pre-Authenticated" (Trusted Transport)

User arrives **already authenticated** via transport-level mechanism.

**Examples:**
- SSL client certificate
- HTTP Basic Auth
- OAuth bearer token
- SSH key authentication
- Mutual TLS

**Flow:**
```
Client connects with SSL cert
  ↓
Transport extracts cert details
  ↓
Transport creates Connection(auth: {
  mode: 'ssl-cert',
  commonName: 'alice@example.com',
  fingerprint: '...',
  verified: true
})
  ↓
GameCoordinator.handleConnection(connection)
  ↓
Creates ConnectionContext(connection)
  ↓
System#2.onConnection(context)
  ↓ (MOO CODE DECIDES)
if context.authInfo !== null:
  ↓
  Check context.authInfo.mode
  Validate credentials
  Lookup user by commonName or fingerprint
  ↓
if valid:
  context.authenticate(userId)
  Load user object, enter game
else:
  Reject connection
```

## Transport Interface Changes

### Current (Too Simple)

```typescript
export class Connection {
  constructor(transport: ITransport) {
    // No auth info passed
  }
}
```

### New (Auth-Aware)

```typescript
export interface AuthInfo {
  mode: 'ssl-cert' | 'http-basic' | 'oauth' | 'ssh-key' | 'custom';

  // SSL client certificate
  sslCert?: {
    commonName: string;
    fingerprint: string;
    issuer: string;
    verified: boolean;
    serialNumber: string;
  };

  // HTTP Basic Auth
  httpBasic?: {
    username: string;
    password: string;
  };

  // OAuth / JWT
  oauth?: {
    token: string;
    scopes: string[];
    claims: Record<string, any>;
  };

  // SSH key
  sshKey?: {
    publicKey: string;
    fingerprint: string;
    algorithm: string;
  };

  // Custom auth (extensible)
  custom?: {
    type: string;
    data: Record<string, any>;
  };
}

export class Connection {
  constructor(
    transport: ITransport,
    authInfo: AuthInfo | null = null  // ← NEW
  ) {
    this.authInfo = authInfo;
  }
}
```

### ConnectionContext Changes

```typescript
export class ConnectionContext {
  constructor(
    private connection: Connection,
    private manager: ObjectManager
  ) {
    // ...
  }

  /**
   * Get auth info provided by transport (if any)
   */
  getAuthInfo(): AuthInfo | null {
    return this.connection.authInfo;
  }

  /**
   * Check if connection arrived pre-authenticated
   */
  isPreAuthenticated(): boolean {
    return this.connection.authInfo !== null;
  }
}
```

## MOO Code Examples

### System Object (Routing)

```typescript
// Object #2 - System
methods: {
  onConnection: `
    const context = args[0];
    const authInfo = context.getAuthInfo();

    if (authInfo === null) {
      // Mode 1: Interactive authentication required
      const authManager = await $.authManager;
      context.setHandler(authManager);
      await authManager.call('onConnect', context);
    } else {
      // Mode 2: Pre-authenticated via transport
      const preAuthHandler = await $.preAuthHandler;
      context.setHandler(preAuthHandler);
      await preAuthHandler.call('onPreAuth', context, authInfo);
    }
  `
}
```

### PreAuthHandler Object (New)

```typescript
// Object #5 - PreAuthHandler
methods: {
  onPreAuth: `
    const context = args[0];
    const authInfo = args[1];

    switch (authInfo.mode) {
      case 'ssl-cert':
        await self.handleSSLCert(context, authInfo.sslCert);
        break;

      case 'http-basic':
        await self.handleHTTPBasic(context, authInfo.httpBasic);
        break;

      case 'oauth':
        await self.handleOAuth(context, authInfo.oauth);
        break;

      default:
        context.send('Unknown authentication mode\\r\\n');
        context.close();
    }
  `,

  handleSSLCert: `
    const context = args[0];
    const cert = args[1];

    if (!cert.verified) {
      context.send('SSL certificate not verified\\r\\n');
      context.close();
      return;
    }

    // Find user by certificate common name or fingerprint
    const users = await context.$.db.listAll();
    const user = users.find(u =>
      u.properties.sslFingerprint === cert.fingerprint ||
      u.properties.email === cert.commonName
    );

    if (!user) {
      context.send(\`No user found for certificate: \${cert.commonName}\\r\\n\`);
      context.close();
      return;
    }

    // Authenticate and enter game
    context.authenticate(user._id);
    context.send(\`Welcome back, \${user.properties.name}!\\r\\n\`);

    // Hand off to game state
    const gameManager = await $.gameManager;
    context.setHandler(gameManager);
    await gameManager.call('onUserEnter', context, user._id);
  `,

  handleHTTPBasic: `
    const context = args[0];
    const basic = args[1];

    // Find user by username
    const users = await context.$.db.listAll();
    const user = users.find(u =>
      u.properties.username === basic.username
    );

    if (!user) {
      context.send('Invalid username or password\\r\\n');
      context.close();
      return;
    }

    // Verify password (hashed)
    const bcrypt = require('bcrypt'); // Or whatever hashing lib
    const valid = await bcrypt.compare(basic.password, user.properties.passwordHash);

    if (!valid) {
      context.send('Invalid username or password\\r\\n');
      context.close();
      return;
    }

    // Authenticate and enter game
    context.authenticate(user._id);
    context.send(\`Welcome back, \${user.properties.name}!\\r\\n\`);

    const gameManager = await $.gameManager;
    context.setHandler(gameManager);
    await gameManager.call('onUserEnter', context, user._id);
  `,

  handleOAuth: `
    const context = args[0];
    const oauth = args[1];

    // Verify JWT token (using jose or similar)
    const { jwtVerify } = require('jose');

    try {
      const { payload } = await jwtVerify(oauth.token, publicKey);

      // Find user by OAuth subject claim
      const users = await context.$.db.listAll();
      const user = users.find(u =>
        u.properties.oauthSubject === payload.sub
      );

      if (!user) {
        context.send('No user found for OAuth token\\r\\n');
        context.close();
        return;
      }

      context.authenticate(user._id);
      context.send(\`Welcome back, \${user.properties.name}!\\r\\n\`);

      const gameManager = await $.gameManager;
      context.setHandler(gameManager);
      await gameManager.call('onUserEnter', context, user._id);

    } catch (err) {
      context.send('Invalid OAuth token\\r\\n');
      context.close();
    }
  `
}
```

### AuthManager (Interactive Login - Unchanged)

```typescript
// Object #3 - AuthManager (existing)
methods: {
  onConnect: `
    const context = args[0];
    const welcome = self.welcomeMessage;
    context.send(welcome);
  `,

  onInput: `
    const context = args[0];
    const input = args[1];
    const username = input.trim();

    // TODO: Add password prompt
    // TODO: Verify credentials from database
    // For now: create new user

    const chargen = await $.charGen;
    if (chargen) {
      await chargen.call('onNewUser', context, username);
    }
  `
}
```

## Transport-Specific Implementation

### TelnetTransport (No Auth)

```typescript
export class TelnetServer {
  // ...

  private handleConnection(socket: Socket) {
    const transport = new TelnetTransport(socket);
    const connection = new Connection(transport, null); // ← No auth info

    this.connectionSubject.next(connection);
  }
}
```

### WebSocketTransport (Optional Auth)

```typescript
export class WebSocketServer {
  // ...

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Check for HTTP Basic Auth
    const authHeader = req.headers.authorization;
    let authInfo: AuthInfo | null = null;

    if (authHeader?.startsWith('Basic ')) {
      const base64 = authHeader.substring(6);
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');

      authInfo = {
        mode: 'http-basic',
        httpBasic: { username, password }
      };
    }

    const transport = new WebSocketTransport(ws);
    const connection = new Connection(transport, authInfo); // ← May have auth

    this.connectionSubject.next(connection);
  }
}
```

### TLS/SSL Transport (Pre-Authenticated)

```typescript
export class TLSServer {
  private server: Server;

  constructor(options: {
    port: number;
    key: string;
    cert: string;
    requestCert: true;  // ← Require client cert
    rejectUnauthorized: false;  // We'll verify in MOO code
  }) {
    this.server = createServer(options, (socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: TLSSocket) {
    // Extract client certificate
    const cert = socket.getPeerCertificate();

    let authInfo: AuthInfo | null = null;

    if (cert && Object.keys(cert).length > 0) {
      authInfo = {
        mode: 'ssl-cert',
        sslCert: {
          commonName: cert.subject.CN,
          fingerprint: cert.fingerprint,
          issuer: cert.issuer.CN,
          verified: socket.authorized,  // Was cert signed by trusted CA?
          serialNumber: cert.serialNumber
        }
      };
    }

    const transport = new TelnetTransport(socket); // Same protocol, different transport
    const connection = new Connection(transport, authInfo); // ← Pre-authenticated!

    this.connectionSubject.next(connection);
  }
}
```

## Benefits of This Design

### ✅ All Logic in MOO Code

Auth logic lives in MongoDB, not TypeScript files:
- Can be edited at runtime via DevTools
- No recompilation needed
- Different games can have different auth flows
- Wizards can customize without touching TypeScript

### ✅ Transport Agnostic

Game code doesn't care about transport details:
- SSL, OAuth, HTTP Basic all look the same to System object
- Just checks `context.getAuthInfo()`
- MOO code decides what to do

### ✅ Extensible

Add new auth modes without changing TypeScript:
- New transport? Just populate `authInfo.custom`
- MOO code handles it

### ✅ Secure

Transport validates at network layer:
- SSL cert verification happens in TLS handshake
- OAuth token verification in MOO code
- Passwords never exposed to game logic (hashed at transport layer)

### ✅ Backward Compatible

Existing code works unchanged:
- `authInfo === null` → Interactive login (current behavior)
- No changes to AuthManager or CharGen objects

## Migration Path

### Phase 1: Add AuthInfo (Non-Breaking)

1. Add `AuthInfo` interface to `types/connection.ts`
2. Add optional `authInfo` parameter to `Connection` constructor
3. Add `getAuthInfo()` to `ConnectionContext`
4. Existing code continues to work (auth info is always `null`)

### Phase 2: Update System Object

1. Edit System#2's `onConnection` method (via DevTools or migration script)
2. Add check for `context.getAuthInfo()`
3. Route to PreAuthHandler if pre-authenticated

### Phase 3: Add PreAuthHandler

1. Create PreAuthHandler object (#5) with handlers for each auth mode
2. Implement SSL cert, HTTP Basic, OAuth handlers

### Phase 4: Enable in Transports

1. Update WebSocketServer to extract HTTP Basic Auth
2. Add TLSServer for SSL client certificates
3. Each transport populates `authInfo` appropriately

## Security Considerations

### Trust Boundaries

```
┌─────────────────────────────────────────┐
│  Transport Layer (Untrusted)            │
│  - Extract credentials                  │
│  - NO validation here                   │
└──────────────┬──────────────────────────┘
               │ authInfo
┌──────────────┴──────────────────────────┐
│  MOO Code (Trusted)                     │
│  - Validate credentials                 │
│  - Lookup users                         │
│  - Decide authentication                │
└─────────────────────────────────────────┘
```

**Important:** Transport layer only EXTRACTS credentials, never validates them. MOO code does all validation.

### Password Handling

**Never store plaintext passwords in authInfo:**

```typescript
// BAD
authInfo = {
  mode: 'http-basic',
  httpBasic: { username: 'alice', password: 'secret123' } // ← Exposed!
};

// GOOD (if password must be passed)
authInfo = {
  mode: 'http-basic',
  httpBasic: {
    username: 'alice',
    passwordHash: await bcrypt.hash('secret123', 10) // ← Hashed at transport
  }
};

// BETTER (verify at transport, only pass success/failure)
authInfo = {
  mode: 'http-basic-verified',
  httpBasic: {
    username: 'alice',
    verified: true  // ← Transport already verified password
  }
};
```

### SSL Certificate Validation

```typescript
sslCert: {
  verified: socket.authorized  // ← Did TLS handshake succeed?
}

// In MOO code:
if (!cert.verified) {
  context.send('Invalid certificate\\r\\n');
  context.close();
  return;
}
```

Only accept `verified: true` certificates in production.

## Testing

### Unit Tests

```typescript
describe('Pre-Authenticated Connections', () => {
  it('should pass SSL cert info to System object', async () => {
    const authInfo: AuthInfo = {
      mode: 'ssl-cert',
      sslCert: {
        commonName: 'alice@example.com',
        fingerprint: 'AA:BB:CC:...',
        issuer: 'Example CA',
        verified: true,
        serialNumber: '12345'
      }
    };

    const connection = new Connection(mockTransport, authInfo);
    const context = new ConnectionContext(connection, objectManager);

    expect(context.getAuthInfo()).toEqual(authInfo);
    expect(context.isPreAuthenticated()).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('SSL Client Certificate Auth', () => {
  it('should authenticate user via client cert', async () => {
    // Create user with SSL fingerprint
    const user = await objectManager.create({
      parent: 1,
      properties: {
        username: 'alice',
        sslFingerprint: 'AA:BB:CC:...'
      }
    });

    // Connect with matching cert
    const connection = new Connection(mockTransport, {
      mode: 'ssl-cert',
      sslCert: {
        commonName: 'alice@example.com',
        fingerprint: 'AA:BB:CC:...',
        verified: true
      }
    });

    await gameCoordinator.handleConnection(connection);

    // Should auto-authenticate
    expect(connection.isAuthenticated()).toBe(true);
    expect(connection.getUserId()).toBe(user.id);
  });
});
```

## Summary

**Key Principles:**

1. **Transport extracts credentials** (SSL cert, HTTP header, etc.)
2. **Transport passes to Connection as `authInfo`**
3. **ConnectionContext exposes `authInfo` to MOO code**
4. **System object routes based on `authInfo === null` check**
5. **PreAuthHandler validates and authenticates**
6. **All validation logic in MOO code (MongoDB)**

**Result:**
- ✅ Support both interactive and pre-authenticated modes
- ✅ All auth logic editable at runtime
- ✅ Transport-agnostic game code
- ✅ Extensible for new auth mechanisms
- ✅ Secure trust boundaries
- ✅ Backward compatible
