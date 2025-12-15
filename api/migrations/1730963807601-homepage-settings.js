const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  HEADER_LEFT_CONTENT_HOMEPAGE: 'headerLeftContentHomepage',
  BODY_LEFT_CONTENT_HOMEPAGE: 'bodyLeftContentHomepage',
  HEADER_RIGHT_CONTENT_HOMEPAGE: 'headerRightContentHomepage',
  BODY_RIGHT_CONTENT_HOMEPAGE: 'bodyRightContentHomepage'
};
const settings = [
  {
    key: SETTING_KEYS.HEADER_LEFT_CONTENT_HOMEPAGE,
    value: '',
    name: 'Header left content',
    description: 'Custom code in <head> tag',
    public: true,
    autoload: true,
    group: 'homepage',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    },
    visible: true
  },
  {
    key: SETTING_KEYS.BODY_LEFT_CONTENT_HOMEPAGE,
    value: '',
    name: 'Body left content',
    description: 'Custom code at end of <body> tag',
    public: true,
    autoload: true,
    group: 'homepage',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    },
    visible: true
  },
  {
    key: SETTING_KEYS.HEADER_RIGHT_CONTENT_HOMEPAGE,
    value: '',
    name: 'Header right content',
    description: 'Custom code in <head> tag',
    public: true,
    autoload: true,
    group: 'homepage',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    },
    visible: true
  },
  {
    key: SETTING_KEYS.BODY_RIGHT_CONTENT_HOMEPAGE,
    value: '',
    name: 'Body right content',
    description: 'Custom code at end of <body> tag',
    public: true,
    autoload: true,
    group: 'homepage',
    editable: true,
    type: 'text',
    meta: {
      textarea: true
    },
    visible: true
  }
];
module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate settings');
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
  console.log('Migrate settings done');
  next();
};
module.exports.down = function down(next) {
  next();
};
