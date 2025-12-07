import { createServer, Server as NodeTLSServer, TLSSocket } from 'tls';
import { Subject } from 'rxjs';
import { TelnetTransport } from '../telnet/telnet-transport.js';
import { Connection } from '../../connection/connection.js';
import type { AuthInfo } from '../../../types/auth.js';

/**
 * TLS/SSL server with client certificate authentication
 * Creates authenticated connections using SSL client certificates
 */
export interface TLSServerConfig {
  port: number;
  host?: string;
  key: string | Buffer;       // Server private key
  cert: string | Buffer;      // Server certificate
  ca?: string | Buffer;       // Certificate Authority (for verifying client certs)
  requestCert?: boolean;      // Request client certificates (default: true)
  rejectUnauthorized?: boolean; // Reject invalid certs at TLS level (default: false, we validate in MOO)
  debug?: boolean;
}

/**
 * TLS server for SSL client certificate authentication
 * Extracts certificate info and passes to game code for validation
 */
export class TLSServer {
  private server: NodeTLSServer;
  private readonly destroyed$ = new Subject<void>();

  /** Observable stream of new connections (with SSL cert auth) */
  public readonly connection$ = new Subject<Connection>();

  /** Observable stream of errors */
  public readonly error$ = new Subject<Error>();

  constructor(private config: TLSServerConfig) {
    this.server = createServer({
      key: config.key,
      cert: config.cert,
      ca: config.ca,
      requestCert: config.requestCert !== false, // Default: true
      rejectUnauthorized: config.rejectUnauthorized || false, // Default: false (validate in MOO)
    }, (socket) => {
      this.handleConnection(socket);
    });

    this.setupEventHandlers();
  }

  /**
   * Set up server event handlers
   */
  private setupEventHandlers(): void {
    this.server.on('error', (err: Error) => {
      if (this.config.debug) {
        console.error('[TLSServer] Error:', err);
      }
      this.error$.next(err);
    });

    this.server.on('tlsClientError', (err: Error, socket: TLSSocket) => {
      if (this.config.debug) {
        console.error('[TLSServer] TLS Client Error:', err.message);
      }
      // Don't propagate these as server errors
      socket.destroy();
    });
  }

  /**
   * Start listening for connections
   */
  async listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host || '0.0.0.0', () => {
        if (this.config.debug) {
          console.log(`[TLSServer] Listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`);
        }
        resolve();
      });

      this.server.once('error', reject);
    });
  }

  /**
   * Handle new TLS connection
   * Extracts SSL client certificate information
   */
  private handleConnection(socket: TLSSocket): void {
    const remoteAddress = socket.remoteAddress || 'unknown';

    if (this.config.debug) {
      console.log(`[TLSServer] New connection from ${remoteAddress}`);
    }

    // Extract client certificate
    let authInfo: AuthInfo | null = null;
    const cert = socket.getPeerCertificate();

    // Check if certificate exists (getPeerCertificate returns {} if none)
    if (cert && Object.keys(cert).length > 0) {
      authInfo = {
        mode: 'ssl-cert',
        sslCert: {
          commonName: cert.subject?.CN || '',
          fingerprint: cert.fingerprint || '',
          issuer: cert.issuer?.CN || '',
          verified: socket.authorized, // Was cert signed by trusted CA?
          serialNumber: cert.serialNumber || '',
          validFrom: cert.valid_from ? new Date(cert.valid_from) : new Date(),
          validTo: cert.valid_to ? new Date(cert.valid_to) : new Date(),
        },
        metadata: {
          remoteAddress,
          protocol: 'tls',
        },
      };

      if (this.config.debug) {
        console.log(`[TLSServer] SSL cert detected: CN=${cert.subject?.CN}, verified=${socket.authorized}`);
      }
    } else {
      if (this.config.debug) {
        console.log('[TLSServer] No client certificate provided');
      }
    }

    // Create telnet transport over TLS socket (same protocol)
    const transport = new TelnetTransport(socket);

    // Create connection with SSL auth info
    const connection = new Connection(transport, authInfo);

    // Emit the connection
    this.connection$.next(connection);

    // Log when closed
    if (this.config.debug) {
      transport.closed$.subscribe(() => {
        console.log(`[TLSServer] Connection closed: ${connection.id}`);
      });
    }
  }

  /**
   * Close the server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.destroyed$.next();
      this.destroyed$.complete();
      this.connection$.complete();
      this.error$.complete();

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[TLSServer] Server closed');
          }
          resolve();
        }
      });
    });
  }

  /**
   * Get server address info
   */
  address(): { port: number; address: string; family?: string } | null {
    const addr = this.server.address();
    if (!addr || typeof addr === 'string') return null;
    return addr;
  }
}
