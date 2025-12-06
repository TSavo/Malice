/**
 * TypeDefinitionManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock VS Code API - must be defined before imports
vi.mock('vscode', () => {
  const mockWorkspaceFs = {
    createDirectory: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    stat: vi.fn(),
  };

  const mockWorkspace = {
    fs: mockWorkspaceFs,
    workspaceFolders: [
      {
        uri: {
          fsPath: '/test/workspace',
          path: '/test/workspace',
        },
      },
    ],
  };

  const mockUri = {
    joinPath: (base: any, ...parts: string[]) => ({
      fsPath: `${base.fsPath}/${parts.join('/')}`,
      path: `${base.path}/${parts.join('/')}`,
    }),
  };

  return {
    workspace: mockWorkspace,
    Uri: mockUri,
    EventEmitter: class {
      event = vi.fn();
      fire = vi.fn();
    },
    Disposable: class {
      constructor(fn: any) {}
    },
    window: {
      showErrorMessage: vi.fn(),
    },
  };
});

import { TypeDefinitionManager } from '../src/type-manager';
import * as vscode from 'vscode';

const mockWorkspaceFs = (vscode.workspace as any).fs;

describe('TypeDefinitionManager', () => {
  let manager: TypeDefinitionManager;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock DevTools client
    mockClient = {
      request: vi.fn(),
      onNotification: vi.fn(() => ({ dispose: vi.fn() })),
    };

    manager = new TypeDefinitionManager(mockClient);
  });

  afterEach(() => {
    if (manager) {
      manager.dispose();
    }
  });

  describe('initialize', () => {
    it('should create .malice directory', async () => {
      mockClient.request.mockResolvedValue({
        definitions: '// test types',
      });

      await manager.initialize({} as any);

      expect(mockWorkspaceFs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: '/test/workspace/.malice',
        })
      );
    });

    it('should generate initial types', async () => {
      const testDefinitions = '// Auto-generated types\ninterface Test {}';
      mockClient.request.mockResolvedValue({
        definitions: testDefinitions,
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      expect(mockClient.request).toHaveBeenCalledWith('types.generate', {});
      expect(mockWorkspaceFs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: '/test/workspace/.malice/malice.d.ts',
        }),
        expect.any(Buffer)
      );
    });

    it('should create jsconfig.json if it does not exist', async () => {
      mockClient.request.mockResolvedValue({
        definitions: '// test',
      });

      // Simulate tsconfig not existing
      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));
      // Simulate jsconfig not existing
      mockWorkspaceFs.readFile.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      expect(mockWorkspaceFs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: '/test/workspace/jsconfig.json',
        }),
        expect.any(Buffer)
      );

      // Verify jsconfig content
      const writeCall = mockWorkspaceFs.writeFile.mock.calls.find((call: any) =>
        call[0].fsPath.endsWith('jsconfig.json')
      );
      expect(writeCall).toBeDefined();

      const config = JSON.parse(Buffer.from(writeCall[1]).toString('utf-8'));
      expect(config.include).toContain('.malice/**/*');
    });

    it('should not modify existing tsconfig.json', async () => {
      mockClient.request.mockResolvedValue({
        definitions: '// test',
      });

      // Simulate tsconfig existing
      mockWorkspaceFs.stat.mockResolvedValue({ type: 1 });

      await manager.initialize({} as any);

      // Should not try to write jsconfig.json
      const jsconfigWrite = mockWorkspaceFs.writeFile.mock.calls.find((call: any) =>
        call[0].fsPath.endsWith('jsconfig.json')
      );
      expect(jsconfigWrite).toBeUndefined();
    });

    it('should register notification handlers', async () => {
      mockClient.request.mockResolvedValue({
        definitions: '// test',
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      expect(mockClient.onNotification).toHaveBeenCalled();
    });
  });

  describe('regenerateTypes', () => {
    it('should request types from DevTools server', async () => {
      const testDefinitions = 'interface MaliceObject_5 { name: string; }';
      mockClient.request.mockResolvedValue({
        definitions: testDefinitions,
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      // Check that types.generate was called
      expect(mockClient.request).toHaveBeenCalledWith('types.generate', {});
    });

    it('should write definitions to malice.d.ts', async () => {
      const testDefinitions = '// Generated types\ninterface RuntimeObject {}';
      mockClient.request.mockResolvedValue({
        definitions: testDefinitions,
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      const writeCall = mockWorkspaceFs.writeFile.mock.calls.find((call: any) =>
        call[0].fsPath.endsWith('malice.d.ts')
      );
      expect(writeCall).toBeDefined();

      const content = Buffer.from(writeCall[1]).toString('utf-8');
      expect(content).toBe(testDefinitions);
    });
  });

  describe('generateTypesForObject', () => {
    it('should request object-specific types', async () => {
      const objectId = 42;
      const testDefinitions = 'declare const self: RuntimeObject & MaliceObject_42;';

      mockClient.request.mockResolvedValue({
        definitions: testDefinitions,
      });

      const result = await manager.generateTypesForObject(objectId);

      expect(mockClient.request).toHaveBeenCalledWith('types.generate', {
        objectId: 42,
      });
      expect(result).toBe(testDefinitions);
    });

    it('should return null on error', async () => {
      mockClient.request.mockRejectedValue(new Error('Server error'));

      const result = await manager.generateTypesForObject(99);

      expect(result).toBeNull();
    });
  });

  describe('real-time updates', () => {
    it('should regenerate types on object changes', async () => {
      let notificationHandler: any;

      mockClient.onNotification.mockImplementation((handler: any) => {
        notificationHandler = handler;
        return { dispose: vi.fn() };
      });

      mockClient.request.mockResolvedValue({
        definitions: '// test',
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      // Clear previous calls
      mockClient.request.mockClear();
      mockWorkspaceFs.writeFile.mockClear();

      // Simulate change notification
      mockClient.request.mockResolvedValue({
        definitions: '// updated types',
      });

      notificationHandler('object.created', { id: 10 });

      // Wait for debounce (500ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should have regenerated types
      expect(mockClient.request).toHaveBeenCalledWith('types.generate', {});
    });

    it('should debounce multiple rapid changes', async () => {
      let notificationHandler: any;

      mockClient.onNotification.mockImplementation((handler: any) => {
        notificationHandler = handler;
        return { dispose: vi.fn() };
      });

      mockClient.request.mockResolvedValue({
        definitions: '// test',
      });

      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      await manager.initialize({} as any);

      mockClient.request.mockClear();

      // Fire multiple notifications rapidly
      notificationHandler('method.changed', { objectId: 5, name: 'test' });
      notificationHandler('property.changed', { objectId: 5, name: 'name' });
      notificationHandler('method.changed', { objectId: 5, name: 'test2' });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should only regenerate once (debounced)
      expect(mockClient.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', async () => {
      const disposeSpy = vi.fn();
      mockClient.onNotification.mockReturnValue({ dispose: disposeSpy });
      mockClient.request.mockResolvedValue({ definitions: '// test' });
      mockWorkspaceFs.stat.mockRejectedValue(new Error('Not found'));

      // Initialize to create disposables
      await manager.initialize({} as any);

      // Now dispose
      manager.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});
