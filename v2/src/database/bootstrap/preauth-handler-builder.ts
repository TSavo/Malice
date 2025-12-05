import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

/**
 * Builds PreAuthHandler object (dynamic ID)
 * Handles pre-authenticated connections (SSL certs, HTTP Basic Auth, OAuth)
 */
export class PreAuthHandlerBuilder {
  private preAuthHandler: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.preAuthHandler) {
      this.preAuthHandler = await this.manager.load(aliases.preAuthHandler);
      if (this.preAuthHandler) return; // Already exists
    }

    // Create new PreAuthHandler
    this.preAuthHandler = await this.manager.create({
      parent: 1,
      properties: {
        name: 'PreAuthHandler',
        description: 'Pre-authenticated connection handler (SSL, HTTP auth, OAuth)',
      },
      methods: {
        onPreAuth: `
          const context = args[0];
          const authInfo = args[1];

          context.send('Pre-authenticated connection detected\\\\r\\\\n');
          context.send(\`Auth mode: \${authInfo.mode}\\\\r\\\\n\`);

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

              case 'custom':
                await self.handleCustom(context, authInfo.custom);
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

        handleSSLCert: `
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

          // Get Player prototype via alias
          const root = await $.load(1);
          const aliases = objectManager.get('aliases') || {};
          const playerPrototypeId = aliases.player;

          // Find Player by SSL fingerprint or email
          const users = await context.$.db.listAll();
          const playerDoc = users.find(u =>
            u.parent === playerPrototypeId &&
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
          if (player.get('isSuspended')) {
            context.send('Your account has been suspended\\\\r\\\\n');
            context.close();
            return;
          }

          // Check if user has DevTools permission
          const canUseDevTools = player.get('canUseDevTools') === true;
          if (!canUseDevTools) {
            context.send('Your account does not have DevTools access.\\\\r\\\\n');
            context.close();
            return;
          }

          // Authenticate and connect
          context.authenticate(player.id);
          await player.connect(context);
        `,

        handleHTTPBasic: `
          const context = args[0];
          const basic = args[1];

          context.send(\`Authenticating user: \${basic.username}\\\\r\\\\n\`);

          // Get Player prototype via alias
          const root = await $.load(1);
          const aliases = objectManager.get('aliases') || {};
          const playerPrototypeId = aliases.player;

          // Find Player by playername
          const users = await context.$.db.listAll();
          const userDoc = users.find(u =>
            u.parent === playerPrototypeId &&
            u.properties.playername === basic.username.toLowerCase()
          );

          if (!userDoc) {
            context.send('Invalid username or password\\\\r\\\\n');
            context.close();
            return;
          }

          // Load as RuntimeObject
          const player = await context.$.load(userDoc._id);

          // Check if suspended
          if (player.get('isSuspended')) {
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

          // Authenticate and connect
          context.authenticate(player.id);
          await player.connect(context);
        `,

        handleOAuth: `
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

        handleCustom: `
          const context = args[0];
          const custom = args[1];

          context.send(\`Custom authentication type: \${custom.type}\\\\r\\\\n\`);
          context.send('Custom authentication not yet implemented\\\\r\\\\n');
          context.close();
        `,
      },
    });
  }

  async registerAlias(): Promise<void> {
    if (!this.preAuthHandler) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.preAuthHandler = this.preAuthHandler.id;
    objectManager.set('aliases', aliases);
    await objectManager.save();

    console.log(`✅ Registered preAuthHandler alias -> #${this.preAuthHandler.id}`);
  }
}
