/**
 * Inventory Command Verification Script
 * 
 * This script assumes the database is already bootstrapped.
 * Run this AFTER starting the game server or running bootstrap.
 * 
 * Usage: npx tsx verify-inventory.ts
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB || process.env.DB_NAME || 'malice';

async function verify() {
    console.log('=== Inventory Command Verification ===');
    console.log('Assumes bootstrap has already been run.\n');

    const db = new ObjectDatabase(MONGO_URI, DB_NAME);

    try {
        console.log('Connecting to existing database...');
        await db.connect();

        const manager = new ObjectManager(db);
        const $ = manager as any;

        // Verify aliases exist
        if (!$.player || !$.room || !$.describable || !$.wearable) {
            throw new Error('Required prototypes not found. Run bootstrap first.');
        }
        console.log('✓ Prototypes found\n');

        // Mock Context
        const sentMessages: string[] = [];
        const mockContext: any = {
            send: (msg: string) => { sentMessages.push(msg); },
            question: async () => '',
            choice: async () => '',
            yesorno: async () => false,
            setHandler: () => { },
        };

        // Create test room
        console.log('Creating test room...');
        const room = await manager.create({
            parent: $.room.id,
            properties: {
                name: 'Inventory Test Room',
                description: 'A room for testing the inventory command.',
            },
            methods: {},
        });

        // Create test player
        console.log('Creating test player...');
        const player = await manager.create({
            parent: $.player.id,
            properties: {
                name: 'TestHero',
                location: room,
            },
            methods: {},
        });
        await room.call('addContent', player);
        await player.call('connect', mockContext);
        console.log('✓ Player connected\n');

        // Create test items
        console.log('Creating test items...');
        const sword = await manager.create({
            parent: $.describable.id,
            properties: { name: 'shiny sword', weight: 2000 },
            methods: {},
        });
        await sword.call('moveTo', room);

        const hat = await manager.create({
            parent: $.wearable.id,
            properties: {
                name: 'wizard hat',
                covers: ['head'],
                layer: 4
            },
            methods: {},
        });
        await hat.call('moveTo', room);
        console.log('✓ Items created\n');

        // ============ TEST 1: Empty Inventory ============
        console.log('TEST 1: Empty Inventory');
        sentMessages.length = 0;
        await player.callVerb('inventory', mockContext, player, 'inventory', []);
        let output = sentMessages.join('');
        console.log('  Output:', output.trim());

        if (output.toLowerCase().includes('hands are empty') && output.toLowerCase().includes('not wearing')) {
            console.log('  ✓ PASSED\n');
        } else {
            console.log('  ✗ FAILED - Expected empty hands and not wearing message\n');
        }

        // ============ TEST 2: Held Item ============
        console.log('TEST 2: Held Item (pick up sword)');
        await player.callVerb('get', mockContext, player, 'get sword', [sword]);

        sentMessages.length = 0;
        await player.callVerb('inventory', mockContext, player, 'inventory', []);
        output = sentMessages.join('');
        console.log('  Output:', output.trim());

        if (output.toLowerCase().includes('shiny sword') && output.toLowerCase().includes('hand')) {
            console.log('  ✓ PASSED\n');
        } else {
            console.log('  ✗ FAILED - Expected sword in hand\n');
        }

        // ============ TEST 3: Worn Item ============
        console.log('TEST 3: Worn Item (wear hat)');
        await player.callVerb('get', mockContext, player, 'get hat', [hat]);
        await hat.call('wear', player);

        sentMessages.length = 0;
        await player.callVerb('inventory', mockContext, player, 'inventory', []);
        output = sentMessages.join('');
        console.log('  Output:', output.trim());

        if (output.toLowerCase().includes('wizard hat') && output.toLowerCase().includes('wearing')) {
            console.log('  ✓ PASSED\n');
        } else {
            console.log('  ✗ FAILED - Expected wizard hat being worn\n');
        }

        // Cleanup - delete test objects
        console.log('Cleaning up test objects...');
        await db['objects'].deleteOne({ _id: player.id });
        await db['objects'].deleteOne({ _id: room.id });
        await db['objects'].deleteOne({ _id: sword.id });
        await db['objects'].deleteOne({ _id: hat.id });

        console.log('\n=== Verification Complete ===');

    } catch (err) {
        console.error('Verification FAILED:', err);
        process.exit(1);
    } finally {
        await db.disconnect();
    }
}

verify();
