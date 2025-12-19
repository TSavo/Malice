/**
 * Call Graph Builder
 * Constructs and manages method call relationship graphs
 *
 * NOTE: This is a stub implementation - not currently used
 */

import type { ObjId } from '../../types/object.js';

/**
 * Call graph node
 */
export interface CallGraphNode {
  objectId: ObjId;
  methodName: string;
  calls: Set<string>;
  calledBy: Set<string>;
  frequency: number;
  complexity: number;
  lastAnalyzed: number;
}

/**
 * Call graph edge between methods
 */
export interface CallGraphEdge {
  source: { objectId: ObjId; methodName: string };
  target: { objectId?: ObjId; methodName: string };
  targetExpression?: string;
  lineNumber: number;
  context: string;
}

/**
 * Call graph builder - stub implementation
 */
export class CallGraphBuilder {
  /**
   * Build complete call graph for all methods
   */
  async buildCallGraph(): Promise<void> {
    // No-op stub
  }

  /**
   * Get a node from the graph
   */
  getNode(_objectId: ObjId, _methodName: string): CallGraphNode | undefined {
    return undefined;
  }

  /**
   * Get all edges
   */
  getEdges(): CallGraphEdge[] {
    return [];
  }

  /**
   * Get statistics
   */
  getStats(): { nodeCount: number; edgeCount: number; avgComplexity: number } {
    return { nodeCount: 0, edgeCount: 0, avgComplexity: 0 };
  }
}
