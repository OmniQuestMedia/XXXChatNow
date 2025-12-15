const { DB, COLLECTION } = require('./lib');

const setting = {
    key: 'providerAgreementContent',
    value: '',
    name: 'Provider Agreement Content',
    description:'',
    type: 'post',
    public: true,
    autoload: true,
    group: 'general',
    editable: true,
    visible: true
  
}

module.exports.up = async function up(next) {
  console.log('Create Provider Agreement Content');
  const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
    key: setting.key
  });

  if (!checkKey) {
    await DB.collection(COLLECTION.SETTING).insertOne(setting);
    console.log(`Inserted setting: ${setting.key}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Setting: ${setting.key} exists`);
  }
  // eslint-disable-next-line no-console
  console.log('Create Provider Agreement Content done');
  next()
}

module.exports.down = function down(next) {
  next()
}