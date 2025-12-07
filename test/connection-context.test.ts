import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, BehaviorSubject } from 'rxjs';
import { ConnectionContext } from '../src/game/connection-context.js';
import { Connection } from '../src/connection/connection.js';
import { ObjectManager } from '../src/database/object-manager.js';
import type { ITransport, TerminalCapabilities } from '../types/transport.js';
import type { RuntimeObject, ObjId } from '../types/object.js';
import type { AuthInfo } from '../types/auth.js';

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
  private callHandler?: (method: string, ...args: unknown[]) => Promise<unknown>;

  constructor(id: ObjId) {
    this.id = id;
  }

  setCallHandler(handler: (method: string, ...args: unknown[]) => Promise<unknown>) {
    this.callHandler = handler;
  }

  get(prop: string): any {
    return undefined;
  }

  set(prop: string, value: any): void {}

  setMethod(name: string, code: string, options?: any): void {}

  async call(method: string, ...args: unknown[]): Promise<unknown> {
    if (this.callHandler) {
      return this.callHandler(method, ...args);
    }
    return undefined;
  }

  hasMethod(method: string): boolean {
    return true;
  }

  getParent(): ObjId {
    return 0;
  }

  async setParent(parent: ObjId): Promise<void> {}

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

describe('ConnectionContext', () => {
  let transport: MockTransport;
  let connection: Connection;
  let manager: MockObjectManager;
  let context: ConnectionContext;
  let sentMessages: string[];

  beforeEach(() => {
    transport = new MockTransport('test-1');
    connection = new Connection(transport);
    manager = new MockObjectManager() as any;
    context = new ConnectionContext(connection, manager as any);

    // Track sent messages
    sentMessages = [];
    connection.output$.subscribe((msg) => sentMessages.push(msg));
  });

  describe('basic functionality', () => {
    it('should expose connection ID', () => {
      expect(context.id).toBe('test-1');
    });

    it('should expose object manager via $ property', () => {
      expect(context.$).toBe(manager);
    });

    it('should expose terminal capabilities', () => {
      expect(context.capabilities).toBeDefined();
      expect(context.capabilities.width).toBe(80);
      expect(context.capabilities.height).toBe(24);
    });
  });

  describe('send()', () => {
    it('should send text to connection', () => {
      context.send('Hello, world!');
      expect(sentMessages).toContain('Hello, world!');
    });

    it('should send multiple messages', () => {
      context.send('Message 1');
      context.send('Message 2');
      context.send('Message 3');

      expect(sentMessages).toHaveLength(3);
      expect(sentMessages[0]).toBe('Message 1');
      expect(sentMessages[1]).toBe('Message 2');
      expect(sentMessages[2]).toBe('Message 3');
    });
  });

  describe('authenticate()', () => {
    it('should set user ID', () => {
      expect(context.getUserId()).toBeNull();
      expect(context.isAuthenticated()).toBe(false);

      context.authenticate(123);

      expect(context.getUserId()).toBe(123);
      expect(context.isAuthenticated()).toBe(true);
    });

    it('should authenticate underlying connection', () => {
      context.authenticate(456);

      expect(connection.userId).toBe('456');
      expect(connection.isAuthenticated).toBe(true);
    });
  });

  describe('close()', () => {
    it('should close the connection', () => {
      const closeSpy = vi.fn();
      connection.transport.closed$.subscribe(closeSpy);

      context.close();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('getAuthInfo() and isPreAuthenticated()', () => {
    it('should return null for unauthenticated transport', () => {
      expect(context.getAuthInfo()).toBeNull();
      expect(context.isPreAuthenticated()).toBe(false);
    });

    it('should return auth info for pre-authenticated transport', () => {
      const authInfo: AuthInfo = {
        mode: 'ssl-cert',
        sslCert: {
          commonName: 'test.example.com',
          fingerprint: 'ABC123',
          issuer: 'Test CA',
          verified: true,
          serialNumber: '12345',
          validFrom: new Date(),
          validTo: new Date(),
        },
      };

      const authTransport = new MockTransport('auth-test');
      const authConnection = new Connection(authTransport, authInfo);
      const authContext = new ConnectionContext(authConnection, manager as any);

      expect(authContext.getAuthInfo()).toBe(authInfo);
      expect(authContext.isPreAuthenticated()).toBe(true);
    });
  });

  describe('setHandler() and input handling', () => {
    it('should set handler object', () => {
      const handler = new MockRuntimeObject(1);
      context.setHandler(handler);
      // No exception means success
    });

    it('should call handler onInput when input received', async () => {
      const handler = new MockRuntimeObject(1);
      const calls: Array<{ method: string; args: unknown[] }> = [];

      handler.setCallHandler(async (method, ...args) => {
        calls.push({ method, args });
      });

      context.setHandler(handler);

      // Simulate input
      transport.input$.next('test input');

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe('onInput');
      expect(calls[0].args[0]).toBe(context);
      expect(calls[0].args[1]).toBe('test input');
    });

    it('should not call handler if none set', async () => {
      // No handler set
      transport.input$.next('test input');

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not throw error
      expect(sentMessages).toHaveLength(0);
    });

    it('should send error message if handler throws', async () => {
      const handler = new MockRuntimeObject(1);

      handler.setCallHandler(async () => {
        throw new Error('Handler error');
      });

      context.setHandler(handler);

      transport.input$.next('test input');

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('An error occurred'))).toBe(true);
    });
  });

  describe('load()', () => {
    it('should load object from manager', async () => {
      const obj = new MockRuntimeObject(42);
      manager.addObject(obj);

      const loaded = await context.load(42);
      expect(loaded).toBe(obj);
    });

    it('should return null for non-existent object', async () => {
      const loaded = await context.load(999);
      expect(loaded).toBeNull();
    });
  });

  describe('question()', () => {
    it('should ask a question and return trimmed input', async () => {
      const questionPromise = context.question('What is your name? ');

      // Wait for prompt to be sent
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages).toContain('What is your name? ');

      // Simulate user input with extra whitespace
      transport.input$.next('  Alice  \n');

      const answer = await questionPromise;
      expect(answer).toBe('Alice');
    });

    it('should handle empty input after trimming', async () => {
      const questionPromise = context.question('Enter something: ');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('   \n');

      const answer = await questionPromise;
      expect(answer).toBe('');
    });

    it('should re-prompt on validation failure', async () => {
      const validator = (input: string) => {
        if (input.length < 3) {
          return 'Name must be at least 3 characters';
        }
        return undefined;
      };

      const questionPromise = context.question('Enter name: ', validator);

      // Wait for initial prompt
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(sentMessages).toContain('Enter name: ');

      // Provide invalid input
      transport.input$.next('AB');

      // Wait for error and re-prompt
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.filter(msg => msg.includes('Name must be at least 3 characters')).length).toBe(1);
      expect(sentMessages.filter(msg => msg === 'Enter name: ').length).toBe(2);

      // Provide valid input
      transport.input$.next('Alice');

      const answer = await questionPromise;
      expect(answer).toBe('Alice');
    });

    it('should accept input that passes validation on first try', async () => {
      const validator = (input: string) => {
        if (!input.includes('@')) {
          return 'Must be an email address';
        }
        return undefined;
      };

      const questionPromise = context.question('Email: ', validator);

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('user@example.com');

      const answer = await questionPromise;
      expect(answer).toBe('user@example.com');
    });

    it('should handle multiple validation failures', async () => {
      const validator = (input: string) => {
        const num = parseInt(input);
        if (isNaN(num)) return 'Must be a number';
        if (num < 1 || num > 10) return 'Must be between 1 and 10';
        return undefined;
      };

      const questionPromise = context.question('Pick a number (1-10): ', validator);

      await new Promise(resolve => setTimeout(resolve, 10));

      // First try: not a number
      transport.input$.next('abc');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(sentMessages.some(msg => msg.includes('Must be a number'))).toBe(true);

      // Second try: out of range
      transport.input$.next('15');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(sentMessages.some(msg => msg.includes('Must be between 1 and 10'))).toBe(true);

      // Third try: valid
      transport.input$.next('7');

      const answer = await questionPromise;
      expect(answer).toBe('7');
    });
  });

  describe('choice()', () => {
    it('should present numbered menu and return selected key', async () => {
      const options = {
        red: 'Red color',
        green: 'Green color',
        blue: 'Blue color',
      };

      const choicePromise = context.choice('Choose a color:', options);

      // Wait for menu to be sent
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify menu was displayed
      const menu = sentMessages.join('');
      expect(menu).toContain('Choose a color:');
      expect(menu).toContain('1) Red color');
      expect(menu).toContain('2) Green color');
      expect(menu).toContain('3) Blue color');
      expect(menu).toContain('Enter number:');

      // Select option 2
      transport.input$.next('2');

      const choice = await choicePromise;
      expect(choice).toBe('green');
    });

    it('should re-prompt on invalid selection (non-number)', async () => {
      const options = {
        a: 'Option A',
        b: 'Option B',
      };

      const choicePromise = context.choice('Choose:', options);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Provide invalid input (not a number)
      transport.input$.next('abc');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('Invalid choice'))).toBe(true);

      // Provide valid input
      transport.input$.next('1');

      const choice = await choicePromise;
      expect(choice).toBe('a');
    });

    it('should re-prompt on invalid selection (out of range)', async () => {
      const options = {
        first: 'First option',
        second: 'Second option',
      };

      const choicePromise = context.choice('Select:', options);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Provide out of range number
      transport.input$.next('5');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('Invalid choice'))).toBe(true);

      // Provide valid input
      transport.input$.next('2');

      const choice = await choicePromise;
      expect(choice).toBe('second');
    });

    it('should re-prompt on selection of zero', async () => {
      const options = {
        x: 'Option X',
        y: 'Option Y',
      };

      const choicePromise = context.choice('Pick one:', options);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Try selecting 0
      transport.input$.next('0');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('Invalid choice'))).toBe(true);

      // Provide valid input
      transport.input$.next('1');

      const choice = await choicePromise;
      expect(choice).toBe('x');
    });

    it('should handle whitespace in input', async () => {
      const options = {
        foo: 'Foo',
        bar: 'Bar',
      };

      const choicePromise = context.choice('Choose:', options);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Input with whitespace
      transport.input$.next('  2  \n');

      const choice = await choicePromise;
      expect(choice).toBe('bar');
    });

    it('should maintain key order', async () => {
      const options = {
        third: 'Third',
        first: 'First',
        second: 'Second',
      };

      const choicePromise = context.choice('Choose:', options);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Select first item (should be 'third' since objects maintain insertion order)
      transport.input$.next('1');

      const choice = await choicePromise;
      expect(choice).toBe('third');
    });
  });

  describe('yesorno()', () => {
    it('should return true for "yes"', async () => {
      const yesnoPromise = context.yesorno('Do you agree?');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('Do you agree?') && msg.includes('(yes/no)'))).toBe(true);

      transport.input$.next('yes');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });

    it('should return true for "y"', async () => {
      const yesnoPromise = context.yesorno('Continue?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('y');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });

    it('should return false for "no"', async () => {
      const yesnoPromise = context.yesorno('Delete file?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('no');

      const answer = await yesnoPromise;
      expect(answer).toBe(false);
    });

    it('should return false for "n"', async () => {
      const yesnoPromise = context.yesorno('Exit?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('n');

      const answer = await yesnoPromise;
      expect(answer).toBe(false);
    });

    it('should be case insensitive', async () => {
      const yesnoPromise = context.yesorno('Confirm?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('YES');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });

    it('should handle mixed case', async () => {
      const yesnoPromise = context.yesorno('Ready?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('No');

      const answer = await yesnoPromise;
      expect(answer).toBe(false);
    });

    it('should re-prompt on invalid input', async () => {
      const yesnoPromise = context.yesorno('Accept?');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Invalid input
      transport.input$.next('maybe');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.some(msg => msg.includes('Please answer yes or no'))).toBe(true);

      // Valid input
      transport.input$.next('yes');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });

    it('should re-prompt multiple times on invalid input', async () => {
      const yesnoPromise = context.yesorno('Proceed?');

      await new Promise(resolve => setTimeout(resolve, 10));

      // First invalid input
      transport.input$.next('maybe');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second invalid input
      transport.input$.next('ok');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Third invalid input
      transport.input$.next('sure');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sentMessages.filter(msg => msg.includes('Please answer yes or no')).length).toBe(3);

      // Valid input
      transport.input$.next('n');

      const answer = await yesnoPromise;
      expect(answer).toBe(false);
    });

    it('should trim whitespace from input', async () => {
      const yesnoPromise = context.yesorno('OK?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('  yes  \n');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });

    it('should handle uppercase single letter', async () => {
      const yesnoPromise = context.yesorno('Save?');

      await new Promise(resolve => setTimeout(resolve, 10));

      transport.input$.next('Y');

      const answer = await yesnoPromise;
      expect(answer).toBe(true);
    });
  });

  describe('prompt utilities integration', () => {
    it('should handle question followed by yesorno', async () => {
      // First ask a question
      const namePromise = context.question('Name: ');
      await new Promise(resolve => setTimeout(resolve, 10));
      transport.input$.next('Alice');
      const name = await namePromise;
      expect(name).toBe('Alice');

      // Then ask yes/no
      const confirmPromise = context.yesorno('Is this correct?');
      await new Promise(resolve => setTimeout(resolve, 10));
      transport.input$.next('yes');
      const confirmed = await confirmPromise;
      expect(confirmed).toBe(true);
    });

    it('should handle choice followed by question', async () => {
      // First present choice
      const choicePromise = context.choice('Select role:', {
        warrior: 'Warrior',
        mage: 'Mage',
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      transport.input$.next('1');
      const role = await choicePromise;
      expect(role).toBe('warrior');

      // Then ask question
      const namePromise = context.question('Character name: ');
      await new Promise(resolve => setTimeout(resolve, 10));
      transport.input$.next('Conan');
      const name = await namePromise;
      expect(name).toBe('Conan');
    });
  });
});
