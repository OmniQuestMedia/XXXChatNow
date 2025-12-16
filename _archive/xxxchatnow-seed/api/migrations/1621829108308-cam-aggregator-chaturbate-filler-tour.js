const mongoose = require('mongoose');

const settings = [
  {
    key: 'camAggChaturbateTour',
    value: '',
    type: 'text',
    name: 'Chaturbate Tour',
    description: 'Chaturbate tour value',
    public: false,
    group: 'camAggregator',
    editable: true,
    visible: true
  }];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Starting migrate cam aggregator settings...');
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const count = await db.collection('settings').countDocuments({ key: setting.key });
    if (!count) {
      // eslint-disable-next-line no-await-in-loop
      await db.collection('settings').insertOne(setting);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Migrated cam aggregator settings is done');
  next();
};

module.exports.down = async function down(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  await db.collection('settings').deleteMany({
    group: 'camAggregator'
  });
  next();
};
