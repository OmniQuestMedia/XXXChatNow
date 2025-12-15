const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const meta = await DB.collection(COLLECTION.SETTING).findOne({
    key: 'homeTitle'
  });
  
  if (!meta) {
    await DB.collection(COLLECTION.SETTING).insertOne({
      key: 'homeTitle',
      value: '',
      name: 'Home title',
      description: 'Custom title for home page (landing page)',
      public: true,
      autoload: false,
      group: 'custom',
      editable: true,
      visible: true,
      type: 'text',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  next();
}

module.exports.down = function down(next) {
  next();
}
