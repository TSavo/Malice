"use strict";
/**
 * Malice VS Code Extension
 * Provides TypeScript language support for MOO objects via DevTools WebSocket server
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const devtools_client_js_1 = require("./devtools-client.js");
const tree_view_js_1 = require("./tree-view.js");
const type_manager_js_1 = require("./type-manager.js");
let client;
let treeView;
let typeManager;
/**
 * Extension activation
 */
async function activate(context) {
    console.log('Malice extension activated');
    // Get DevTools URL from configuration
    const config = vscode.workspace.getConfiguration('malice');
    const devtoolsUrl = config.get('devtoolsUrl', 'ws://localhost:9999');
    // Create DevTools client
    client = new devtools_client_js_1.DevToolsClient(devtoolsUrl);
    try {
        await client.connect();
        vscode.window.showInformationMessage('Connected to Malice DevTools server');
        // Initialize type definition manager
        typeManager = new type_manager_js_1.TypeDefinitionManager(client);
        await typeManager.initialize(context);
        context.subscriptions.push(typeManager);
    }
    catch (err) {
        vscode.window.showErrorMessage(`Failed to connect to DevTools server: ${err}`);
        console.error('[Malice] Connection failed:', err);
    }
    // Register malice:// file system provider
    const fileSystemProvider = new MaliceFileSystemProvider(client);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('malice', fileSystemProvider, {
        isCaseSensitive: true,
    }));
    // Create tree view provider
    const treeProvider = new tree_view_js_1.MaliceTreeProvider(client);
    treeView = vscode.window.createTreeView('malice-objects', {
        treeDataProvider: treeProvider,
    });
    // Track expand/collapse
    context.subscriptions.push(treeView.onDidExpandElement(e => treeProvider.onDidExpandElement(e.element)));
    context.subscriptions.push(treeView.onDidCollapseElement(e => treeProvider.onDidCollapseElement(e.element)));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('malice.refresh', () => {
        treeProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('malice.openObject', async (objectId) => {
        if (!objectId) {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter object ID',
                placeHolder: '5',
            });
            if (!input)
                return;
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
                }
                else {
                    await vscode.commands.executeCommand('malice.openProperty', objectId, selected.name);
                }
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to load object #${objectId}: ${err}`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('malice.openMethod', async (objectId, methodName) => {
        const uri = vscode.Uri.parse(`malice://objects/${objectId}/${methodName}.ts`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('malice.openProperty', async (objectId, propertyName) => {
        const uri = vscode.Uri.parse(`malice://objects/${objectId}/${propertyName}.json`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('malice.browseObjects', async () => {
        try {
            const objects = await client.listObjects(false);
            const items = objects.map((obj) => ({
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
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to browse objects: ${err}`);
        }
    }));
    context.subscriptions.push(treeView);
}
/**
 * Extension deactivation
 */
function deactivate() {
    if (client) {
        client.close();
    }
}
/**
 * File system provider for malice:// URIs
 * Reads/writes from Malice DevTools WebSocket server
 */
class MaliceFileSystemProvider {
    constructor(client) {
        this.client = client;
        this._emitter = new vscode.EventEmitter();
        this.onDidChangeFile = this._emitter.event;
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
    watch(uri) {
        // Real-time updates handled via WebSocket notifications
        return new vscode.Disposable(() => { });
    }
    async stat(uri) {
        // All files are virtual, just return basic stats
        return {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0,
        };
    }
    readDirectory(uri) {
        // Not used (tree view handles directory browsing)
        return Promise.resolve([]);
    }
    async readFile(uri) {
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
                // Inject type reference at the top of the file
                // This makes VS Code's TypeScript language service aware of generated types
                const typeReference = '/// <reference path="../.malice/malice.d.ts" />\n\n';
                const code = typeReference + method.code;
                return Buffer.from(code, 'utf-8');
            }
            else if (ext === 'json') {
                // Property
                const value = await this.client.getProperty(objectId, name);
                return Buffer.from(JSON.stringify(value, null, 2), 'utf-8');
            }
            else {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
        }
        catch (err) {
            console.error('[FileSystem] Failed to read file:', err);
            throw vscode.FileSystemError.FileNotFound(uri);
        }
    }
    async writeFile(uri, content, options) {
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
                // Method - strip type reference directive before saving
                const typeReferencePattern = /^\/\/\/ <reference path="[^"]*" \/>\s*/;
                const cleanCode = text.replace(typeReferencePattern, '');
                await this.client.setMethod(objectId, name, cleanCode);
            }
            else if (ext === 'json') {
                // Property
                const value = JSON.parse(text);
                await this.client.setProperty(objectId, name, value);
            }
            else {
                throw vscode.FileSystemError.NoPermissions(uri);
            }
            this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
        }
        catch (err) {
            console.error('[FileSystem] Failed to write file:', err);
            throw vscode.FileSystemError.Unavailable(uri);
        }
    }
    rename() {
        throw vscode.FileSystemError.NoPermissions('Rename not supported');
    }
    delete() {
        throw vscode.FileSystemError.NoPermissions('Delete not supported');
    }
    createDirectory() {
        throw vscode.FileSystemError.NoPermissions('Create directory not supported');
    }
}
//# sourceMappingURL=extension.js.map