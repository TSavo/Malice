/**
 * Authentication information types
 * Used to pass transport-level auth credentials to game code
 */

/**
 * SSL/TLS client certificate information
 */
export interface SSLCertInfo {
  commonName: string;
  fingerprint: string;
  issuer: string;
  verified: boolean;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
}

/**
 * HTTP Basic Authentication
 */
export interface HTTPBasicAuth {
  username: string;
  password: string;
}

/**
 * OAuth / JWT token
 */
export interface OAuthInfo {
  token: string;
  scopes?: string[];
  claims?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * SSH public key authentication
 */
export interface SSHKeyInfo {
  publicKey: string;
  fingerprint: string;
  algorithm: string;
  comment?: string;
}

/**
 * Custom authentication (extensible)
 */
export interface CustomAuthInfo {
  type: string;
  data: Record<string, any>;
}

/**
 * Authentication information from transport layer
 * Transport extracts credentials, game code validates them
 */
export interface AuthInfo {
  /** Authentication mode */
  mode: 'ssl-cert' | 'http-basic' | 'oauth' | 'ssh-key' | 'custom';

  /** SSL client certificate (if mode === 'ssl-cert') */
  sslCert?: SSLCertInfo;

  /** HTTP Basic Auth (if mode === 'http-basic') */
  httpBasic?: HTTPBasicAuth;

  /** OAuth / JWT (if mode === 'oauth') */
  oauth?: OAuthInfo;

  /** SSH key (if mode === 'ssh-key') */
  sshKey?: SSHKeyInfo;

  /** Custom auth (if mode === 'custom') */
  custom?: CustomAuthInfo;

  /** Additional metadata from transport */
  metadata?: {
    remoteAddress?: string;
    userAgent?: string;
    protocol?: string;
    [key: string]: any;
  };
}
