/* eslint-disable no-restricted-syntax */
const { DB, COLLECTION } = require('./lib');

const settings = [
  {
    key: 'camAggChaturbateType',
    value: 'revshare',
    type: 'dropdown',
    name: 'Chaturbate Type',
    description: 'Chaturbate type value',
    public: false,
    group: 'camAggregator',
    editable: true,
    visible: true,
    meta: {
      value: [
        { key: 'revshare', name: 'Revshare program' },
        { key: 'payperregister', name: 'Pay per registration program' }
      ],
      ordering: 8
    }
  },
  {
    key: 'camAggStripcashAPIKey',
    value: '',
    type: 'text',
    name: 'Stripcash API Key',
    description: 'Stripcash API key',
    public: false,
    group: 'camAggregator',
    editable: true,
    visible: true,
    meta: {
      ordering: 22
    }
  }
];

module.exports.up = async function up(next) {
  // remove SEO home meta settings autoload
  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 'camAggChaturbateCampaign'
  });

  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 'camAggChaturbateTour'
  });

  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Update cam-aggregator settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
