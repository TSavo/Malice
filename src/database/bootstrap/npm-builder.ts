/**
 * npm-builder.ts - Creates $npm MOO object for runtime package management
 *
 * Allows MOO code to install npm packages at runtime without server restart.
 * After install, `await import('package')` just works.
 *
 * SECURITY: Uses execFile() instead of execSync() to prevent shell injection.
 * Input validation prevents command injection attacks.
 *
 * Usage in MOO code:
 *   await $npm.install('lodash');
 *   const _ = await import('lodash');
 *   return _.chunk([1,2,3,4], 2);
 */

import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

export class NpmBuilder implements Builder {
  static provides = ['npm'];
  static depends: string[] = [];

  private npm: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if $npm already exists
    const existing = this.manager.getAliases().get('npm');
    if (existing) {
      this.npm = existing;
      return;
    }

    // Get root object as parent
    const root = await this.manager.load('root');
    if (!root) {
      throw new Error('Root object (#1) not found');
    }

    // Create $npm object
    this.npm = await this.manager.create({
      parent: root,
      properties: {
        name: 'npm',
        description:
          'Runtime package manager - install npm packages without restart',
      },
      methods: {},
    });

    // install(packageName, version?) - Install a package
    // SECURITY: Validates inputs and uses execFile() to prevent shell injection
    this.npm.setMethod(
      'install',
      `
      const packageName = args[0];
      const version = args[1];

      if (!packageName || typeof packageName !== 'string') {
        throw new Error('Package name required');
      }

      // Strict package name validation (npm official rules)
      // Allows: lodash, @babel/core, @org/package
      // Blocks: anything with shell metacharacters or path traversal
      const packageNameRegex = /^(@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9._-]*$/;
      if (!packageNameRegex.test(packageName) || packageName.length > 214) {
        throw new Error('Invalid package name: must be lowercase alphanumeric with hyphens, underscores, dots');
      }

      // Validate version if provided (CRITICAL-2 FIX)
      // Blocks: shell metacharacters, command substitution, variable expansion
      if (version && !/^[0-9a-zA-Z.~^><=*\-+]*$/.test(version)) {
        throw new Error('Invalid version specifier: contains invalid characters');
      }

      const spec = version ? packageName + '@' + version : packageName;

      // CRITICAL FIX: Use execFile() instead of execSync() to prevent shell injection
      // execFile does NOT spawn a shell - arguments are passed directly to npm
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      try {
        const result = await execFileAsync('npm', ['install', spec], {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        return {
          success: true,
          package: spec,
          output: result.stdout.trim()
        };
      } catch (err) {
        return {
          success: false,
          package: spec,
          error: err.stderr || err.message
        };
      }
    `,
    );

    // uninstall(packageName) - Remove a package
    // SECURITY: HIGH-1 FIX - Added packageName validation that was missing
    this.npm.setMethod(
      'uninstall',
      `
      const packageName = args[0];

      if (!packageName || typeof packageName !== 'string') {
        throw new Error('Package name required');
      }

      // HIGH-1 FIX: Validate packageName like install() does
      // Strict package name validation (npm official rules)
      const packageNameRegex = /^(@[a-z0-9][a-z0-9-]*\/)?[a-z0-9][a-z0-9._-]*$/;
      if (!packageNameRegex.test(packageName) || packageName.length > 214) {
        throw new Error('Invalid package name: must be lowercase alphanumeric with hyphens, underscores, dots');
      }

      // CRITICAL-1 FIX: Use execFile() instead of execSync() to prevent shell injection
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      try {
        const result = await execFileAsync('npm', ['uninstall', packageName], {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        return {
          success: true,
          package: packageName,
          output: result.stdout.trim()
        };
      } catch (err) {
        return {
          success: false,
          package: packageName,
          error: err.stderr || err.message
        };
      }
    `,
    );

    // list() - List installed packages from package.json
    this.npm.setMethod(
      'list',
      `
      const { readFileSync } = await import('fs');
      const { join } = await import('path');

      try {
        const pkgPath = join(process.cwd(), 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

        return {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {}
        };
      } catch (err) {
        return { error: err.message };
      }
    `,
    );

    // outdated() - Check for outdated packages
    this.npm.setMethod(
      'outdated',
      `
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      try {
        const result = await execFileAsync('npm', ['outdated', '--json'], {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        return JSON.parse(result.stdout || '{}');
      } catch (err) {
        // npm outdated exits with code 1 if there are outdated packages
        if (err.stdout) {
          try {
            return JSON.parse(err.stdout);
          } catch {
            return { error: 'Failed to parse output' };
          }
        }
        return { error: err.message };
      }
    `,
    );

    // search(query) - Search npm registry
    this.npm.setMethod(
      'search',
      `
      const query = args[0];

      if (!query || typeof query !== 'string') {
        throw new Error('Search query required');
      }

      const resp = await fetch('https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(query) + '&size=10');
      const data = await resp.json();

      return data.objects.map(obj => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        keywords: obj.package.keywords || []
      }));
    `,
    );

    // info(packageName) - Get package info from registry
    this.npm.setMethod(
      'info',
      `
      const packageName = args[0];

      if (!packageName || typeof packageName !== 'string') {
        throw new Error('Package name required');
      }

      const resp = await fetch('https://registry.npmjs.org/' + encodeURIComponent(packageName));

      if (!resp.ok) {
        return { error: 'Package not found', status: resp.status };
      }

      const data = await resp.json();
      const latest = data['dist-tags']?.latest;
      const latestInfo = latest ? data.versions[latest] : null;

      return {
        name: data.name,
        description: data.description,
        latest: latest,
        versions: Object.keys(data.versions || {}),
        license: latestInfo?.license,
        homepage: data.homepage,
        repository: data.repository?.url
      };
    `,
    );

    console.log(`  ✅ Built $npm object (#${this.npm.id})`);
  }

  async registerAliases(): Promise<void> {
    if (!this.npm) {
      throw new Error('Must call build() before registerAliases()');
    }

    const objectManager = await this.manager.load(0);
    if (!objectManager) {
      throw new Error('ObjectManager (#0) not found');
    }

    await objectManager.call('addAlias', 'npm', this.npm.id);
    console.log('  ✅ Registered $npm alias');
  }
}

// Self-register
registerBuilder(NpmBuilder);
