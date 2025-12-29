"use strict";
/**
 * Enhanced Tree View Provider for Malice Objects
 * Supports categorized views and better navigation
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
exports.MaliceObjectTreeItem = exports.EnhancedMaliceTreeProvider = exports.MaliceMethodTreeItem = exports.MaliceCategoryTreeItem = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Tree item representing a virtual category
 */
class MaliceCategoryTreeItem extends vscode.TreeItem {
    constructor(objectId, category, viewMode, count, description) {
        super(`${category} (${count})`, vscode.TreeItemCollapsibleState.Collapsed);
        this.objectId = objectId;
        this.category = category;
        this.viewMode = viewMode;
        this.count = count;
        this.description = description;
        this.tooltip = `${category}: ${count} methods - ${description}`;
        this.description = `${count} items`;
        this.contextValue = 'maliceCategory';
        this.iconPath = new vscode.ThemeIcon('folder');
        // Category to icon mapping
        const iconMap = {
            lifecycle: 'gear',
            events: 'broadcast',
            public: 'symbol-mixin',
            combat: 'saber',
            communication: 'comment-discussion',
            movement: 'arrow-right',
            inventory: 'package',
            internal: 'wrench',
            properties: 'symbol-property',
        };
        this.iconPath = new vscode.ThemeIcon(iconMap[category] || 'folder');
    }
}
exports.MaliceCategoryTreeItem = MaliceCategoryTreeItem;
/**
 * Tree item representing a method with enhanced metadata
 */
class MaliceMethodTreeItem extends vscode.TreeItem {
    constructor(objectId, name, type, category, metadata) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.objectId = objectId;
        this.name = name;
        this.type = type;
        this.category = category;
        this.metadata = metadata;
        this.contextValue = type === 'method' ? 'maliceMethod' : 'maliceProperty';
        // Enhanced tooltips
        if (metadata) {
            const tooltipLines = [`${type}: ${name}`];
            if (metadata.signature) {
                tooltipLines.push(`Signature: (${metadata.signature})`);
            }
            if (metadata.complexity) {
                const complexity = metadata.complexity;
                const complexityLabel = complexity <= 3
                    ? 'Simple'
                    : complexity <= 7
                        ? 'Moderate'
                        : complexity <= 12
                            ? 'Complex'
                            : 'Very Complex';
                tooltipLines.push(`Complexity: ${complexity} (${complexityLabel})`);
            }
            if (metadata.description) {
                tooltipLines.push(metadata.description);
            }
            this.tooltip = tooltipLines.join('\n');
        }
        else {
            this.tooltip = `${type}: ${name}`;
        }
        // Command to open method/property
        this.command = {
            command: type === 'method' ? 'malice.openMethod' : 'malice.openProperty',
            title: type === 'method' ? 'Open Method' : 'Open Property',
            arguments: [objectId, name],
        };
        // Icons with metadata
        if (type === 'method') {
            this.iconPath = new vscode.ThemeIcon('symbol-method');
            // Add complexity indicator
            if (metadata?.complexity) {
                const complexity = metadata.complexity;
                if (complexity > 10) {
                    this.iconPath = new vscode.ThemeIcon('warning');
                }
                else if (complexity > 6) {
                    this.iconPath = new vscode.ThemeIcon('info');
                }
            }
        }
        else {
            this.iconPath = new vscode.ThemeIcon('symbol-property');
        }
        // Add override indicator
        if (metadata?.overridden) {
            this.description = '⚠️ override';
        }
    }
}
exports.MaliceMethodTreeItem = MaliceMethodTreeItem;
/**
 * Enhanced tree data provider for Malice objects
 */
