"use strict";
/**
 * Tree View Provider for Malice Objects
 * Shows object hierarchy in VS Code sidebar
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
exports.MaliceTreeProvider = exports.MaliceMethodTreeItem = exports.MaliceObjectTreeItem = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Tree item representing a Malice object
 */
class MaliceObjectTreeItem extends vscode.TreeItem {
    constructor(objectId, parentId, label, collapsibleState, properties, methods) {
        super(label, collapsibleState);
        this.objectId = objectId;
        this.parentId = parentId;
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.properties = properties;
        this.methods = methods;
        this.tooltip = `Object #${objectId}`;
        this.description = `#${objectId}`;
        this.contextValue = 'maliceObject';
        // Icon
        this.iconPath = new vscode.ThemeIcon('symbol-object');
        // Command to expand object
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.command = {
                command: 'malice.openObject',
                title: 'Open Object',
                arguments: [objectId],
            };
        }
    }
}
exports.MaliceObjectTreeItem = MaliceObjectTreeItem;
/**
 * Tree item representing a method or property
 */
class MaliceMethodTreeItem extends vscode.TreeItem {
    constructor(objectId, name, type) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.objectId = objectId;
        this.name = name;
        this.type = type;
        this.tooltip = `${type}: ${name}`;
        this.contextValue = type === 'method' ? 'maliceMethod' : 'maliceProperty';
        // Icon
        this.iconPath = new vscode.ThemeIcon(type === 'method' ? 'symbol-method' : 'symbol-property');
        // Command to open method/property
        this.command = {
            command: type === 'method' ? 'malice.openMethod' : 'malice.openProperty',
            title: type === 'method' ? 'Open Method' : 'Open Property',
            arguments: [objectId, name],
        };
    }
}
exports.MaliceMethodTreeItem = MaliceMethodTreeItem;
/**
 * Tree data provider for Malice objects
 */
class MaliceTreeProvider {
    constructor(client) {
        this.client = client;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.objects = new Map();
        this.expandedObjects = new Set();
        // Listen for change notifications from server
        client.onNotification((method, params) => {
            if (method.startsWith('object.') || method.startsWith('method.') || method.startsWith('property.')) {
                // Refresh tree when objects change
                this.refresh();
            }
        });
    }
    /**
     * Refresh the tree view
     */
    refresh() {
        this.objects.clear();
        this._onDidChangeTreeData.fire(undefined);
    }
    /**
     * Get tree item
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get children for tree item
     */
    async getChildren(element) {
        if (!element) {
            // Root level - show all objects
            return this.getRootObjects();
        }
        if (element instanceof MaliceObjectTreeItem) {
            // Object expanded - show methods and properties
            const children = [];
            // Add methods
            for (const methodName of element.methods) {
                children.push(new MaliceMethodTreeItem(element.objectId, methodName, 'method'));
            }
            // Add properties
            for (const propName of element.properties) {
                children.push(new MaliceMethodTreeItem(element.objectId, propName, 'property'));
            }
            return children;
        }
        return [];
    }
    /**
     * Get root objects from server
     */
    async getRootObjects() {
        try {
            const objects = await this.client.listObjects(false);
            // Cache objects
            this.objects.clear();
            for (const obj of objects) {
                this.objects.set(obj.id, obj);
            }
            // Convert to tree items
            const items = objects.map((obj) => {
                const collapsible = this.expandedObjects.has(obj.id)
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.Collapsed;
                return new MaliceObjectTreeItem(obj.id, obj.parent, `Object #${obj.id}`, collapsible, obj.properties || [], obj.methods || []);
            });
            // Sort by ID
            items.sort((a, b) => a.objectId - b.objectId);
            return items;
        }
        catch (err) {
            console.error('[TreeView] Failed to load objects:', err);
            vscode.window.showErrorMessage(`Failed to load objects: ${err}`);
            return [];
        }
    }
    /**
     * Track expanded state
     */
    onDidExpandElement(element) {
        if (element instanceof MaliceObjectTreeItem) {
            this.expandedObjects.add(element.objectId);
        }
    }
    /**
     * Track collapsed state
     */
    onDidCollapseElement(element) {
        if (element instanceof MaliceObjectTreeItem) {
            this.expandedObjects.delete(element.objectId);
        }
    }
}
exports.MaliceTreeProvider = MaliceTreeProvider;
//# sourceMappingURL=tree-view.js.map