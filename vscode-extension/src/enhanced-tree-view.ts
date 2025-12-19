/**
 * Enhanced Tree View Provider for Malice Objects
 * Supports categorized views and better navigation
 */

import * as vscode from 'vscode';
import type { DevToolsClient } from './devtools-client.js';

/**
 * View mode for tree display
 */
export type ViewMode = 'flat' | 'categorized' | 'by-prototype' | 'by-complexity';

/**
 * Tree item representing a virtual category
 */
export class MaliceCategoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly objectId: number,
    public readonly category: string,
    public readonly viewMode: ViewMode,
    public readonly count: number,
    public readonly description: string
  ) {
    super(`${category} (${count})`, vscode.TreeItemCollapsibleState.Collapsed);

    this.tooltip = `${category}: ${count} methods - ${description}`;
    this.description = `${count} items`;
    this.contextValue = 'maliceCategory';
    this.iconPath = new vscode.ThemeIcon('folder');
    
    // Category to icon mapping
    const iconMap: Record<string, string> = {
      'lifecycle': 'gear',
      'events': 'broadcast',
      'public': 'symbol-mixin',
      'combat': 'saber',
      'communication': 'comment-discussion',
      'movement': 'arrow-right',
      'inventory': 'package',
      'internal': 'wrench',
      'properties': 'symbol-property'
    };

    this.iconPath = new vscode.ThemeIcon(iconMap[category] || 'folder');
  }
}

/**
 * Tree item representing a method with enhanced metadata
 */
export class MaliceMethodTreeItem extends vscode.TreeItem {
  constructor(
    public readonly objectId: number,
    public readonly name: string,
    public readonly type: 'method' | 'property',
    public readonly category?: string,
    public readonly metadata?: {
      description?: string;
      signature?: string;
      complexity?: number;
      overridden?: boolean;
    }
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = type === 'method' ? 'maliceMethod' : 'maliceProperty';

    // Enhanced tooltips
    if (metadata) {
      const tooltipLines = [`${type}: ${name}`];
      if (metadata.signature) {
        tooltipLines.push(`Signature: (${metadata.signature})`);
      }
      if (metadata.complexity) {
        const complexity = metadata.complexity;
        const complexityLabel = complexity <= 3 ? 'Simple' : 
                             complexity <= 7 ? 'Moderate' : 
                             complexity <= 12 ? 'Complex' : 'Very Complex';
        tooltipLines.push(`Complexity: ${complexity} (${complexityLabel})`);
      }
      if (metadata.description) {
        tooltipLines.push(metadata.description);
      }
      this.tooltip = tooltipLines.join('\n');
    } else {
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
        } else if (complexity > 6) {
          this.iconPath = new vscode.ThemeIcon('info');
        }
      }
    } else {
      this.iconPath = new vscode.ThemeIcon('symbol-property');
    }

    // Add override indicator
    if (metadata?.overridden) {
      this.description = '⚠️ override';
    }
  }
}

/**
 * Enhanced tree data provider for Malice objects
 */
