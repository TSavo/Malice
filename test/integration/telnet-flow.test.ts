import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { TelnetTestClient } from '../helpers/telnet-client.js';
import { ObjectDatabase } from '../../src/database/object-db.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TELNET_HOST = process.env.TELNET_HOST || 'localhost';
const TELNET_PORT = parseInt(process.env.TELNET_PORT || '5555');

/**
 * End-to-end telnet integration tests
 * These tests require the server to be running on TELNET_PORT
 *
 * Run with: TELNET_PORT=5555 npm test -- --run telnet-flow
 */
describe('Telnet Integration Tests', () => {
  let client: TelnetTestClient;
  let db: ObjectDatabase;

  beforeAll(async () => {
    // Connect to database to clean up test users
    db = new ObjectDatabase(MONGO_URI, 'malice');
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(() => {
    client = new TelnetTestClient(TELNET_HOST, TELNET_PORT);
  });

  afterEach(() => {
    if (client.isConnected()) {
      client.disconnect();
    }
  });

  describe('Connection and Welcome', () => {
    it('should receive welcome message with logo on connect', async () => {
      await client.connect();
      // Wait for full welcome message to arrive
      await client.waitFor('Login:', 3000);
      const welcome = client.getBuffer();

      // Should contain login instructions (logo is ASCII art, may not have literal text)
      expect(welcome).toContain('Enter your username');
      expect(welcome).toContain('Login:');
    });

    it('should handle empty input gracefully at login prompt', async () => {
      await client.connect();
      await client.waitFor('Login:', 3000);
      client.clearBuffer();

      // Send empty lines (simulating accidental enters)
      client.send('');
      client.send('');
      client.send('');

      await client.waitFor('Please enter a username', 2000);
      const buffer = client.getBuffer();

      // Should prompt for username again without crashing
      expect(buffer).toContain('Please enter a username');
    });
  });

  describe('New User Registration', () => {
    const testUsername = `testuser_${Date.now()}`;

    afterEach(async () => {
      // Clean up test user from database
      await db['objects'].deleteMany({ 'properties.playername.value': testUsername });
    });

    it('should prompt for password when entering new username', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('New user!');

      const buffer = client.getBuffer();
      expect(buffer).toContain('New user!');
      expect(buffer).toContain('Choose a password');
    });

    it('should reject passwords shorter than 6 characters', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Choose a password');
      client.clearBuffer();

      client.send('short');
      await client.waitFor('at least 6 characters');

      const buffer = client.getBuffer();
      expect(buffer).toContain('Password must be at least 6 characters');
    });

    it('should start chargen after valid password', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Choose a password');
      client.clearBuffer();

      client.send('validpassword123');
      await client.waitFor('Character Creation', 10000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('Character Creation');
    });
  });

  describe('Character Creation Flow', () => {
    const testUsername = `chargen_${Date.now()}`;

    afterEach(async () => {
      // Clean up test user
      await db['objects'].deleteMany({ 'properties.playername.value': testUsername });
    });

    it('should complete basic chargen flow', async () => {
      await client.connect();
      client.clearBuffer();

      // Register new user
      client.send(testUsername);
      await client.waitFor('Choose a password');
      client.send('testpass123');

      // Wait for chargen to start
      await client.waitFor('What name do you go by', 10000);
      client.clearBuffer();

      // Enter display name
      client.send('TestCharacter');
      await client.waitFor('sex', 5000);
      client.clearBuffer();

      // Select sex (1 = Male)
      client.send('1');
      await client.waitFor('How old are you', 5000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('How old are you');
    });

    it('should handle invalid menu selection gracefully', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Choose a password');
      client.send('testpass123');

      await client.waitFor('What name do you go by', 10000);
      client.send('TestChar');
      await client.waitFor('sex', 5000);
      client.clearBuffer();

      // Send invalid selection
      client.send('99');
      // Wait for the menu to be re-displayed with options
      await client.waitFor('Male', 3000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('Invalid choice');

      // Should show menu again
      expect(buffer).toContain('Male');
      expect(buffer).toContain('Female');
    });
  });

  describe('Existing User Login', () => {
    const testUsername = `logintest_${Date.now()}`;
    const testPassword = 'testpass123';

    beforeAll(async () => {
      // Create a test user by going through registration
      const setupClient = new TelnetTestClient(TELNET_HOST, TELNET_PORT);
      try {
        await setupClient.connect();
        setupClient.send(testUsername);
        await setupClient.waitFor('Choose a password');
        setupClient.send(testPassword);
        // Wait for the actual name prompt, not just "Character Creation"
        await setupClient.waitFor('What name do you go by', 10000);
        setupClient.send('LoginTestChar');
        await setupClient.waitFor('sex', 5000);
        setupClient.send('1'); // Male
        await setupClient.waitFor('How old are you', 5000);
        setupClient.send('25');
        // Continue through chargen...
        await setupClient.wait(2000);
      } finally {
        setupClient.disconnect();
      }
    });

    afterAll(async () => {
      await db['objects'].deleteMany({ 'properties.playername.value': testUsername });
    });

    it('should prompt for password when entering existing username', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Password:', 3000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('Password:');
      expect(buffer).not.toContain('New user');
    });

    it('should reject invalid password', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Password:');
      client.clearBuffer();

      client.send('wrongpassword');
      // Wait for Login prompt to reappear after invalid password
      await client.waitFor('Login:', 3000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('Invalid password');
      expect(buffer).toContain('Login:');
    });

    it('should login successfully with correct password', async () => {
      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Password:');
      client.clearBuffer();

      client.send(testPassword);
      await client.waitFor('Welcome back', 5000);

      const buffer = client.getBuffer();
      expect(buffer).toContain('Welcome back');
    });
  });

  describe('Empty Input Handling', () => {
    it('should not crash on rapid empty inputs during login', async () => {
      await client.connect();
      client.clearBuffer();

      // Simulate rapid empty enters (PuTTY issue)
      for (let i = 0; i < 10; i++) {
        client.send('');
      }

      await client.wait(500);
      const buffer = client.getBuffer();

      // Should still be prompting for username
      expect(buffer).toContain('username');
      // Connection should still be active
      expect(client.isConnected()).toBe(true);
    });

    it('should not treat empty input as invalid during menu selection', async () => {
      const testUsername = `empty_${Date.now()}`;

      await client.connect();
      client.clearBuffer();

      client.send(testUsername);
      await client.waitFor('Choose a password');
      client.send('testpass123');
      await client.waitFor('What name do you go by', 10000);
      client.send('EmptyTest');
      await client.waitFor('sex', 5000);
      client.clearBuffer();

      // Send empty inputs - should be ignored
      client.send('');
      client.send('');
      await client.wait(300);

      let buffer = client.getBuffer();
      // Should NOT have "Invalid choice" for empty inputs
      expect(buffer).not.toContain('Invalid choice');

      // Now send valid selection
      client.send('1');
      await client.waitFor('How old are you', 5000);

      buffer = client.getBuffer();
      expect(buffer).toContain('How old are you');

      // Cleanup
      await db['objects'].deleteMany({ 'properties.playername.value': testUsername });
    });
  });
});
