import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, BehaviorSubject } from 'rxjs';
import { ConnectionManager } from '../src/connection/connection-manager.js';
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

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  describe('adding connections', () => {
    it('should add transport and create connection', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      expect(connection).toBeDefined();
      expect(connection.id).toBe('test-1');
      expect(manager.count).toBe(1);
    });

    it('should emit connection event', async () => {
      const transport = new MockTransport('test-1');

      const connPromise = new Promise<void>((resolve) => {
        manager.connected$.subscribe((conn) => {
          if (conn) {
            expect(conn.id).toBe('test-1');
            resolve();
          }
        });
      });

      manager.addTransport(transport);
      await connPromise;
    });

    it('should track multiple connections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      manager.addTransport(t1);
      manager.addTransport(t2);
      manager.addTransport(t3);

      expect(manager.count).toBe(3);
    });
  });

  describe('removing connections', () => {
    it('should remove connection when transport closes', async () => {
      const transport = new MockTransport('test-1');
      manager.addTransport(transport);

      expect(manager.count).toBe(1);

      const disconnectPromise = new Promise<void>((resolve) => {
        manager.disconnected$.subscribe((conn) => {
          if (conn) {
            expect(conn.id).toBe('test-1');
            expect(manager.count).toBe(0);
            resolve();
          }
        });
      });

      transport.close();
      await disconnectPromise;
    });

    it('should handle multiple disconnections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      manager.addTransport(t1);
      manager.addTransport(t2);
      manager.addTransport(t3);

      expect(manager.count).toBe(3);

      t1.close();
      expect(manager.count).toBe(2);

      t2.close();
      expect(manager.count).toBe(1);

      t3.close();
      expect(manager.count).toBe(0);
    });
  });

  describe('finding connections', () => {
    it('should find connection by ID', () => {
      const transport = new MockTransport('test-123');
      manager.addTransport(transport);

      const found = manager.getConnection('test-123');
      expect(found).toBeDefined();
      expect(found?.id).toBe('test-123');
    });

    it('should return undefined for non-existent ID', () => {
      const found = manager.getConnection('does-not-exist');
      expect(found).toBeUndefined();
    });

    it('should expose connection state via getter', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      // Test the state getter
      expect(connection.state).toBe('connected');

      connection.authenticate('user-1');
      expect(connection.state).toBe('authenticated');

      connection.deauthenticate();
      expect(connection.state).toBe('connected');
    });

    it('should handle transport disconnection', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      expect(connection.state).toBe('connected');

      // Simulate transport losing connection
      transport.connected$.next(false);

      expect(connection.state).toBe('disconnected');
    });

    it('should transition from connecting to connected', async () => {
      // Create a special mock transport that starts in an indeterminate state
      const transport = new MockTransport('test-1');

      // Use a Subject instead of BehaviorSubject so we can control when values emit
      const connectedSubject = new Subject<boolean>();
      Object.defineProperty(transport, 'connected$', {
        value: connectedSubject.asObservable(),
        writable: false
      });

      const connection = manager.addTransport(transport);

      // Should start in connecting state (no emission yet)
      expect(connection.state).toBe('connecting');

      // Wait a tick to ensure no race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(connection.state).toBe('connecting'); // Still connecting

      // Now emit connected
      connectedSubject.next(true);

      // Wait for the emission to process
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should now be connected
      expect(connection.state).toBe('connected');
    });

    it('should not transition when already connected and receiving true', async () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      // Should be connected
      expect(connection.state).toBe('connected');

      // Emit connected again (redundant)
      transport.connected$.next(true);

      // Wait for any potential state changes
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still be connected (no state change)
      expect(connection.state).toBe('connected');

      // Now authenticate
      connection.authenticate('user-1');
      expect(connection.state).toBe('authenticated');

      // Emit connected again while authenticated
      transport.connected$.next(true);

      // Wait for any potential state changes
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still be authenticated (no state change to 'connected')
      expect(connection.state).toBe('authenticated');
    });

    it('should find connection by user ID', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);
      connection.authenticate('user-123');

      const found = manager.getConnectionByUserId('user-123');
      expect(found).toBeDefined();
      expect(found?.userId).toBe('user-123');
    });

    it('should return undefined for non-existent user ID', () => {
      const found = manager.getConnectionByUserId('no-such-user');
      expect(found).toBeUndefined();
    });
  });

  describe('authenticated connections', () => {
    it('should track authenticated connections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      const c1 = manager.addTransport(t1);
      const c2 = manager.addTransport(t2);
      const c3 = manager.addTransport(t3);

      // Authenticate some connections
      c1.authenticate('user-1');
      c3.authenticate('user-3');

      const authenticated = manager.getAuthenticatedConnections();
      expect(authenticated).toHaveLength(2);
      expect(authenticated.map((c) => c.userId)).toContain('user-1');
      expect(authenticated.map((c) => c.userId)).toContain('user-3');
    });

    it('should update when connections authenticate', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      expect(manager.getAuthenticatedConnections()).toHaveLength(0);

      connection.authenticate('user-1');
      expect(manager.getAuthenticatedConnections()).toHaveLength(1);
    });

    it('should update when connections deauthenticate', () => {
      const transport = new MockTransport('test-1');
      const connection = manager.addTransport(transport);

      connection.authenticate('user-1');
      expect(manager.getAuthenticatedConnections()).toHaveLength(1);

      connection.deauthenticate();
      expect(manager.getAuthenticatedConnections()).toHaveLength(0);
    });
  });

  describe('broadcasting', () => {
    it('should broadcast to all connections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      manager.addTransport(t1);
      manager.addTransport(t2);
      manager.addTransport(t3);

      const received: string[][] = [[], [], []];

      t1.output$.subscribe((msg) => received[0].push(msg));
      t2.output$.subscribe((msg) => received[1].push(msg));
      t3.output$.subscribe((msg) => received[2].push(msg));

      manager.broadcast('Test message');

      expect(received[0]).toContain('Test message');
      expect(received[1]).toContain('Test message');
      expect(received[2]).toContain('Test message');
    });

    it('should exclude specified connection from broadcast', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      const c1 = manager.addTransport(t1);
      const c2 = manager.addTransport(t2);
      const c3 = manager.addTransport(t3);

      const received: string[][] = [[], [], []];

      t1.output$.subscribe((msg) => received[0].push(msg));
      t2.output$.subscribe((msg) => received[1].push(msg));
      t3.output$.subscribe((msg) => received[2].push(msg));

      manager.broadcast('Test message', c2);

      expect(received[0]).toContain('Test message');
      expect(received[1]).not.toContain('Test message');
      expect(received[2]).toContain('Test message');
    });

    it('should broadcast only to authenticated connections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      const c1 = manager.addTransport(t1);
      const c2 = manager.addTransport(t2);
      const c3 = manager.addTransport(t3);

      // Only authenticate some
      c1.authenticate('user-1');
      c3.authenticate('user-3');

      const received: string[][] = [[], [], []];

      t1.output$.subscribe((msg) => received[0].push(msg));
      t2.output$.subscribe((msg) => received[1].push(msg));
      t3.output$.subscribe((msg) => received[2].push(msg));

      manager.broadcastAuthenticated('Auth message');

      expect(received[0]).toContain('Auth message');
      expect(received[1]).not.toContain('Auth message');
      expect(received[2]).toContain('Auth message');
    });

    it('should broadcast to authenticated excluding specified connection', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      const c1 = manager.addTransport(t1);
      const c2 = manager.addTransport(t2);
      const c3 = manager.addTransport(t3);

      // Authenticate all three
      c1.authenticate('user-1');
      c2.authenticate('user-2');
      c3.authenticate('user-3');

      const received: string[][] = [[], [], []];

      t1.output$.subscribe((msg) => received[0].push(msg));
      t2.output$.subscribe((msg) => received[1].push(msg));
      t3.output$.subscribe((msg) => received[2].push(msg));

      // Broadcast but exclude c2
      manager.broadcastAuthenticated('Auth message', c2);

      expect(received[0]).toContain('Auth message');
      expect(received[1]).not.toContain('Auth message'); // Excluded
      expect(received[2]).toContain('Auth message');
    });
  });

  describe('aggregated input stream', () => {
    it('should receive input from all connections', async () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');

      manager.addTransport(t1);
      manager.addTransport(t2);

      const received: Array<{ id: string; data: string }> = [];

      const inputPromise = new Promise<void>((resolve) => {
        manager.input$.subscribe(({ connection, data }) => {
          received.push({ id: connection.id, data });

          if (received.length === 2) {
            expect(received).toContainEqual({ id: 'test-1', data: 'from-1' });
            expect(received).toContainEqual({ id: 'test-2', data: 'from-2' });
            resolve();
          }
        });
      });

      t1.input$.next('from-1');
      t2.input$.next('from-2');
      await inputPromise;
    });
  });

  describe('connection state observable', () => {
    it('should emit connection list updates', async () => {
      const t1 = new MockTransport('test-1');

      let emitCount = 0;
      const updatePromise = new Promise<void>((resolve) => {
        manager.connections$.subscribe((connections) => {
          emitCount++;

          if (emitCount === 1) {
            expect(connections).toHaveLength(0);
          } else if (emitCount === 2) {
            expect(connections).toHaveLength(1);
            expect(connections[0].id).toBe('test-1');
            resolve();
          }
        });
      });

      manager.addTransport(t1);
      await updatePromise;
    });
  });

  describe('closeAll', () => {
    it('should close all connections', () => {
      const t1 = new MockTransport('test-1');
      const t2 = new MockTransport('test-2');
      const t3 = new MockTransport('test-3');

      manager.addTransport(t1);
      manager.addTransport(t2);
      manager.addTransport(t3);

      const closedSpy1 = vi.fn();
      const closedSpy2 = vi.fn();
      const closedSpy3 = vi.fn();

      t1.closed$.subscribe(closedSpy1);
      t2.closed$.subscribe(closedSpy2);
      t3.closed$.subscribe(closedSpy3);

      manager.closeAll();

      expect(closedSpy1).toHaveBeenCalled();
      expect(closedSpy2).toHaveBeenCalled();
      expect(closedSpy3).toHaveBeenCalled();
    });
  });
});
