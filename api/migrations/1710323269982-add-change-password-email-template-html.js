/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { readdirSync } = require('fs');
const { readFileSync } = require('fs');
const { join, parse } = require('path');
const { DB, COLLECTION } = require("./lib");

const TEMPLATE_DIR = join(__dirname, '..', 'templates', 'emails');

const templateMap = {
  'update-new-password': {
    name: 'Update new password',
    subject: 'Your password has been changed'
  }
};

module.exports.up = async function up (next) {
  const files = readdirSync(TEMPLATE_DIR).filter(f => f.includes('.html'));
  for (const file of files) {
    const content = readFileSync(join(TEMPLATE_DIR, file)).toString();
    const key = parse(file).name;
    const exist = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({ key });
    if (!exist) {
      await DB.collection(COLLECTION.EMAIL_TEMPLATE).insertOne({
        key,
        content,
        name: templateMap[key] ? templateMap[key].name : key,
        description: templateMap[key] ? templateMap[key].desc : 'N/A',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  next();
}

module.exports.down = function down(next) {
  next();
}