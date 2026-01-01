import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds PreAuthHandler object (dynamic ID)
 * Handles pre-authenticated connections (SSL certs, HTTP Basic Auth, OAuth)
 */
export class PreAuthHandlerBuilder implements Builder {
  static provides = ['preAuthHandler'];
  static depends: string[] = [];

  private preAuthHandler: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.preAuthHandler) {
      this.preAuthHandler = await this.manager.load(aliases.preAuthHandler);
      if (this.preAuthHandler) return; // Already exists
    }

    // Create new PreAuthHandler
    const root = await this.manager.load('root');
    this.preAuthHandler = await this.manager.create({
      parent: root!,
      properties: {
        name: 'PreAuthHandler',
        description:
          'Pre-authenticated connection handler (SSL, HTTP auth, OAuth)',
      },
      methods: {},
    });

    this.preAuthHandler.setMethod(
      'onPreAuth',
      `
          const context = args[0];
          const authInfo = args[1];

          // Silent for token auth (web clients)
          if (authInfo.mode !== 'token') {
            context.send('Pre-authenticated connection detected\\\\r\\\\n');
            context.send(\`Auth mode: \${authInfo.mode}\\\\r\\\\n\`);
          }

          // Route to appropriate handler based on auth mode
          try {
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

              case 'ssh-key':
                await self.handleSSHKey(context, authInfo.sshKey);
                break;

              case 'custom':
                await self.handleCustom(context, authInfo.custom);
                break;

              case 'token':
                await self.handleToken(context, authInfo.token);
                break;

              case 'none':
                // No auth credentials, but may have metadata (like chargenMode)
                // Switch handler to authManager and start normal auth flow
                context.setHandler($.authManager);
                await $.authManager.onConnect(context);
                break;

              default:
                context.send(\`Unknown authentication mode: \${authInfo.mode}\\\\r\\\\n\`);
                context.close();
            }
          } catch (err) {
            context.send(\`Authentication error: \${err.message}\\\\r\\\\n\`);
            context.close();
          }
        `,
    );

    this.preAuthHandler.setMethod(
      'handleSSLCert',
      `
          const context = args[0];
          const cert = args[1];

          // Verify certificate was validated by TLS layer
          if (!cert.verified) {
            context.send('SSL certificate not verified by server\\\\r\\\\n');
            context.close();
            return;
          }

          context.send(\`Certificate CN: \${cert.commonName}\\\\r\\\\n\`);
          context.send(\`Fingerprint: \${cert.fingerprint}\\\\r\\\\n\`);

          // Find Player by SSL fingerprint or email
          // Player type has string ID 'player'
          const users = await context.$.db.listAll();
          const playerDoc = users.find(u =>
            (u.parent?.id === 'player' || u.parent?.id === 'admin') &&
            (u.properties.sslFingerprint === cert.fingerprint ||
             u.properties.email === cert.commonName)
          );

          if (!playerDoc) {
            context.send(\`No player found for certificate: \${cert.commonName}\\\\r\\\\n\`);
            context.send('Contact an administrator to register your certificate.\\\\r\\\\n');
            context.close();
            return;
          }

          // Load as RuntimeObject
          const player = await context.$.load(playerDoc._id);

          // Check if suspended
          if (player.isSuspended) {
            context.send('Your account has been suspended\\\\r\\\\n');
            context.close();
            return;
          }

          // Check if user has DevTools permission
          const canUseDevTools = player.canUseDevTools === true;
          if (!canUseDevTools) {
            context.send('Your account does not have DevTools access.\\\\r\\\\n');
            context.close();
            return;
          }

          // Authenticate and connect
          context.authenticate(player.id);
          await player.connect(context);
        `,
    );

    this.preAuthHandler.setMethod(
      'handleHTTPBasic',
      `
          const context = args[0];
          const basic = args[1];

          context.send(\`Authenticating user: \${basic.username}\\\\r\\\\n\`);

          // Find Player by playername
          // Player/Admin types have string IDs 'player' and 'admin'
          // Helper to extract value from typed Value or raw value
          const getValue = (v) => v && typeof v === 'object' && 'type' in v ? v.value : v;
          const users = await context.$.db.listAll();
          const userDoc = users.find(u =>
            (u.parent?.id === 'player' || u.parent?.id === 'admin') &&
            getValue(u.properties.playername) === basic.username.toLowerCase()
          );

          if (!userDoc) {
            context.send('Invalid username or password\\\\r\\\\n');
            context.close();
            return;
          }

          // Load as RuntimeObject
          const player = await context.$.load(userDoc._id);

          // Check if suspended
          if (player.isSuspended) {
            context.send('Your account has been suspended\\\\r\\\\n');
            context.close();
            return;
          }

          // Verify password using Player's checkPassword method
          const valid = await player.checkPassword(basic.password);

          if (!valid) {
            context.send('Invalid username or password\\\\r\\\\n');
            context.close();
            return;
          }

          // Authenticate the connection
          context.authenticate(player.id);

          // Check if chargen needs to be completed
          if (!player.chargenComplete) {
            context.send('Welcome! Let\\'s complete your character creation...\\\\r\\\\n\\\\r\\\\n');

            // Get faction-specific chargen based on player's factionId
            let charGen = $.charGen;  // Default (Continuum)
            let factionName = 'continuum';

            if (player.factionId) {
              const faction = await $factionManager.get(player.factionId);
              if (faction && faction.charGen) {
                charGen = faction.charGen;
                factionName = (faction.name || 'unknown').toLowerCase();
              }
            }

            // Set up routing to chargen
            context.setHandler(player);
            charGen._playerContexts = charGen._playerContexts || {};
            charGen._playerContexts[player.id] = context;
            player.chargenInProgress = true;
            player.chargenFaction = factionName;

            // Continue (or start) the NPC interview
            await charGen.continueNPCInterview(context, player);
            return;
          }

          // Chargen complete - connect normally
          await player.connect(context);
        `,
    );

    this.preAuthHandler.setMethod(
      'handleSSHKey',
      `
          const context = args[0];
          const sshKey = args[1];

          context.send(\`SSH key authentication\\\\r\\\\n\`);
          context.send(\`Key fingerprint: \${sshKey.fingerprint}\\\\r\\\\n\`);

          // Get Player prototype via alias
          const objectManager = await $load(0);
          // Helper to extract value from typed Value or raw value
          const getValue = (v) => v && typeof v === 'object' && 'type' in v ? v.value : v;

          // Find Player by SSH key fingerprint
          // Player/Admin types have string IDs 'player' and 'admin'
          const users = await context.$.db.listAll();
          const playerDoc = users.find(u => {
            if (u.parent?.id !== 'player' && u.parent?.id !== 'admin') return false;
            const keys = getValue(u.properties.sshPublicKeys) || [];
            if (!Array.isArray(keys)) return false;
            // Check if any stored key matches the fingerprint
            return keys.some(storedKey => {
              // Compare by matching the key data
              const storedParts = storedKey.trim().split(/\\\\s+/);
              const authParts = sshKey.publicKey.trim().split(/\\\\s+/);
              return storedParts.length >= 2 && authParts.length >= 2 &&
                     storedParts[0] === authParts[0] && storedParts[1] === authParts[1];
            });
          });

          if (!playerDoc) {
            context.send(\`No player found for SSH key: \${sshKey.fingerprint}\\\\r\\\\n\`);
            context.send('Use addkey command after logging in with password to register your key.\\\\r\\\\n');
            context.close();
            return;
          }

          // Load as RuntimeObject
          const player = await context.$.load(playerDoc._id);

          // Check if suspended
          if (player.isSuspended) {
            context.send('Your account has been suspended\\\\r\\\\n');
            context.close();
            return;
          }

          // Authenticate and connect
          context.authenticate(player.id);
          await player.connect(context);
        `,
    );

    this.preAuthHandler.setMethod(
      'handleOAuth',
      `
          const context = args[0];
          const oauth = args[1];

          context.send('OAuth authentication not yet implemented\\\\r\\\\n');
          context.send(\`Token: \${oauth.token.substring(0, 20)}...\\\\r\\\\n\`);

          // TODO: Verify JWT token using jose or similar
          // const { jwtVerify } = require('jose');
          // const { payload } = await jwtVerify(oauth.token, publicKey);

          // TODO: Find user by OAuth subject claim
          // const user = users.find(u => u.properties.oauthSubject === payload.sub);

          context.close();
        `,
    );

    this.preAuthHandler.setMethod(
      'handleCustom',
      `
          const context = args[0];
          const custom = args[1];

          context.send(\`Custom authentication type: \${custom.type}\\\\r\\\\n\`);
          context.send('Custom authentication not yet implemented\\\\r\\\\n');
          context.close();
        `,
    );

    this.preAuthHandler.setMethod(
      'handleToken',
      `
          const context = args[0];
          const tokenInfo = args[1];

          // Validate token against $system
          const playerId = await $.system.validateAuthToken(tokenInfo.value);

          if (!playerId) {
            context.send('Invalid or expired token\\\\r\\\\n');
            context.close();
            return;
          }

          // Load player
          const player = await $load(playerId);
          if (!player) {
            context.send('Player not found\\\\r\\\\n');
            context.close();
            return;
          }

          // Check if suspended
          if (player.isSuspended) {
            context.send('Your account has been suspended\\\\r\\\\n');
            context.close();
            return;
          }

          // Authenticate the connection
          context.authenticate(player.id);

          // Check if chargen needs to be completed
          if (!player.chargenComplete) {
            context.send('Welcome! Let\\'s complete your character creation...\\\\r\\\\n\\\\r\\\\n');

            // Get faction-specific chargen based on player's factionId
            let charGen = $.charGen;  // Default (Continuum)
            let factionName = 'continuum';

            if (player.factionId) {
              const faction = await $factionManager.get(player.factionId);
              if (faction && faction.charGen) {
                charGen = faction.charGen;
                factionName = (faction.name || 'unknown').toLowerCase();
              }
            }

            // Set up routing to chargen
            context.setHandler(player);
            charGen._playerContexts = charGen._playerContexts || {};
            charGen._playerContexts[player.id] = context;
            player.chargenInProgress = true;
            player.chargenFaction = factionName;

            // Continue (or start) the NPC interview
            await charGen.continueNPCInterview(context, player);
            return;
          }

          // Chargen complete - connect (silent - no banner for web clients)
          await player.connect(context);
        `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.preAuthHandler) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call(
      'addAlias',
      'preAuthHandler',
      this.preAuthHandler.id,
    );
    console.log(
      `✅ Registered preAuthHandler alias -> #${this.preAuthHandler.id}`,
    );
  }
}

// Self-register
registerBuilder(PreAuthHandlerBuilder);
