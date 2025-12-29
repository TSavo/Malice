/**
 * Malice VS Code Extension
 * Provides TypeScript language support for MOO objects via DevTools WebSocket server
 */

import * as vscode from 'vscode';
import { DevToolsClient } from './devtools-client.js';
import {
  MaliceTreeProvider,
  MaliceObjectTreeItem,
  MaliceMethodTreeItem,
} from './tree-view.js';
import { TypeDefinitionManager } from './type-manager.js';

let client: DevToolsClient;
let treeView: vscode.TreeView<vscode.TreeItem>;
let typeManager: TypeDefinitionManager;
let statusBar: vscode.StatusBarItem;

/**
 * Current view mode for tree display
 */
type ViewMode = 'flat' | 'categorized' | 'by-complexity';
let currentViewMode: ViewMode = 'categorized';

/**
 * QuickPickItem with custom value property
 */
interface ViewModeQuickPickItem extends vscode.QuickPickItem {
  value: ViewMode;
}

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Malice extension activated');

  // Get DevTools URL from configuration
  const config = vscode.workspace.getConfiguration('malice');
  const devtoolsUrl = config.get<string>('devtoolsUrl', 'ws://localhost:9999');

  // Create DevTools client
  client = new DevToolsClient(devtoolsUrl);

  try {
    await client.connect();
    vscode.window.showInformationMessage('Connected to Malice DevTools server');

    // Initialize type definition manager
    typeManager = new TypeDefinitionManager(client);
    await typeManager.initialize(context);
    context.subscriptions.push(typeManager);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to connect to DevTools server: ${err}`,
    );
    console.error('[Malice] Connection failed:', err);
  }

  // Create tree view provider first (needed for notification coordination)
  const treeProvider = new MaliceTreeProvider(client);

  // Register malice:// file system provider
  const fileSystemProvider = new MaliceFileSystemProvider(client, treeProvider);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider('malice', fileSystemProvider, {
      isCaseSensitive: true,
    }),
  );
  treeView = vscode.window.createTreeView('malice-objects', {
    treeDataProvider: treeProvider,
  });

  // Track expand/collapse
  context.subscriptions.push(
    treeView.onDidExpandElement((e) =>
      treeProvider.onDidExpandElement(e.element),
    ),
  );
  context.subscriptions.push(
    treeView.onDidCollapseElement((e) =>
      treeProvider.onDidCollapseElement(e.element),
    ),
  );

  // Create status bar item for view mode
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.text = `$(folder) ${currentViewMode}`;
  statusBar.tooltip = 'Click to change view mode';
  statusBar.command = 'malice.switchView';
  context.subscriptions.push(statusBar);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('malice.refresh', () => {
      treeProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.switchView', async () => {
      const options: ViewModeQuickPickItem[] = [
        {
          label: '📁 Categorized',
          description: 'Group methods by functionality',
          value: 'categorized',
        },
        {
          label: '📄 Flat',
          description: 'Show all methods in single list',
          value: 'flat',
        },
        {
          label: '⚡ By Complexity',
          description: 'Sort by method complexity',
          value: 'by-complexity',
        },
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: `Current view: ${currentViewMode}`,
      });

      if (selected && selected.value !== currentViewMode) {
        currentViewMode = selected.value;
        statusBar.text = `$(folder) ${currentViewMode}`;

        // Update tree provider if it supports view switching
        if ('setViewMode' in treeProvider) {
          (treeProvider as any).setViewMode(currentViewMode);
        } else {
          // Fallback: refresh tree
          treeProvider.refresh();
        }
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.openObject',
      async (objectId?: number) => {
        if (!objectId) {
          const input = await vscode.window.showInputBox({
            prompt: 'Enter object ID',
            placeHolder: '5',
          });

          if (!input) return;
          objectId = parseInt(input, 10);
        }

        try {
          const obj = await client.getObject(objectId);
          const methods = Object.keys(obj.methods || {});
          const properties = Object.keys(obj.properties || {});

          const items = [
            ...methods.map((m) => ({
              label: `📝 ${m}`,
              type: 'method',
              name: m,
            })),
            ...properties.map((p) => ({
              label: `🔧 ${p}`,
              type: 'property',
              name: p,
            })),
          ];

          const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select method or property to edit',
          });

          if (selected) {
            if (selected.type === 'method') {
              await vscode.commands.executeCommand(
                'malice.openMethod',
                objectId,
                selected.name,
              );
            } else {
              await vscode.commands.executeCommand(
                'malice.openProperty',
                objectId,
                selected.name,
              );
            }
          }
        } catch (err) {
          vscode.window.showErrorMessage(
            `Failed to load object #${objectId}: ${err}`,
          );
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.openMethod',
      async (objectId: number, methodName: string) => {
        const uri = vscode.Uri.parse(
          `malice://objects/${objectId}/${methodName}.ts`,
        );
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.openProperty',
      async (objectId: number, propertyName: string) => {
        const uri = vscode.Uri.parse(
          `malice://objects/${objectId}/${propertyName}.json`,
        );
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.browseObjects', async () => {
      try {
        const objects = await client.listObjects(false);
        const items = objects.map((obj: any) => ({
          label: `#${obj.id}`,
          description: `parent: #${obj.parent}`,
          id: obj.id,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select object to open',
        });

        if (selected) {
          await vscode.commands.executeCommand(
            'malice.openObject',
            selected.id,
          );
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to browse objects: ${err}`);
      }
    }),
  );

  // Add Method command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.addMethod',
      async (item: MaliceObjectTreeItem) => {
        if (!item) {
          vscode.window.showErrorMessage('No object selected');
          return;
        }

        const name = await vscode.window.showInputBox({
          prompt: 'Enter method name',
          placeHolder: 'myMethod',
          validateInput: (value) => {
            if (!value) return 'Method name is required';
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
              return 'Invalid method name';
            }
            return null;
          },
        });

        if (!name) return;

        try {
          // Create with template code
          const templateCode = `// ${name} method\nreturn null;`;
          await client.setMethod(item.objectId, name, templateCode);
          treeProvider.refresh();

          // Open the new method
          await vscode.commands.executeCommand(
            'malice.openMethod',
            item.objectId,
            name,
          );
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to create method: ${err}`);
        }
      },
    ),
  );

  // Add Property command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.addProperty',
      async (item: MaliceObjectTreeItem) => {
        if (!item) {
          vscode.window.showErrorMessage('No object selected');
          return;
        }

        const name = await vscode.window.showInputBox({
          prompt: 'Enter property name',
          placeHolder: 'myProperty',
          validateInput: (value) => {
            if (!value) return 'Property name is required';
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
              return 'Invalid property name';
            }
            return null;
          },
        });

        if (!name) return;

        try {
          // Create with null value
          await client.setProperty(item.objectId, name, null);
          treeProvider.refresh();

          // Open the new property
          await vscode.commands.executeCommand(
            'malice.openProperty',
            item.objectId,
            name,
          );
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to create property: ${err}`);
        }
      },
    ),
  );

  // Delete Method command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.deleteMethod',
      async (item: MaliceMethodTreeItem) => {
        if (!item || item.type !== 'method') {
          vscode.window.showErrorMessage('No method selected');
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          `Delete method '${item.name}' from object #${item.objectId}?`,
          { modal: true },
          'Delete',
        );

        if (confirm !== 'Delete') return;

        try {
          await client.deleteMethod(item.objectId, item.name);
          treeProvider.refresh();
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to delete method: ${err}`);
        }
      },
    ),
  );

  // Delete Property command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'malice.deleteProperty',
      async (item: MaliceMethodTreeItem) => {
        if (!item || item.type !== 'property') {
          vscode.window.showErrorMessage('No property selected');
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          `Delete property '${item.name}' from object #${item.objectId}?`,
          { modal: true },
          'Delete',
        );

        if (confirm !== 'Delete') return;

        try {
          await client.deleteProperty(item.objectId, item.name);
          treeProvider.refresh();
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to delete property: ${err}`);
        }
      },
    ),
  );

  context.subscriptions.push(treeView);
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  if (client) {
    client.close();
  }
}

/**
 * File system provider for malice:// URIs
 * Reads/writes from Malice DevTools WebSocket server
 */
class MaliceFileSystemProvider implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    this._emitter.event;

  constructor(
    private client: DevToolsClient,
    private treeProvider: MaliceTreeProvider,
  ) {
    // Listen for notifications from server
    client.onNotification((method, params) => {
      const { objectId, name } = params;

      if (method === 'method.changed' || method === 'property.changed') {
        // File changed or created
        const ext = method === 'method.changed' ? 'ts' : 'json';
        const uri = vscode.Uri.parse(
          `malice://objects/${objectId}/${name}.${ext}`,
        );
        this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
        // Refresh tree in case it's a new method/property
        this.treeProvider.refresh();
      } else if (method === 'method.deleted' || method === 'property.deleted') {
        // File deleted
        const ext = method === 'method.deleted' ? 'ts' : 'json';
        const uri = vscode.Uri.parse(
          `malice://objects/${objectId}/${name}.${ext}`,
        );
        this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
        // Refresh tree to remove the item
        this.treeProvider.refresh();
      } else if (method === 'object.created' || method === 'object.changed') {
        // Object structure changed - refresh tree
        this.treeProvider.refresh();
      }
    });
  }

  watch(_uri: vscode.Uri): vscode.Disposable {
    // Real-time updates handled via WebSocket notifications
    return new vscode.Disposable(() => {});
  }

  async stat(_uri: vscode.Uri): Promise<vscode.FileStat> {
    // All files are virtual, just return basic stats
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: 0,
    };
  }

  readDirectory(_uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    // Not used (tree view handles directory browsing)
    return Promise.resolve([]);
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    console.log('[FileSystem] readFile called:', uri.toString());
    console.log('[FileSystem] URI authority:', uri.authority, 'path:', uri.path);
    try {
      // malice://objects/{id}/{name}.{ext}
      // authority = 'objects', path = '/{id}/{name}.{ext}'
      const parts = uri.path.split('/').filter(Boolean);
      console.log('[FileSystem] Path parts:', parts);

      if (uri.authority !== 'objects' || parts.length !== 2) {
        console.log('[FileSystem] Invalid path structure');
        throw vscode.FileSystemError.FileNotFound(uri);
      }

      const objectId = parseInt(parts[0], 10);
      const filename = parts[1];
      const ext = filename.substring(filename.lastIndexOf('.') + 1);
      const name = filename.substring(0, filename.lastIndexOf('.'));
      console.log('[FileSystem] Parsed:', { objectId, filename, ext, name });

      if (ext === 'ts') {
        // Method
        console.log('[FileSystem] Fetching method...');
        const method = await this.client.getMethod(objectId, name);
        console.log('[FileSystem] Got method, code length:', method.code?.length);

        // Inject type reference at the top of the file
        // This makes VS Code's TypeScript language service aware of generated types
        const typeReference =
          '/// <reference path="../.malice/malice.d.ts" />\n\n';
        const code = typeReference + method.code;

        return Buffer.from(code, 'utf-8');
      } else if (ext === 'json') {
        // Property
        console.log('[FileSystem] Fetching property...');
        const value = await this.client.getProperty(objectId, name);
        console.log('[FileSystem] Got property value:', typeof value, value);

        // Handle undefined values - JSON.stringify(undefined) returns undefined, not a string
        const jsonStr = value === undefined ? 'null' : JSON.stringify(value, null, 2);
        console.log('[FileSystem] JSON string:', jsonStr);
        return Buffer.from(jsonStr, 'utf-8');
      } else {
        console.log('[FileSystem] Unknown extension:', ext);
        throw vscode.FileSystemError.FileNotFound(uri);
      }
    } catch (err) {
      console.error('[FileSystem] Failed to read file:', uri.toString());
      console.error('[FileSystem] Error:', err);
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    _options: { create: boolean; overwrite: boolean },
  ): Promise<void> {
    try {
      // malice://objects/{id}/{name}.{ext}
      // authority = 'objects', path = '/{id}/{name}.{ext}'
      const parts = uri.path.split('/').filter(Boolean);
      if (uri.authority !== 'objects' || parts.length !== 2) {
        throw vscode.FileSystemError.NoPermissions(uri);
      }

      const objectId = parseInt(parts[0], 10);
      const filename = parts[1];
      const ext = filename.substring(filename.lastIndexOf('.') + 1);
      const name = filename.substring(0, filename.lastIndexOf('.'));
      const text = Buffer.from(content).toString('utf-8');

      if (ext === 'ts') {
        // Method - strip type reference directive before saving
        const typeReferencePattern = /^\/\/\/ <reference path="[^"]*" \/>\s*/;
        const cleanCode = text.replace(typeReferencePattern, '');
        await this.client.setMethod(objectId, name, cleanCode);
      } else if (ext === 'json') {
        // Property
        const value = JSON.parse(text);
        await this.client.setProperty(objectId, name, value);
      } else {
        throw vscode.FileSystemError.NoPermissions(uri);
      }

      this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    } catch (err) {
      console.error('[FileSystem] Failed to write file:', err);
      throw vscode.FileSystemError.Unavailable(uri);
    }
  }

  rename(): void {
    throw vscode.FileSystemError.NoPermissions('Rename not supported');
  }

  delete(): void {
    throw vscode.FileSystemError.NoPermissions('Delete not supported');
  }

  createDirectory(): void {
    throw vscode.FileSystemError.NoPermissions(
      'Create directory not supported',
    );
  }
}