export class EnhancedMaliceTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private objects: Map<number, any> = new Map();
  private expandedObjects = new Set<number>();
  private currentViewMode: ViewMode = 'categorized';

  constructor(private client: DevToolsClient) {
    // Listen for change notifications from server
    client.onNotification((method, params) => {
      if (method.startsWith('object.') || method.startsWith('method.') || method.startsWith('property.')) {
        // Refresh tree when objects change
        this.refresh();
      }
    });
  }

  /**
   * Set view mode and refresh
   */
  setViewMode(mode: ViewMode): void {
    this.currentViewMode = mode;
    this.refresh();
  }

  /**
   * Get current view mode
   */
  getViewMode(): ViewMode {
    return this.currentViewMode;
  }

  /**
   * Refresh tree view
   */
  refresh(): void {
    this.objects.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Get tree item
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for tree item
   */
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
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
  private async getRootObjects(): Promise<MaliceObjectTreeItem[]> {
    try {
      const objects = await this.client.listObjects(false);

      // Cache objects
      this.objects.clear();
      for (const obj of objects) {
        this.objects.set(obj.id, obj);
      }

      // Convert to tree items with view mode indicator
      const items = objects.map((obj: any) => {
        const collapsible = this.expandedObjects.has(obj.id)
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;

        const item = new MaliceObjectTreeItem(
          obj.id,
          obj.parent,
          `Object #${obj.id}`,
          collapsible,
          obj.properties || [],
          obj.methods || []
        );

        // Add view mode to description
        item.description = `#${obj.id} [${this.currentViewMode}]`;

        return item;
      });

      // Sort by ID
      items.sort((a, b) => a.objectId - b.objectId);

      return items;
    } catch (err) {
      console.error('[EnhancedTreeView] Failed to load objects:', err);
      vscode.window.showErrorMessage(`Failed to load objects: ${err}`);
      return [];
    }
  }

  /**
   * Get children for an object based on current view mode
   */
  private async getObjectChildren(objectId: number): Promise<vscode.TreeItem[]> {
    const obj = this.objects.get(objectId);
    if (!obj) return [];

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
  private async getFlatView(objectId: number, obj: any): Promise<MaliceMethodTreeItem[]> {
    const items: MaliceMethodTreeItem[] = [];

    // Add methods
    Object.entries(obj.methods || {}).forEach(([methodName, methodData]: [string, any]) => {
      items.push(new MaliceMethodTreeItem(
        objectId,
        methodName,
        'method',
        undefined,
        {
          description: methodData.help,
          signature: 'unknown args',
          complexity: this.calculateComplexity(methodData.code || '')
        }
      ));
    });

    // Add properties
    Object.keys(obj.properties || {}).forEach(propName => {
      items.push(new MaliceMethodTreeItem(objectId, propName, 'property'));
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get categorized view of methods and properties
   */
  private async getCategorizedView(objectId: number, obj: any): Promise<vscode.TreeItem[]> {
    const categories = new Map<string, any[]>();
    
    // Categorize methods
    Object.entries(obj.methods || {}).forEach(([methodName, methodData]: [string, any]) => {
      const category = this.categorizeMethod(methodName, methodData.code || '');
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category)!.push({
        name: methodName,
        data: methodData,
        type: 'method'
      });
    });

    // Create category items
    const items: vscode.TreeItem[] = [];

    // Add properties as special category
    if (obj.properties && Object.keys(obj.properties).length > 0) {
      const propertyCount = Object.keys(obj.properties).length;
      items.push(new MaliceCategoryTreeItem(
        objectId,
        'properties',
        this.currentViewMode,
        propertyCount,
        'Object properties and data fields'
      ));
    }

    // Add method categories
    const categoryNames = ['lifecycle', 'events', 'public', 'combat', 'communication', 'movement', 'inventory', 'internal'];
    
    for (const categoryName of categoryNames) {
      const categoryItems = categories.get(categoryName) || [];
      if (categoryItems.length > 0) {
        const categoryInfo = this.getCategoryInfo(categoryName);
        items.push(new MaliceCategoryTreeItem(
          objectId,
          categoryInfo.name,
          this.currentViewMode,
          categoryItems.length,
          categoryInfo.description
        ));
      }
    }

    return items;
  }

  /**
   * Get methods in a specific category
   */
  private async getCategoryMethods(objectId: number, category: string): Promise<MaliceMethodTreeItem[]> {
    const obj = this.objects.get(objectId);
    if (!obj) return [];

    const items: MaliceMethodTreeItem[] = [];

    Object.entries(obj.methods || {}).forEach(([methodName, methodData]: [string, any]) => {
      const methodCategory = this.categorizeMethod(methodName, methodData.code || '');
      
      if (methodCategory === category || (category === 'properties' && methodCategory === 'properties')) {
        items.push(new MaliceMethodTreeItem(
          objectId,
          methodName,
          category === 'properties' ? 'property' : 'method',
          category,
          {
            description: methodData.help,
            signature: 'unknown args',
            complexity: this.calculateComplexity(methodData.code || '')
          }
        ));
      }
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get prototype-based view
   */
  private async getPrototypeView(objectId: number, obj: any): Promise<MaliceMethodTreeItem[]> {
    // This would group methods by their origin prototype
    // Implementation deferred for now
    return await this.getFlatView(objectId, obj);
  }

  /**
   * Get complexity-based view
   */
  private async getComplexityView(objectId: number, obj: any): Promise<MaliceMethodTreeItem[]> {
    const items: MaliceMethodTreeItem[] = [];

    Object.entries(obj.methods || {}).forEach(([methodName, methodData]: [string, any]) => {
      const complexity = this.calculateComplexity(methodData.code || '');
      
      items.push(new MaliceMethodTreeItem(
        objectId,
        methodName,
        'method',
        undefined,
        {
          description: methodData.help,
          signature: 'unknown args',
          complexity
        }
      ));
    });

    // Sort by complexity (descending)
    return items.sort((a, b) => (b.metadata?.complexity || 0) - (a.metadata?.complexity || 0));
  }

  /**
   * Categorize a method (simplified version for tree view)
   */
  private categorizeMethod(methodName: string, methodCode: string): string {
    const patterns: Record<string, RegExp[]> = {
      lifecycle: [/^(connect|disconnect|init|destroy|onCreate|onDestroy|onConnect|onDisconnect)/],
      events: [/^(on|handle)[A-Z]/, /^.*(?:Event|Hook|Callback)$/],
      public: [/^(get|set|is|has|can|do|show|display|list)[a-z]/, /^(look|examine|describe)/],
      combat: [/^(attack|defend|damage|heal|fight|strike|hit)/],
      communication: [/^(say|tell|whisper|shout|announce|broadcast)/],
      movement: [/^(move|go|walk|run|teleport|transport)/],
      inventory: [/^(inventory|items|equipment|gear)/, /^(take|drop|give|equip|unequip|wield)/],
      internal: [/^_/, /^(validate|check|verify|test|debug)/]
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
  private getCategoryInfo(category: string): { name: string; description: string } {
    const info: Record<string, { name: string; description: string }> = {
      lifecycle: { name: '🔧 Lifecycle', description: 'Object lifecycle and initialization methods' },
      events: { name: '📡 Events', description: 'Event handlers and callbacks' },
      public: { name: '🔍 Public API', description: 'User-facing methods and commands' },
      combat: { name: '⚔️ Combat', description: 'Combat and battle-related methods' },
      communication: { name: '💬 Communication', description: 'Chat, messaging and communication' },
      movement: { name: '🚶 Movement', description: 'Movement and navigation methods' },
      inventory: { name: '🎒 Inventory', description: 'Item and inventory management' },
      internal: { name: '🔧 Internal', description: 'Internal utilities and helpers' }
    };

    return info[category] || { name: `📁 ${category}`, description: category };
  }

  /**
   * Calculate method complexity (simple approximation)
   */
  private calculateComplexity(code: string): number {
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
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
  onDidExpandElement(element: vscode.TreeItem): void {
    if (element instanceof MaliceObjectTreeItem) {
      this.expandedObjects.add(element.objectId);
    }
  }

  /**
   * Track collapsed state
   */
  onDidCollapseElement(element: vscode.TreeItem): void {
    if (element instanceof MaliceObjectTreeItem) {
      this.expandedObjects.delete(element.objectId);
    }
  }
}

/**
 * Tree item representing a Malice object (reusing original)
 */
export class MaliceObjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly objectId: number,
    public readonly parentId: number | null,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly properties: string[],
    public readonly methods: string[]
  ) {
    super(label, collapsibleState);

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