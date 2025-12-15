const { DB, COLLECTION } = require('./lib');

const settings = [
  {
    key: 'camAggChaturbateWM',
    value: 'ZCn7T',
    type: 'text',
    name: 'Chaturbate WM',
    description: 'Chaturbate WM value',
    public: false,
    group: 'camAggregator',
    editable: true,
    visible: true,
    meta: {
      ordering: 7
    }
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const count = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!count) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne(setting);
    }
  }

  // remove vm key
  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 'camAggChaturbateVM'
  });

  // eslint-disable-next-line no-console
  console.log('Migrated cam aggregator settings is done');
  next();
};

module.exports.down = async function down(next) {
  next();
};
