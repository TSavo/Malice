/**
 * Tree View Provider for Malice Objects
 * Shows object hierarchy in VS Code sidebar
 */

import * as vscode from 'vscode';
import type { DevToolsClient } from './devtools-client.js';

/**
 * Tree item representing a Malice object
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

/**
 * Tree item representing a method or property
 */
export class MaliceMethodTreeItem extends vscode.TreeItem {
  constructor(
    public readonly objectId: number,
    public readonly name: string,
    public readonly type: 'method' | 'property'
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${type}: ${name}`;
    this.contextValue = type === 'method' ? 'maliceMethod' : 'maliceProperty';

    // Icon
    this.iconPath = new vscode.ThemeIcon(
      type === 'method' ? 'symbol-method' : 'symbol-property'
    );

    // Command to open method/property
    this.command = {
      command: type === 'method' ? 'malice.openMethod' : 'malice.openProperty',
      title: type === 'method' ? 'Open Method' : 'Open Property',
      arguments: [objectId, name],
    };
  }
}

/**
 * Tree data provider for Malice objects
 */
export class MaliceTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private objects: Map<number, any> = new Map();
  private expandedObjects = new Set<number>();

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
   * Refresh the tree view
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
      return this.getRootObjects();
    }

    if (element instanceof MaliceObjectTreeItem) {
      // Object expanded - show methods and properties
      const children: vscode.TreeItem[] = [];

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
  private async getRootObjects(): Promise<MaliceObjectTreeItem[]> {
    try {
      const objects = await this.client.listObjects(false);

      // Cache objects
      this.objects.clear();
      for (const obj of objects) {
        this.objects.set(obj.id, obj);
      }

      // Convert to tree items
      const items = objects.map((obj: any) => {
        const collapsible = this.expandedObjects.has(obj.id)
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;

        return new MaliceObjectTreeItem(
          obj.id,
          obj.parent,
          `Object #${obj.id}`,
          collapsible,
          obj.properties || [],
          obj.methods || []
        );
      });

      // Sort by ID
      items.sort((a, b) => a.objectId - b.objectId);

      return items;
    } catch (err) {
      console.error('[TreeView] Failed to load objects:', err);
      vscode.window.showErrorMessage(`Failed to load objects: ${err}`);
      return [];
    }
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
