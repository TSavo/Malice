/**
 * LSP Module Entry Point
 * Exports all LSP components for easy integration
 */

export { VirtualFileSystem } from './virtual-fs.js';
export { TypeScriptService } from './ts-service.js';
export { MaliceLSPServer } from './server.js';
export { LSPApiServer } from './api-server.js';

export type { VirtualDocument, VirtualEntry } from './virtual-fs.js';
