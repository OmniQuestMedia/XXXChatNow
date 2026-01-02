/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const mongoose = require('mongoose');

const SEEDS_DIR = join(__dirname, '..', 'seeds');

/**
 * Migration: Mood Messaging System Seed Data
 * 
 * This migration seeds the database with default mood buckets and responses
 * for the Model Mood Messaging System.
 * 
 * Seed files:
 * - moodBuckets.json: All default mood buckets
 * - publicGratitude.json: Public gratitude responses (optional, for reference)
 * - privateMicroResponses.json: Private micro-responses (optional, for reference)
 */

module.exports.up = async function up(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  const collection = db.collection('moodbuckets');

  console.log('Starting mood messaging seed migration...');

  try {
    // Load mood buckets from seed file
    const moodBucketsPath = join(SEEDS_DIR, 'moodBuckets.json');
    const moodBucketsData = JSON.parse(readFileSync(moodBucketsPath, 'utf8'));

    console.log(`Loaded ${moodBucketsData.length} mood buckets from seed file`);

    let inserted = 0;
    let skipped = 0;

    // Insert each mood bucket
    for (const bucket of moodBucketsData) {
      // Check if bucket already exists
      const exists = await collection.findOne({ name: bucket.name });

      if (!exists) {
        // Insert new bucket
        await collection.insertOne({
          name: bucket.name,
          description: bucket.description,
          category: bucket.category,
          responses: bucket.responses,
          isDefault: bucket.isDefault !== undefined ? bucket.isDefault : true,
          visibility: bucket.visibility,
          active: bucket.active !== undefined ? bucket.active : true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        inserted++;
        console.log(`✓ Inserted mood bucket: ${bucket.name}`);
      } else {
        skipped++;
        console.log(`- Skipped existing mood bucket: ${bucket.name}`);
      }
    }

    console.log('\nMood messaging seed migration completed successfully!');
    console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);

    // Create indexes
    console.log('\nCreating indexes...');
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ category: 1, active: 1 });
    console.log('✓ Indexes created');

  } catch (error) {
    console.error('Error during mood messaging seed migration:', error);
    throw error;
  }

  next();
};

module.exports.down = async function down(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  const collection = db.collection('moodbuckets');

  console.log('Rolling back mood messaging seed migration...');

  try {
    // Delete only default mood buckets
    const result = await collection.deleteMany({ isDefault: true });
    console.log(`Deleted ${result.deletedCount} default mood buckets`);

    console.log('Mood messaging seed migration rollback completed!');
  } catch (error) {
    console.error('Error during mood messaging seed migration rollback:', error);
    throw error;
  }

  next();
};
