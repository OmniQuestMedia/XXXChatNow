const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const setting = await DB.collection(COLLECTION.SETTING).findOne({
    key: 'userUrl'
  });

  if (!setting) {
    await DB.collection(COLLECTION.SETTING).insertOne({
      key: 'userUrl',
      value: process.env.USER_URL || `https://${process.env.DOMAIN}`,
      name: 'User URL',
      description: '',
      public: true,
      autoload: true,
      group: 'general',
      editable: true,
      type: 'text',
      visible: true
    });
  } else {
    await DB.collection(COLLECTION.SETTING).updateOne({
      key: 'userUrl'
    }, {
      $set: {
        autoload: true
      }
    });

    if (!setting.value) {
      await DB.collection(COLLECTION.SETTING).updateOne({
        key: 'userUrl'
      }, {
        $set: {
          value: process.env.USER_URL || `https://${process.env.DOMAIN}`
        }
      });
    }
  }

  next();
}

module.exports.down = function down(next) {
  next();
}
