import { EventEmitter } from 'node:events';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Connection } from '../src/connection/connection.js';
import { ConnectionContext } from '../src/game/connection-context.js';
import { MultiplexedTransport } from '../src/transport/multiplexed/multiplexed-transport.js';
import type { ObjId, RuntimeObject } from '../types/object.js';
import type { ITransport, TerminalCapabilities } from '../types/transport.js';

// Mock transport for testing
class MockTransport implements ITransport {
  id: string;
  type: 'telnet' | 'websocket';
  remoteAddress: string;
  capabilities$: BehaviorSubject<TerminalCapabilities>;
  input$: Subject<string>;
  output$: Subject<string>;
  connected$: BehaviorSubject<boolean>;
  error$: Subject<Error>;
  closed$: Subject<void>;

  get capabilities(): TerminalCapabilities {
    return this.capabilities$.value;
  }

  constructor(id: string, type: 'telnet' | 'websocket' = 'telnet') {
    this.id = id;
    this.type = type;
    this.remoteAddress = `mock-${id}`;
    this.capabilities$ = new BehaviorSubject<TerminalCapabilities>({
      ansi: true,
      width: 80,
      height: 24,
      terminalType: 'ansi',
      env: {},
    });
    this.input$ = new Subject<string>();
    this.output$ = new Subject<string>();
    this.connected$ = new BehaviorSubject<boolean>(true);
    this.error$ = new Subject<Error>();
    this.closed$ = new Subject<void>();
  }

  close(): void {
    this.connected$.next(false);
    this.closed$.next();
    this.closed$.complete();
  }

  destroy(): void {
    this.close();
  }
}

// Mock RuntimeObject
class MockRuntimeObject implements RuntimeObject {
  id: ObjId;
  private callHandler?: (
    method: string,
    ...args: unknown[]
  ) => Promise<unknown>;

  constructor(id: ObjId) {
    this.id = id;
  }

  setCallHandler(
    handler: (method: string, ...args: unknown[]) => Promise<unknown>,
  ) {
    this.callHandler = handler;
  }

  get(_prop: string): any {
    return undefined;
  }

  set(_prop: string, _value: any): void {}

  setMethod(_name: string, _code: string, _options?: any): void {}

  async call(method: string, ...args: unknown[]): Promise<unknown> {
    if (this.callHandler) {
      return this.callHandler(method, ...args);
    }
    return undefined;
  }

  hasMethod(_method: string): boolean {
    return true;
  }

  getParent(): ObjId {
    return 0;
  }

  async setParent(_parent: ObjId): Promise<void> {}

  getOwnProperties(): Record<string, any> {
    return {};
  }

  getOwnMethods(): Record<string, any> {
    return {};
  }

  async save(): Promise<void> {}
}

// Mock ObjectManager
class MockObjectManager {
  private objects = new Map<ObjId, RuntimeObject>();

  async load(id: ObjId): Promise<RuntimeObject | null> {
    return this.objects.get(id) || null;
  }

  addObject(obj: RuntimeObject): void {
    this.objects.set(obj.id, obj);
  }
}

