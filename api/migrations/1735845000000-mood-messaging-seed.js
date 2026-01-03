const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load JSON seed files
const moodBucketsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/mood-messaging/mood-buckets.json'), 'utf8')
);

const publicGratitudeData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/mood-messaging/public-micro-gratitude.json'), 'utf8')
);

const tierMappingData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../seeds/mood-messaging/tier-to-bucket-mapping.json'), 'utf8')
);

module.exports.up = async function up(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;

  // Seed mood buckets
  console.log('Seeding mood buckets...');
  for (const [key, bucket] of Object.entries(moodBucketsData.buckets)) {
    const count = await db.collection('mood_buckets').countDocuments({ key });
    if (!count) {
      await db.collection('mood_buckets').insertOne({
        key,
        name: bucket.name,
        description: bucket.description,
        responses: bucket.responses,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✓ Inserted mood bucket: ${key}`);
    } else {
      console.log(`  - Mood bucket already exists: ${key}`);
    }
  }

  // Seed public micro-gratitude messages
  console.log('Seeding public micro-gratitude messages...');
  const gratitudeCount = await db.collection('public_micro_gratitude').countDocuments({});
  if (gratitudeCount === 0) {
    const gratitudeInserts = publicGratitudeData.responses.map((text, index) => ({
      responseId: index,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await db.collection('public_micro_gratitude').insertMany(gratitudeInserts);
    console.log(`  ✓ Inserted ${gratitudeInserts.length} gratitude messages`);
  } else {
    console.log(`  - ${gratitudeCount} gratitude messages already exist`);
  }

  // Seed tier-to-bucket mappings
  console.log('Seeding tier-to-bucket mappings...');
  for (const [tierKey, tier] of Object.entries(tierMappingData.tiers)) {
    const count = await db.collection('tier_bucket_mappings').countDocuments({ tierKey });
    if (!count) {
      await db.collection('tier_bucket_mappings').insertOne({
        tierKey,
        tierName: tier.name,
        description: tier.description,
        buckets: tier.buckets,
        hasSecondaryMicro: tier.has_secondary_micro,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  ✓ Inserted tier mapping: ${tierKey}`);
    } else {
      console.log(`  - Tier mapping already exists: ${tierKey}`);
    }
  }

  console.log('Mood messaging system seeded successfully!');
  next();
};

module.exports.down = async function down(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  
  console.log('Removing mood messaging data...');
  await db.collection('mood_buckets').deleteMany({});
  await db.collection('public_micro_gratitude').deleteMany({});
  await db.collection('tier_bucket_mappings').deleteMany({});
  await db.collection('mood_message_history').deleteMany({});
  console.log('Mood messaging data removed successfully!');
  
  next();
};
