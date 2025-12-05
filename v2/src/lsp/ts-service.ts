/**
 * TypeScript Language Service wrapper
 * Provides type checking, autocomplete, and other LSP features
 */

import * as ts from 'typescript';
import type { VirtualFileSystem, VirtualDocument } from './virtual-fs.js';

/**
 * TypeScript Language Service for Malice
 */
export class TypeScriptService {
  private languageService: ts.LanguageService;
  private files = new Map<string, string>();
  private versions = new Map<string, number>();

  constructor(private vfs: VirtualFileSystem) {
    // Create language service host
    const serviceHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => Array.from(this.files.keys()),
      getScriptVersion: (fileName) => String(this.versions.get(fileName) || 0),
      getScriptSnapshot: (fileName) => {
        const content = this.files.get(fileName);
        if (!content) return undefined;
        return ts.ScriptSnapshot.fromString(content);
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        lib: ['lib.es2022.d.ts'],
        types: [],
      }),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: (path) => this.files.has(path),
      readFile: (path) => this.files.get(path),
    };

    this.languageService = ts.createLanguageService(serviceHost, ts.createDocumentRegistry());
  }

  /**
   * Update a document in the language service
   */
  async updateDocument(uri: string): Promise<void> {
    const doc = await this.vfs.getDocument(uri);
    if (!doc) return;

    this.files.set(uri, doc.content);
    this.versions.set(uri, doc.version);
  }

  /**
   * Get completions at a position
   */
  async getCompletions(uri: string, line: number, character: number): Promise<ts.CompletionInfo | undefined> {
    await this.updateDocument(uri);

    const doc = await this.vfs.getDocument(uri);
    if (!doc) return undefined;

    const offset = this.getOffset(doc.content, line, character);
    return this.languageService.getCompletionsAtPosition(uri, offset, undefined);
  }

  /**
   * Get hover information
   */
  async getHover(uri: string, line: number, character: number): Promise<ts.QuickInfo | undefined> {
    await this.updateDocument(uri);

    const doc = await this.vfs.getDocument(uri);
    if (!doc) return undefined;

    const offset = this.getOffset(doc.content, line, character);
    return this.languageService.getQuickInfoAtPosition(uri, offset);
  }

  /**
   * Get diagnostics (errors/warnings)
   */
  async getDiagnostics(uri: string): Promise<ts.Diagnostic[]> {
    await this.updateDocument(uri);

    const syntactic = this.languageService.getSyntacticDiagnostics(uri);
    const semantic = this.languageService.getSemanticDiagnostics(uri);
    return [...syntactic, ...semantic];
  }

  /**
   * Get definition location
   */
  async getDefinition(uri: string, line: number, character: number): Promise<ts.DefinitionInfo[] | undefined> {
    await this.updateDocument(uri);

    const doc = await this.vfs.getDocument(uri);
    if (!doc) return undefined;

    const offset = this.getOffset(doc.content, line, character);
    return this.languageService.getDefinitionAtPosition(uri, offset);
  }

  /**
   * Get references
   */
  async getReferences(uri: string, line: number, character: number): Promise<ts.ReferenceEntry[] | undefined> {
    await this.updateDocument(uri);

    const doc = await this.vfs.getDocument(uri);
    if (!doc) return undefined;

    const offset = this.getOffset(doc.content, line, character);
    return this.languageService.getReferencesAtPosition(uri, offset);
  }

  /**
   * Convert line/character to offset
   */
  private getOffset(content: string, line: number, character: number): number {
    const lines = content.split('\n');
    let offset = 0;

    for (let i = 0; i < line && i < lines.length; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }

    offset += character;
    return offset;
  }

  /**
   * Convert offset to line/character
   */
  private getLineAndCharacter(content: string, offset: number): { line: number; character: number } {
    const lines = content.split('\n');
    let currentOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length + 1; // +1 for newline
      if (currentOffset + lineLength > offset) {
        return {
          line,
          character: offset - currentOffset,
        };
      }
      currentOffset += lineLength;
    }

    return { line: lines.length - 1, character: lines[lines.length - 1].length };
  }
}
