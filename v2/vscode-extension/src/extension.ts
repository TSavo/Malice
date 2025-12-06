/**
 * Malice VS Code Extension
 * Provides TypeScript language support for MOO objects via DevTools WebSocket server
 */

import * as vscode from 'vscode';
import { DevToolsClient } from './devtools-client.js';
import { MaliceTreeProvider } from './tree-view.js';

let client: DevToolsClient;
let treeView: vscode.TreeView<vscode.TreeItem>;

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
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to connect to DevTools server: ${err}`);
    console.error('[Malice] Connection failed:', err);
  }

  // Register malice:// file system provider
  const fileSystemProvider = new MaliceFileSystemProvider(client);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider('malice', fileSystemProvider, {
      isCaseSensitive: true,
    })
  );

  // Create tree view provider
  const treeProvider = new MaliceTreeProvider(client);
  treeView = vscode.window.createTreeView('malice-objects', {
    treeDataProvider: treeProvider,
  });

  // Track expand/collapse
  context.subscriptions.push(
    treeView.onDidExpandElement(e => treeProvider.onDidExpandElement(e.element))
  );
  context.subscriptions.push(
    treeView.onDidCollapseElement(e => treeProvider.onDidCollapseElement(e.element))
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('malice.refresh', () => {
      treeProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.openObject', async (objectId?: number) => {
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
          ...methods.map(m => ({ label: `📝 ${m}`, type: 'method', name: m })),
          ...properties.map(p => ({ label: `🔧 ${p}`, type: 'property', name: p })),
        ];

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select method or property to edit',
        });

        if (selected) {
          if (selected.type === 'method') {
            await vscode.commands.executeCommand('malice.openMethod', objectId, selected.name);
          } else {
            await vscode.commands.executeCommand('malice.openProperty', objectId, selected.name);
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to load object #${objectId}: ${err}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.openMethod', async (objectId: number, methodName: string) => {
      const uri = vscode.Uri.parse(`malice://objects/${objectId}/${methodName}.ts`);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.openProperty', async (objectId: number, propertyName: string) => {
      const uri = vscode.Uri.parse(`malice://objects/${objectId}/${propertyName}.json`);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    })
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
          await vscode.commands.executeCommand('malice.openObject', selected.id);
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to browse objects: ${err}`);
      }
    })
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
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  constructor(private client: DevToolsClient) {
    // Listen for change notifications from server
    client.onNotification((method, params) => {
      if (method === 'method.changed' || method === 'property.changed') {
        const { objectId, name } = params;
        const ext = method === 'method.changed' ? 'ts' : 'json';
        const uri = vscode.Uri.parse(`malice://objects/${objectId}/${name}.${ext}`);
        this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
      }
    });
  }

  watch(uri: vscode.Uri): vscode.Disposable {
    // Real-time updates handled via WebSocket notifications
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    // All files are virtual, just return basic stats
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: 0,
    };
  }

  readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    // Not used (tree view handles directory browsing)
    return Promise.resolve([]);
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    try {
      const parts = uri.path.split('/').filter(Boolean);
      // malice://objects/{id}/{name}.{ext}
      if (parts.length !== 3 || parts[0] !== 'objects') {
        throw vscode.FileSystemError.FileNotFound(uri);
      }

      const objectId = parseInt(parts[1], 10);
      const filename = parts[2];
      const ext = filename.substring(filename.lastIndexOf('.') + 1);
      const name = filename.substring(0, filename.lastIndexOf('.'));

      if (ext === 'ts') {
        // Method
        const method = await this.client.getMethod(objectId, name);
        return Buffer.from(method.code, 'utf-8');
      } else if (ext === 'json') {
        // Property
        const value = await this.client.getProperty(objectId, name);
        return Buffer.from(JSON.stringify(value, null, 2), 'utf-8');
      } else {
        throw vscode.FileSystemError.FileNotFound(uri);
      }
    } catch (err) {
      console.error('[FileSystem] Failed to read file:', err);
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    try {
      const parts = uri.path.split('/').filter(Boolean);
      if (parts.length !== 3 || parts[0] !== 'objects') {
        throw vscode.FileSystemError.NoPermissions(uri);
      }

      const objectId = parseInt(parts[1], 10);
      const filename = parts[2];
      const ext = filename.substring(filename.lastIndexOf('.') + 1);
      const name = filename.substring(0, filename.lastIndexOf('.'));
      const text = Buffer.from(content).toString('utf-8');

      if (ext === 'ts') {
        // Method
        await this.client.setMethod(objectId, name, text);
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
    throw vscode.FileSystemError.NoPermissions('Create directory not supported');
  }
}
