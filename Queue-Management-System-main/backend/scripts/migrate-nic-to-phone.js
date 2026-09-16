/**
 * Migration Script: Rename `nic` field to `phone` in all User documents.
 * Run ONCE with: node backend/scripts/migrate-nic-to-phone.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const col = mongoose.connection.collection('users');

    // Step 1: Drop the old `nic` unique index (if it exists)
    try {
        await col.dropIndex('nic_1');
        console.log('Dropped old nic_1 index.');
    } catch (e) {
        console.log('No nic_1 index found (already removed or never existed).');
    }

    // Step 2: Rename `nic` to `phone` for all documents that still have `nic`
    const result = await col.updateMany(
        { nic: { $exists: true } },
        { $rename: { nic: 'phone' } }
    );
    console.log(`Field renamed in ${result.modifiedCount} user(s).`);

    // Step 3: Ensure the new `phone` unique index exists
    await col.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log('Created new phone unique index.');

    console.log('Migration complete!');
    await mongoose.disconnect();
    process.exit(0);
};

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
