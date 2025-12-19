const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  TWO_FA: '2fa'
};

const settings = [
  {
    key: SETTING_KEYS.TWO_FA,
    value: '913212343xx',
    name: 'Default OTP 2FA',
    description: 'Authenticator',
    public: true,
    autoload: true,
    group: 'general',
    editable: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate 2 fa settings');

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
  console.log('Migrate 2 fa settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
