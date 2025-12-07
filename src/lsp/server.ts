/**
 * Malice LSP Server
 * Implements Language Server Protocol for MOO objects
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  MarkupKind,
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import type { ObjectManager } from '../database/object-manager.js';
import { VirtualFileSystem } from './virtual-fs.js';
import { TypeScriptService } from './ts-service.js';
import * as ts from 'typescript';

/**
 * Malice LSP Server
 */
export class MaliceLSPServer {
  private connection = createConnection(ProposedFeatures.all);
  private documents = new TextDocuments(TextDocument);
  private vfs: VirtualFileSystem;
  private tsService: TypeScriptService;

  constructor(manager: ObjectManager) {
    this.vfs = new VirtualFileSystem(manager);
    this.tsService = new TypeScriptService(this.vfs);

    this.setupHandlers();
  }

  /**
   * Setup LSP protocol handlers
   */
  private setupHandlers(): void {
    // Initialize
    this.connection.onInitialize(this.onInitialize.bind(this));

    // Text document sync
    this.documents.listen(this.connection);

    // Completions
    this.connection.onCompletion(this.onCompletion.bind(this));

    // Hover
    this.connection.onHover(this.onHover.bind(this));

    // Diagnostics (on document change)
    this.documents.onDidChangeContent(this.onDocumentChange.bind(this));

    // Go to definition
    this.connection.onDefinition(this.onDefinition.bind(this));

    // Find references
    this.connection.onReferences(this.onReferences.bind(this));
  }

  /**
   * Handle initialization
   */
  private onInitialize(_params: InitializeParams): InitializeResult {
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: ['.', '$'],
        },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
      },
    };
  }

  /**
   * Handle completion requests
   */
  private async onCompletion(params: TextDocumentPositionParams): Promise<CompletionItem[]> {
    const uri = params.textDocument.uri;
    const { line, character } = params.position;

    const completions = await this.tsService.getCompletions(uri, line, character);
    if (!completions) return [];

    return completions.entries.map((entry) => ({
      label: entry.name,
      kind: this.convertCompletionKind(entry.kind) as CompletionItem['kind'],
      detail: entry.kind,
      documentation: entry.kindModifiers,
    }));
  }

  /**
   * Handle hover requests
   */
  private async onHover(params: TextDocumentPositionParams): Promise<Hover | null> {
    const uri = params.textDocument.uri;
    const { line, character } = params.position;

    const info = await this.tsService.getHover(uri, line, character);
    if (!info) return null;

    const displayString = ts.displayPartsToString(info.displayParts);
    const documentation = ts.displayPartsToString(info.documentation || []);

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: ['```typescript', displayString, '```', documentation].filter(Boolean).join('\n'),
      },
    };
  }

  /**
   * Handle document change (send diagnostics)
   */
  private async onDocumentChange(change: { document: TextDocument }): Promise<void> {
    const uri = change.document.uri;

    const diagnostics = await this.tsService.getDiagnostics(uri);
    const lspDiagnostics: Diagnostic[] = diagnostics.map((diag) => ({
      severity: this.convertDiagnosticSeverity(diag.category),
      range: {
        start: change.document.positionAt(diag.start || 0),
        end: change.document.positionAt((diag.start || 0) + (diag.length || 0)),
      },
      message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
      source: 'malice-ts',
    }));

    this.connection.sendDiagnostics({ uri, diagnostics: lspDiagnostics });
  }

  /**
   * Handle go-to-definition
   */
  private async onDefinition(params: TextDocumentPositionParams) {
    const uri = params.textDocument.uri;
    const { line, character } = params.position;

    const definitions = await this.tsService.getDefinition(uri, line, character);
    if (!definitions || definitions.length === 0) return null;

    return definitions.map((def) => ({
      uri: def.fileName,
      range: {
        start: { line: 0, character: 0 }, // TODO: Convert textSpan to range
        end: { line: 0, character: 0 },
      },
    }));
  }

  /**
   * Handle find-references
   */
  private async onReferences(params: TextDocumentPositionParams) {
    const uri = params.textDocument.uri;
    const { line, character } = params.position;

    const references = await this.tsService.getReferences(uri, line, character);
    if (!references) return [];

    return references.map((ref) => ({
      uri: ref.fileName,
      range: {
        start: { line: 0, character: 0 }, // TODO: Convert textSpan to range
        end: { line: 0, character: 0 },
      },
    }));
  }

  /**
   * Convert TypeScript completion kind to LSP kind
   */
  private convertCompletionKind(kind: ts.ScriptElementKind): number {
    switch (kind) {
      case ts.ScriptElementKind.classElement:
      case ts.ScriptElementKind.memberFunctionElement:
        return 2; // Method
      case ts.ScriptElementKind.memberVariableElement:
        return 10; // Property
      case ts.ScriptElementKind.functionElement:
        return 3; // Function
      case ts.ScriptElementKind.variableElement:
      case ts.ScriptElementKind.letElement:
      case ts.ScriptElementKind.constElement:
        return 6; // Variable
      default:
        return 1; // Text
    }
  }

  /**
   * Convert TypeScript diagnostic severity to LSP
   */
  private convertDiagnosticSeverity(category: ts.DiagnosticCategory): DiagnosticSeverity {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return DiagnosticSeverity.Error;
      case ts.DiagnosticCategory.Warning:
        return DiagnosticSeverity.Warning;
      case ts.DiagnosticCategory.Suggestion:
        return DiagnosticSeverity.Hint;
      default:
        return DiagnosticSeverity.Information;
    }
  }

  /**
   * Start the LSP server
   */
  start(): void {
    this.connection.listen();
    console.log('🚀 Malice LSP Server started');
  }
}