class EnhancedMaliceTreeProvider {
    constructor(client) {
        this.client = client;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.objects = new Map();
        this.expandedObjects = new Set();
        this.currentViewMode = 'categorized';
        // Listen for change notifications from server
        client.onNotification((method, _params) => {
            if (method.startsWith('object.') ||
                method.startsWith('method.') ||
                method.startsWith('property.')) {
                // Refresh tree when objects change
                this.refresh();
            }
        });
    }
    /**
     * Set view mode and refresh
     */
    setViewMode(mode) {
        this.currentViewMode = mode;
        this.refresh();
    }
    /**
     * Get current view mode
     */
    getViewMode() {
        return this.currentViewMode;
    }
    /**
     * Refresh tree view
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
            return await this.getRootObjects();
        }
        if (element instanceof MaliceObjectTreeItem) {
            // Object expanded - show children based on view mode
            return await this.getObjectChildren(element.objectId);
        }
        if (element instanceof MaliceCategoryTreeItem) {
            // Category expanded - show methods in category
            return await this.getCategoryMethods(element.objectId, element.category);
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
            // Convert to tree items with view mode indicator
            const items = objects.map((obj) => {
                const collapsible = this.expandedObjects.has(obj.id)
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.Collapsed;
                const item = new MaliceObjectTreeItem(obj.id, obj.parent, `Object #${obj.id}`, collapsible, obj.properties || [], obj.methods || []);
                // Add view mode to description
                item.description = `#${obj.id} [${this.currentViewMode}]`;
                return item;
            });
            // Sort by ID
            items.sort((a, b) => a.objectId - b.objectId);
            return items;
        }
        catch (err) {
            console.error('[EnhancedTreeView] Failed to load objects:', err);
            vscode.window.showErrorMessage(`Failed to load objects: ${err}`);
            return [];
        }
    }
    /**
     * Get children for an object based on current view mode
     */
    async getObjectChildren(objectId) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return [];
        switch (this.currentViewMode) {
            case 'flat':
                return await this.getFlatView(objectId, obj);
            case 'categorized':
                return await this.getCategorizedView(objectId, obj);
            case 'by-prototype':
                return await this.getPrototypeView(objectId, obj);
            case 'by-complexity':
                return await this.getComplexityView(objectId, obj);
            default:
                return [];
        }
    }
    /**
     * Get flat view of methods and properties
     */
    async getFlatView(objectId, obj) {
        const items = [];
        // Add methods
        Object.entries(obj.methods || {}).forEach(([methodName, methodData]) => {
            items.push(new MaliceMethodTreeItem(objectId, methodName, 'method', undefined, {
                description: methodData.help,
                signature: 'unknown args',
                complexity: this.calculateComplexity(methodData.code || ''),
            }));
        });
        // Add properties
        Object.keys(obj.properties || {}).forEach((propName) => {
            items.push(new MaliceMethodTreeItem(objectId, propName, 'property'));
        });
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Get categorized view of methods and properties
     */
    async getCategorizedView(objectId, obj) {
        const categories = new Map();
        // Categorize methods
        Object.entries(obj.methods || {}).forEach(([methodName, methodData]) => {
            const category = this.categorizeMethod(methodName, methodData.code || '');
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)?.push({
                name: methodName,
                data: methodData,
                type: 'method',
            });
        });
        // Create category items
        const items = [];
        // Add properties as special category
        if (obj.properties && Object.keys(obj.properties).length > 0) {
            const propertyCount = Object.keys(obj.properties).length;
            items.push(new MaliceCategoryTreeItem(objectId, 'properties', this.currentViewMode, propertyCount, 'Object properties and data fields'));
        }
        // Add method categories
        const categoryNames = [
            'lifecycle',
            'events',
            'public',
            'combat',
            'communication',
            'movement',
            'inventory',
            'internal',
        ];
        for (const categoryName of categoryNames) {
            const categoryItems = categories.get(categoryName) || [];
            if (categoryItems.length > 0) {
                const categoryInfo = this.getCategoryInfo(categoryName);
                items.push(new MaliceCategoryTreeItem(objectId, categoryInfo.name, this.currentViewMode, categoryItems.length, categoryInfo.description));
            }
        }
        return items;
    }
    /**
     * Get methods in a specific category
     */
    async getCategoryMethods(objectId, category) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return [];
        const items = [];
        Object.entries(obj.methods || {}).forEach(([methodName, methodData]) => {
            const methodCategory = this.categorizeMethod(methodName, methodData.code || '');
            if (methodCategory === category ||
                (category === 'properties' && methodCategory === 'properties')) {
                items.push(new MaliceMethodTreeItem(objectId, methodName, category === 'properties' ? 'property' : 'method', category, {
                    description: methodData.help,
                    signature: 'unknown args',
                    complexity: this.calculateComplexity(methodData.code || ''),
                }));
            }
        });
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Get prototype-based view
     */
    async getPrototypeView(objectId, obj) {
        // This would group methods by their origin prototype
        // Implementation deferred for now
        return await this.getFlatView(objectId, obj);
    }
    /**
     * Get complexity-based view
     */
    async getComplexityView(objectId, obj) {
        const items = [];
        Object.entries(obj.methods || {}).forEach(([methodName, methodData]) => {
            const complexity = this.calculateComplexity(methodData.code || '');
            items.push(new MaliceMethodTreeItem(objectId, methodName, 'method', undefined, {
                description: methodData.help,
                signature: 'unknown args',
                complexity,
            }));
        });
        // Sort by complexity (descending)
        return items.sort((a, b) => (b.metadata?.complexity || 0) - (a.metadata?.complexity || 0));
    }
    /**
     * Categorize a method (simplified version for tree view)
     */
    categorizeMethod(methodName, _methodCode) {
        const patterns = {
            lifecycle: [
                /^(connect|disconnect|init|destroy|onCreate|onDestroy|onConnect|onDisconnect)/,
            ],
            events: [/^(on|handle)[A-Z]/, /^.*(?:Event|Hook|Callback)$/],
            public: [
                /^(get|set|is|has|can|do|show|display|list)[a-z]/,
                /^(look|examine|describe)/,
            ],
            combat: [/^(attack|defend|damage|heal|fight|strike|hit)/],
            communication: [/^(say|tell|whisper|shout|announce|broadcast)/],
            movement: [/^(move|go|walk|run|teleport|transport)/],
            inventory: [
                /^(inventory|items|equipment|gear)/,
                /^(take|drop|give|equip|unequip|wield)/,
            ],
            internal: [/^_/, /^(validate|check|verify|test|debug)/],
        };
        for (const [category, regexList] of Object.entries(patterns)) {
            for (const regex of regexList) {
                if (regex.test(methodName)) {
                    return category;
                }
            }
        }
        return 'public';
    }
    /**
     * Get category information
     */
    getCategoryInfo(category) {
        const info = {
            lifecycle: {
                name: '🔧 Lifecycle',
                description: 'Object lifecycle and initialization methods',
            },
            events: {
                name: '📡 Events',
                description: 'Event handlers and callbacks',
            },
            public: {
                name: '🔍 Public API',
                description: 'User-facing methods and commands',
            },
            combat: {
                name: '⚔️ Combat',
                description: 'Combat and battle-related methods',
            },
            communication: {
                name: '💬 Communication',
                description: 'Chat, messaging and communication',
            },
            movement: {
                name: '🚶 Movement',
                description: 'Movement and navigation methods',
            },
            inventory: {
                name: '🎒 Inventory',
                description: 'Item and inventory management',
            },
            internal: {
                name: '🔧 Internal',
                description: 'Internal utilities and helpers',
            },
        };
        return info[category] || { name: `📁 ${category}`, description: category };
    }
    /**
     * Calculate method complexity (simple approximation)
     */
    calculateComplexity(code) {
        const complexityKeywords = [
            'if',
            'else',
            'while',
            'for',
            'switch',
            'case',
            'catch',
            '&&',
            '||',
        ];
        let complexity = 1; // Base complexity
        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
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
exports.EnhancedMaliceTreeProvider = EnhancedMaliceTreeProvider;
/**
 * Tree item representing a Malice object (reusing original)
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
        this.contextValue = 'maliceObject';
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
//# sourceMappingURL=enhanced-tree-view.js.map