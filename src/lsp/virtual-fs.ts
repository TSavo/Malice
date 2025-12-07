/**
 * Virtual File System for LSP
 * Maps MongoDB objects to TypeScript virtual files
 */

import type { ObjId } from '../../types/object.js';
import type { ObjectManager } from '../database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

/**
 * Virtual document representing an object's method
 */
export interface VirtualDocument {
  uri: string; // malice://objects/5/connect.ts
  objectId: ObjId;
  methodName: string;
  content: string; // Full TypeScript with context
  version: number;
}

/**
 * Virtual directory entry (object or method file)
 */
export interface VirtualEntry {
  name: string;
  type: 'directory' | 'file';
  uri: string;
}

/**
 * Virtual File System
 * Provides TypeScript context for MOO objects
 */
export class VirtualFileSystem {
  private documents = new Map<string, VirtualDocument>();

  constructor(private manager: ObjectManager) {}

  /**
   * Parse URI into object ID, name, and type
   * Format: malice://objects/{id}/{name}.{ts|json}
   */
  parseUri(uri: string): { objectId: ObjId; name: string; type: 'method' | 'property' } | null {
    const tsMatch = uri.match(/^malice:\/\/objects\/(\d+)\/(.+)\.ts$/);
    if (tsMatch) {
      return {
        objectId: parseInt(tsMatch[1]),
        name: tsMatch[2],
        type: 'method',
      };
    }

    const jsonMatch = uri.match(/^malice:\/\/objects\/(\d+)\/(.+)\.json$/);
    if (jsonMatch) {
      return {
        objectId: parseInt(jsonMatch[1]),
        name: jsonMatch[2],
        type: 'property',
      };
    }

    return null;
  }

  /**
   * Build URI from object ID and method name
   */
  buildUri(objectId: ObjId, methodName: string): string {
    return `malice://objects/${objectId}/${methodName}.ts`;
  }

  /**
   * List directory contents
   * malice://objects/ -> list all objects
   * malice://objects/{id}/ -> list all methods
   */
  async listDirectory(uri: string): Promise<VirtualEntry[]> {
    // Root: list objects
    if (uri === 'malice://objects/' || uri === 'malice://objects') {
      return await this.listObjects();
    }

    // Object directory: list methods
    const objMatch = uri.match(/^malice:\/\/objects\/(\d+)\/?$/);
    if (objMatch) {
      const objectId = parseInt(objMatch[1]);
      return await this.listMethodFiles(objectId);
    }

    return [];
  }

  /**
   * List all objects as directories
   */
  private async listObjects(): Promise<VirtualEntry[]> {
    const objects = await this.manager.db.listAll();
    return objects.map((obj) => ({
      name: `${obj._id}`,
      type: 'directory' as const,
      uri: `malice://objects/${obj._id}/`,
    }));
  }

  /**
   * List methods as .ts files and properties as .json files
   */
  private async listMethodFiles(objectId: ObjId): Promise<VirtualEntry[]> {
    const obj = await this.manager.load(objectId);
    if (!obj) return [];

    const raw = obj['_getRaw']();
    const entries: VirtualEntry[] = [];

    // Add methods as .ts files
    Object.keys(raw.methods).forEach((methodName) => {
      entries.push({
        name: `${methodName}.ts`,
        type: 'file' as const,
        uri: `malice://objects/${objectId}/${methodName}.ts`,
      });
    });

    // Add properties as .json files
    Object.keys(raw.properties).forEach((propName) => {
      entries.push({
        name: `${propName}.json`,
        type: 'file' as const,
        uri: `malice://objects/${objectId}/${propName}.json`,
      });
    });

    return entries;
  }

