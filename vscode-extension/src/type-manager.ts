/**
 * TypeDefinitionManager
 * Manages TypeScript type definitions from Malice DevTools server
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DevToolsClient } from './devtools-client.js';

/**
 * Manages .d.ts type definition files for Malice objects
 * - Requests types from DevTools server
 * - Writes to .malice/ directory in workspace
 * - Listens for changes and regenerates automatically
 */
export class TypeDefinitionManager {
  private typesDir: vscode.Uri | null = null;
  private disposables: vscode.Disposable[] = [];
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(private client: DevToolsClient) {}

  /**
   * Initialize type management
   * - Creates .malice/ directory
   * - Generates initial types
   * - Sets up change listeners
   */
  async initialize(context: vscode.ExtensionContext): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      console.log('[TypeManager] No workspace folder - types disabled');
      return;
    }

    // Create .malice directory for generated types
    this.typesDir = vscode.Uri.joinPath(workspaceFolder.uri, '.malice');
    try {
      await vscode.workspace.fs.createDirectory(this.typesDir);
    } catch (err) {
      // Directory might already exist
    }

    // Generate initial types
    await this.regenerateTypes();

    // Create/update jsconfig.json to include .malice types
    await this.ensureTypeScriptConfig(workspaceFolder.uri);

    // Listen for change notifications from DevTools server
    this.disposables.push(
      this.client.onNotification((method, params) => {
        if (this.shouldRegenerateTypes(method)) {
          // Debounce - wait 500ms after last change before regenerating
          if (this.updateTimer) {
            clearTimeout(this.updateTimer);
          }
          this.updateTimer = setTimeout(() => {
            this.regenerateTypes();
          }, 500);
        }
      })
    );

    console.log('[TypeManager] Initialized - types dir:', this.typesDir.fsPath);
  }

  /**
   * Check if notification should trigger type regeneration
   */
  private shouldRegenerateTypes(method: string): boolean {
    return [
      'object.created',
      'object.deleted',
      'method.changed',
      'method.deleted',
      'property.changed',
      'property.deleted',
    ].includes(method);
  }

  /**
   * Regenerate all type definitions from DevTools server
   */
  async regenerateTypes(): Promise<void> {
    if (!this.typesDir) {
      return;
    }

    try {
      console.log('[TypeManager] Regenerating types...');

      // Request types from DevTools server
      const result = await this.client.request('types.generate', {});
      const definitions = result.definitions;

      // Write to malice.d.ts
      const typesFile = vscode.Uri.joinPath(this.typesDir, 'malice.d.ts');
      await vscode.workspace.fs.writeFile(typesFile, Buffer.from(definitions, 'utf-8'));

      console.log('[TypeManager] Types regenerated:', typesFile.fsPath);
    } catch (err) {
      console.error('[TypeManager] Failed to regenerate types:', err);
      vscode.window.showErrorMessage(`Failed to generate types: ${err}`);
    }
  }

  /**
   * Generate types for a specific object (context-specific types)
   * Used when editing a specific object's method
   */
  async generateTypesForObject(objectId: number): Promise<string | null> {
    try {
      const result = await this.client.request('types.generate', { objectId });
      return result.definitions;
    } catch (err) {
      console.error('[TypeManager] Failed to generate types for object:', err);
      return null;
    }
  }

  /**
   * Ensure TypeScript/JavaScript config includes .malice types
   * Creates jsconfig.json if it doesn't exist
   */
  private async ensureTypeScriptConfig(workspaceUri: vscode.Uri): Promise<void> {
    const jsconfigUri = vscode.Uri.joinPath(workspaceUri, 'jsconfig.json');
    const tsconfigUri = vscode.Uri.joinPath(workspaceUri, 'tsconfig.json');

    // Check if tsconfig.json exists
    let configExists = false;
    try {
      await vscode.workspace.fs.stat(tsconfigUri);
      configExists = true;
      console.log('[TypeManager] Found existing tsconfig.json');
      return; // Don't modify existing tsconfig.json
    } catch {
      // tsconfig doesn't exist, check jsconfig
    }

    // Check if jsconfig.json exists
    try {
      const content = await vscode.workspace.fs.readFile(jsconfigUri);
      const config = JSON.parse(Buffer.from(content).toString('utf-8'));

      // Ensure .malice is included
      if (!config.include) {
        config.include = [];
      }
      if (!config.include.includes('.malice/**/*')) {
        config.include.push('.malice/**/*');
        await vscode.workspace.fs.writeFile(
          jsconfigUri,
          Buffer.from(JSON.stringify(config, null, 2), 'utf-8')
        );
        console.log('[TypeManager] Updated jsconfig.json to include .malice types');
      }
    } catch {
      // jsconfig doesn't exist, create one
      const config = {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          checkJs: true,
          allowJs: true,
        },
        include: ['.malice/**/*'],
        exclude: ['node_modules'],
      };

      await vscode.workspace.fs.writeFile(
        jsconfigUri,
        Buffer.from(JSON.stringify(config, null, 2), 'utf-8')
      );
      console.log('[TypeManager] Created jsconfig.json with .malice types');
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.disposables.forEach(d => d.dispose());
  }
}
