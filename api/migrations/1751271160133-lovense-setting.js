const {
  DB,
  COLLECTION
} = require('./lib');

const LOVENSE_CAM_SITE_NAME = 'lovenseCamSiteName';
const ENABLE_LOVENSE = 'enableLovense';

const settings = [{
  key: LOVENSE_CAM_SITE_NAME,
  value: '',
  name: 'Cam Site Name',
  description: 'Require if enabled. The name that will be displayed in our cam site list (in the Cam Extension). Contact us if you want to change it.',
  public: true,
  group: 'lovense',
  editable: true,
  visible: true,
  type: 'text'
},
{
  key: ENABLE_LOVENSE,
  value: false,
  name: '',
  description: 'Enable / Disable lovense',
  type: 'boolean',
  public: true,
  group: 'lovense',
  editable: true,
  visible: true
}
];
module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate lovense settings');

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
  console.log('Migrate lovense settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};