  /**
   * Get virtual document for a method or property
   */
  async getDocument(uri: string): Promise<VirtualDocument | null> {
    // Check cache
    if (this.documents.has(uri)) {
      return this.documents.get(uri)!;
    }

    // Parse URI
    const parsed = this.parseUri(uri);
    if (!parsed) return null;

    // Load object
    const obj = await this.manager.load(parsed.objectId);
    if (!obj) return null;

    const raw = obj['_getRaw']();
    let content: string;

    if (parsed.type === 'method') {
      // Get method code
      const method = raw.methods[parsed.name];
      if (!method) return null;

      // Determine prototype type for 'self'
      const prototypeType = await this.inferPrototypeType(obj);

      // Build TypeScript context
      content = this.buildTypeScriptContext(
        parsed.name,
        method.code,
        prototypeType
      );
    } else {
      // Get property value as JSON (use resolved value, not typed Value)
      const propValue = obj.get(parsed.name);
      if (propValue === undefined) return null;

      content = JSON.stringify(propValue, null, 2);
    }

    // Create document
    const doc: VirtualDocument = {
      uri,
      objectId: parsed.objectId,
      methodName: parsed.name, // Use 'name' for both methods and properties
      content,
      version: 1,
    };

    this.documents.set(uri, doc);
    return doc;
  }

  /**
   * Update a document (when method is edited)
   */
  async updateDocument(uri: string, newCode: string): Promise<void> {
    const parsed = this.parseUri(uri);
    if (!parsed) return;

    const obj = await this.manager.load(parsed.objectId);
    if (!obj) return;

    // Extract actual code from TypeScript context (if present)
    const actualCode = this.extractMethodCode(newCode);

    // Update method in MongoDB
    obj.setMethod(parsed.name, actualCode);

    // Update cache
    const prototypeType = await this.inferPrototypeType(obj);
    const content = this.buildTypeScriptContext(
      parsed.name,
      actualCode,
      prototypeType
    );

    const doc = this.documents.get(uri);
    if (doc) {
      doc.content = content;
      doc.version++;
    }
  }

  /**
   * Extract method code from TypeScript context
   * If the code contains our generated context, extract just the actual method code
   * Otherwise, return the code as-is
   */
  private extractMethodCode(fullCode: string): string {
    const marker = '// Method code:';
    const markerIndex = fullCode.indexOf(marker);

    if (markerIndex === -1) {
      // No context wrapper, return as-is
      return fullCode;
    }

    // Extract everything after the marker
    const codeAfterMarker = fullCode.substring(markerIndex + marker.length);

    // Trim leading newline but preserve other whitespace
    return codeAfterMarker.replace(/^\n/, '');
  }

  /**
   * Invalidate cached document
   */
  invalidate(uri: string): void {
    this.documents.delete(uri);
  }

  /**
   * Infer the prototype type of an object
   * Walks parent chain to find closest named prototype
   */
  private async inferPrototypeType(obj: RuntimeObject): Promise<string> {
    // Check common aliases
    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};

    // Map known prototype IDs to type names
    const prototypeMap: Record<number, string> = {
      [aliases.player]: 'Player',
      [aliases.human]: 'Human',
      [aliases.agent]: 'Agent',
      [aliases.room]: 'Room',
      [aliases.location]: 'Location',
      [aliases.describable]: 'Describable',
    };

    // Walk parent chain
    let current: RuntimeObject | null = obj;
    while (current) {
      if (prototypeMap[current.id]) {
        return prototypeMap[current.id];
      }

      const parentId = current.getParent();
      if (parentId === 0) break;
      current = await this.manager.load(parentId);
    }

    return 'RuntimeObject'; // Fallback
  }

  /**
   * Build TypeScript context for a method
   */
  private buildTypeScriptContext(
    methodName: string,
    code: string,
    prototypeType: string
  ): string {
    return `// Malice MOO Method: ${methodName}
// Auto-generated TypeScript context

import type { ${prototypeType} } from '@malice/types/prototypes';
import type { ObjectManager } from '@malice/database/object-manager';
import type { ConnectionContext } from '@malice/game/connection-context';

// Method execution context
declare const self: ${prototypeType};
declare const $: ObjectManager;
declare const args: unknown[];

// Method code:
${code}
`;
  }

  /**
   * List all methods for an object
   */
  async listMethods(objectId: ObjId): Promise<string[]> {
    const obj = await this.manager.load(objectId);
    if (!obj) return [];

    const methods = obj['_getRaw']().methods;
    return Object.keys(methods);
  }
}
