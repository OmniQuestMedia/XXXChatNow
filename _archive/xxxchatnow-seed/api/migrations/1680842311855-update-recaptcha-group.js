const {
  DB, COLLECTION
} = require('./lib');

module.exports.up = async function (next) {
  await DB.collection(COLLECTION.SETTING).updateMany({
    key: {$in: ['googleReCaptchaEnabled', 'googleReCaptchaSiteKey', 'googleReCaptchaSecretKey']}
  }, {
    $set: {
      group: 'recapcha'
    }
  });

  next();
};

module.exports.down = function (next) {
  next();
};
