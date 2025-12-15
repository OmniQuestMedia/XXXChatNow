/* eslint-disable no-await-in-loop */
const {
  DB,
  COLLECTION
} = require('./lib');

const SETTING_KEYS = {
  SPIN_WHEEL_COMMISSION: 'spinWheelCommission'
};

const settings = [
  {
    key: SETTING_KEYS.SPIN_WHEEL_COMMISSION,
    value: 0.3,
    name: 'Spin wheel commission',
    description: 'Commission share to admin if a user spin wheel in live stream of a modal',
    public: false,
    group: 'commission',
    editable: true,
    type: 'number'
  }
];
module.exports.up = async function up(next) {

  // eslint-disable-next-line no-console
  console.log('Migrate spin wheel commission settings');
  // eslint-disable-next-line no-restricted-syntax
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
        updatedAt: new Date(),
        ordering: 0
      });

      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);

    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('Migrate spin wheel commission settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};