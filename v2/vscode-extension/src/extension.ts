/**
 * Malice VS Code Extension
 * Provides TypeScript language support for MOO objects
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Malice extension activated');

  // Register malice:// file system provider
  const fileSystemProvider = new MaliceFileSystemProvider();
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider('malice', fileSystemProvider, {
      isCaseSensitive: true,
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('malice.openObject', async () => {
      const objectId = await vscode.window.showInputBox({
        prompt: 'Enter object ID',
        placeHolder: '5',
      });

      if (objectId) {
        const uri = vscode.Uri.parse(`malice://objects/${objectId}/`);
        const files = await fileSystemProvider.readDirectory(uri);

        // Show quick pick of methods
        const selected = await vscode.window.showQuickPick(
          files.map(([name]) => name),
          { placeHolder: 'Select method or property to edit' }
        );

        if (selected) {
          const fileUri = vscode.Uri.parse(`malice://objects/${objectId}/${selected}`);
          const doc = await vscode.workspace.openTextDocument(fileUri);
          await vscode.window.showTextDocument(doc);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('malice.browseObjects', async () => {
      const uri = vscode.Uri.parse('malice://objects/');
      const files = await fileSystemProvider.readDirectory(uri);

      const selected = await vscode.window.showQuickPick(
        files.map(([name]) => `#${name}`),
        { placeHolder: 'Select object to open' }
      );

      if (selected) {
        const objectId = selected.substring(1); // Remove #
        vscode.commands.executeCommand('malice.openObject');
      }
    })
  );

  // Start language server
  startLanguageServer(context);
}

/**
 * Start the Malice LSP server
 */
function startLanguageServer(context: vscode.ExtensionContext) {
  // Path to LSP server
  const serverModule = context.asAbsolutePath(
    path.join('..', 'out', 'lsp', 'server-launcher.js')
  );

  // Server options
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  // Client options
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'malice', language: 'typescript' },
      { scheme: 'malice', language: 'json' },
    ],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{ts,json}'),
    },
  };

  // Create and start client
  client = new LanguageClient(
    'maliceLSP',
    'Malice Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
}

/**
 * Extension deactivation
 */
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

/**
 * File system provider for malice:// URIs
 * Reads from Malice MongoDB via HTTP API
 */
class MaliceFileSystemProvider implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  watch(uri: vscode.Uri): vscode.Disposable {
    // TODO: Watch MongoDB change stream
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    // Parse URI to determine if directory or file
    const parts = uri.path.split('/').filter(Boolean);

    if (parts.length === 1) {
      // malice://objects/{id}/ - directory
      return {
        type: vscode.FileType.Directory,
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0,
      };
    } else {
      // malice://objects/{id}/{file}.{ts|json} - file
      return {
        type: vscode.FileType.File,
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0,
      };
    }
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    // TODO: Query MongoDB via HTTP API
    // For now, return mock data
    const config = vscode.workspace.getConfiguration('malice');
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:3000');

    try {
      const response = await fetch(`${apiUrl}/api/lsp/list${uri.path}`);
      const entries = await response.json();

      return entries.map((entry: { name: string; type: string }) => [
        entry.name,
        entry.type === 'directory' ? vscode.FileType.Directory : vscode.FileType.File,
      ]);
    } catch (err) {
      console.error('Failed to read directory:', err);
      return [];
    }
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    // TODO: Query MongoDB via HTTP API
    const config = vscode.workspace.getConfiguration('malice');
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:3000');

    try {
      const response = await fetch(`${apiUrl}/api/lsp/read${uri.path}`);
      const content = await response.text();
      return Buffer.from(content, 'utf-8');
    } catch (err) {
      console.error('Failed to read file:', err);
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    // TODO: Update MongoDB via HTTP API
    const config = vscode.workspace.getConfiguration('malice');
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:3000');

    try {
      await fetch(`${apiUrl}/api/lsp/write${uri.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: Buffer.from(content).toString('utf-8'),
      });

      this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    } catch (err) {
      console.error('Failed to write file:', err);
      throw vscode.FileSystemError.Unavailable(uri);
    }
  }

  rename(): void {
    throw new Error('Rename not supported');
  }

  delete(): void {
    throw new Error('Delete not supported');
  }

  createDirectory(): void {
    throw new Error('Create directory not supported');
  }
}
