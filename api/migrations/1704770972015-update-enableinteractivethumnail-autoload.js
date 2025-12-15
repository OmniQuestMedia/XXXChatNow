const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const setting = await DB.collection(COLLECTION.SETTING).findOne({
    key: 'enableInteractiveThumbnails'
  });

  if (!setting) {
    await DB.collection(COLLECTION.SETTING).insertOne({
      key: 'enableInteractiveThumbnails',
    value: false,
    name: 'Enable Interactive Thumbnails',
    description:
      'If active, hover to model homepage is show stream',
    type: 'boolean',
    public: true,
    group: 'general',
    editable: true,
    visible: true
    });
  } else {
    await DB.collection(COLLECTION.SETTING).updateOne({
      key: 'enableInteractiveThumbnails'
    }, {
      $set: {
        autoload: true
      }
    });
  }

  next();
}

module.exports.down = function down(next) {
  next();
}
