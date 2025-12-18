/**
 * Verification script for Object Cache optimization and Stable Proxy Pattern
 */
import { ObjectDatabase, ObjectManager } from './src/database/index.js';

async function verify() {
    console.log('🧪 Verifying Cache Optimization & Stable Proxy Pattern...\n');

    const db = new ObjectDatabase('mongodb://127.0.0.1:27017/malice');
    const manager = new ObjectManager(db);

    try {
        await db.connect();
        console.log('✅ Connected to MongoDB');

        // 1. Create an object
        const obj = await manager.create({
            parent: 1,
            properties: { name: 'CacheTest', version: 1 }
        });
        console.log(`✅ Created object #${obj.id}`);

        // 2. Verify reference stability
        const ref1 = obj;
        manager.clearCache(); // Transient clear
        const ref2 = await manager.load(obj.id);

        if (ref1 === ref2) {
            console.log('✅ PASS: Reference stability maintained after clearCache');
        } else {
            console.error('❌ FAIL: Reference stability broken after clearCache');
        }

        // 3. Verify in-place memory preservation
        console.log('\n🔄 Testing memory preservation...');
        obj.set('name', 'UpdatedName');

        if (obj.get('name') === 'UpdatedName') {
            console.log('✅ PASS: Property updated in memory');
        } else {
            console.error('❌ FAIL: Property not updated in memory');
        }

        // 4. Verify proxy behavior (no refresh needed)
        const ref3 = await manager.load(obj.id);
        if (ref1 === ref3) {
            console.log('✅ PASS: Proxy reference remains stable');
        } else {
            console.error('❌ FAIL: Proxy reference stability broken');
        }

        console.log('\n🚀 Cache verification complete!');
    } catch (err) {
        console.error('❌ Error during verification:', err);
    } finally {
        await db.disconnect();
        process.exit(0);
    }
}

verify();
