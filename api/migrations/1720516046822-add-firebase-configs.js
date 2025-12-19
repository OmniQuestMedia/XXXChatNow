const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  FIREBASE_API_KEY: 'FIREBASE_API_KEY',
  FIREBASE_AUTH_DOMAIN: 'FIREBASE_AUTH_DOMAIN',
  FIREBASE_PROJECT_ID: 'FIREBASE_PROJECT_ID',
  FIREBASE_STORAGE_BUCKET: 'FIREBASE_STORAGE_BUCKET',
  FIREBASE_MESSAGING_SENDER_ID: 'FIREBASE_MESSAGING_SENDER_ID',
  FIREBASE_APPID: 'FIREBASE_APPID',
  FIREBASE_MEASUREMENT_ID: 'FIREBASE_MEASUREMENT_ID',
  FIREBASE_WEB_PUSH_KEYPAIR: 'FIREBASE_WEB_PUSH_KEYPAIR',
  FIREBASE_CLIENT_EMAIL: 'FIREBASE_CLIENT_EMAIL',
  FIREBASE_PRIVATE_KEY: 'FIREBASE_PRIVATE_KEY'
};

const settings = [
  {
    key: SETTING_KEYS.FIREBASE_API_KEY,
    value: '',
    name: 'Api Key',
    description: 'Project Settings General',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_AUTH_DOMAIN,
    value: '',
    name: 'Auth Domain',
    public: true,
    autoload: true,
    group: 'firebase',
    editable: true,
    visible: true
  }, {
    key: SETTING_KEYS.FIREBASE_PROJECT_ID,
    value: '',
    name: 'Project ID',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  }, {
    key: SETTING_KEYS.FIREBASE_STORAGE_BUCKET,
    value: '',
    name: 'Storage Bucket',
    public: true,
    autoload: true,
    group: 'firebase',
    editable: true,
    visible: true
  }, {
    key: SETTING_KEYS.FIREBASE_MESSAGING_SENDER_ID,
    value: '',
    name: 'Messaging Sender ID',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_APPID,
    value: '',
    name: 'App Id',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_MEASUREMENT_ID,
    value: '',
    name: 'Measurement Id',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_WEB_PUSH_KEYPAIR,
    value: '',
    name: 'Web Push Keypair',
    public: true,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_CLIENT_EMAIL,
    value: '',
    name: 'Client Email',
    description: 'Project Settings Service Accounts. Generate new private key',
    public: false,
    group: 'firebase',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.FIREBASE_PRIVATE_KEY,
    value: '',
    name: 'Private key',
    description: 'Project Settings Service Accounts. Generate new private key',
    public: false,
    group: 'firebase',
    editable: true,
    visible: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate firebase settings');

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
  console.log('Migrate firebase settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
