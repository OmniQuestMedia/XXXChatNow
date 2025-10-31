

const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
    key: 'contactFormText'
  });
  if (!checkKey) {
    // eslint-disable-next-line no-await-in-loop
    await DB.collection(COLLECTION.SETTING).insertOne({
      key: 'contactFormText',
      name: 'Contact Form Text',
      type: 'text-editor',
      value: '<p>Please fill out all the info beside and we will get back to you with-in 48hrs.</p>',
      public: true,
      autoload: false,
      group: 'general',
      editable: true,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // eslint-disable-next-line no-console
    console.log(`Inserted setting: contactFormText`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Setting: contactFormText exists`);
  }
  next()
}

module.exports.down = function down(next) {
  next()
}