describe('ConnectionContext - Subscription Cleanup (PR #107 Bug Fix)', () => {
  let transport: MockTransport;
  let connection: Connection;
  let manager: MockObjectManager;
  let context: ConnectionContext;

  beforeEach(() => {
    transport = new MockTransport('test-cleanup');
    connection = new Connection(transport);
    manager = new MockObjectManager() as any;
    context = new ConnectionContext(connection, manager as any);
  });

  describe('input$ subscription cleanup', () => {
    it('should stop processing input after transport closes', async () => {
      const handler = new MockRuntimeObject(1);
      const callCount = { count: 0 };

      handler.setCallHandler(async () => {
        callCount.count++;
      });

      context.setHandler(handler);

      // Send input before close
      transport.input$.next('before close');
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callCount.count).toBe(1);

      // Close the transport
      transport.close();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Send input after close - should NOT be processed
      transport.input$.next('after close');
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Count should still be 1 (subscription cleaned up)
      expect(callCount.count).toBe(1);
    });

    it('should not leak subscriptions after multiple connections', async () => {
      const handler = new MockRuntimeObject(1);
      const callCount = { count: 0 };

      handler.setCallHandler(async () => {
        callCount.count++;
      });

      // Create multiple connections and close them
      for (let i = 0; i < 5; i++) {
        const t = new MockTransport(`leak-test-${i}`);
        const c = new Connection(t);
        const ctx = new ConnectionContext(c, manager as any);
        ctx.setHandler(handler);

        // Send input
        t.input$.next(`message ${i}`);
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Close transport
        t.close();
      }

      // Should have exactly 5 calls (one per connection)
      expect(callCount.count).toBe(5);
    });
  });

  describe('wm$ subscription cleanup (MultiplexedTransport)', () => {
    it('should stop processing wm messages after transport closes', async () => {
      // Create mock WebSocket
      const mockWs = new EventEmitter() as any;
      mockWs.readyState = 1; // OPEN
      mockWs.send = vi.fn();
      mockWs.close = vi.fn();
      mockWs.terminate = vi.fn();

      // Create multiplexed transport
      const muxTransport = new MultiplexedTransport(mockWs, 'test-wm-cleanup');
      const muxConnection = new Connection(muxTransport);
      const muxContext = new ConnectionContext(muxConnection, manager as any);

      // Create handler with onWmMessage method
      const handler = new MockRuntimeObject(1);
      const wmCallCount = { count: 0 };

      handler.setCallHandler(async (method) => {
        if (method === 'onWmMessage') {
          wmCallCount.count++;
        }
      });

      muxContext.setHandler(handler);

      // Send wm message before close
      (muxTransport as any).wmSubject.next({ type: 'before' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(wmCallCount.count).toBe(1);

      // Close the transport by emitting WebSocket close event
      mockWs.emit('close');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Send wm message after close - should NOT be processed
      (muxTransport as any).wmSubject.next({ type: 'after' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Count should still be 1 (subscription cleaned up)
      expect(wmCallCount.count).toBe(1);
    });

    it('should not leak wm subscriptions after multiple multiplexed connections', async () => {
      const handler = new MockRuntimeObject(1);
      const wmCallCount = { count: 0 };

      handler.setCallHandler(async (method) => {
        if (method === 'onWmMessage') {
          wmCallCount.count++;
        }
      });

      // Create multiple multiplexed connections and close them
      for (let i = 0; i < 5; i++) {
        const mockWs = new EventEmitter() as any;
        mockWs.readyState = 1;
        mockWs.send = vi.fn();
        mockWs.close = vi.fn();
        mockWs.terminate = vi.fn();

        const muxTransport = new MultiplexedTransport(
          mockWs,
          `wm-leak-test-${i}`,
        );
        const muxConnection = new Connection(muxTransport);
        const muxContext = new ConnectionContext(muxConnection, manager as any);
        muxContext.setHandler(handler);

        // Send wm message
        (muxTransport as any).wmSubject.next({ type: `message-${i}` });
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Close transport by emitting WebSocket close event
        mockWs.emit('close');
      }

      // Should have exactly 5 calls (one per connection)
      expect(wmCallCount.count).toBe(5);
    });
  });

  describe('combined subscription cleanup', () => {
    it('should clean up both input$ and wm$ subscriptions on close', async () => {
      const mockWs = new EventEmitter() as any;
      mockWs.readyState = 1;
      mockWs.send = vi.fn();
      mockWs.close = vi.fn();
      mockWs.terminate = vi.fn();

      const muxTransport = new MultiplexedTransport(mockWs, 'test-combined');
      const muxConnection = new Connection(muxTransport);
      const muxContext = new ConnectionContext(muxConnection, manager as any);

      const handler = new MockRuntimeObject(1);
      const callCounts = { input: 0, wm: 0 };

      handler.setCallHandler(async (method) => {
        if (method === 'onInput') callCounts.input++;
        if (method === 'onWmMessage') callCounts.wm++;
      });

      muxContext.setHandler(handler);

      // Send input and wm messages before close
      (muxTransport as any).inputSubject.next('input-before');
      (muxTransport as any).wmSubject.next({ type: 'wm-before' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callCounts.input).toBe(1);
      expect(callCounts.wm).toBe(1);

      // Close transport by emitting WebSocket close event
      mockWs.emit('close');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Send input and wm messages after close
      (muxTransport as any).inputSubject.next('input-after');
      (muxTransport as any).wmSubject.next({ type: 'wm-after' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Counts should still be 1 each (both subscriptions cleaned up)
      expect(callCounts.input).toBe(1);
      expect(callCounts.wm).toBe(1);
    });
  });
});
