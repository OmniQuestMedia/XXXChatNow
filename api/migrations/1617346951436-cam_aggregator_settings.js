const mongoose = require('mongoose');

const settings = [{
  key: 'camAggXLoveCamEnabled',
  value: false,
  type: 'boolean',
  name: 'Enable xLoveCam',
  description: 'Enable / disable xLoveCam service',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 0
  }
},
{
  key: 'camAggXLoveCamAuthServiceId',
  value: '',
  type: 'text',
  name: 'xLoveCam ServiceId',
  description: 'xLoveCam ServiceId',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 1
  }
},
{
  key: 'camAggXLoveCamAuthItemId',
  value: '',
  type: 'text',
  name: 'xLoveCam ItemId',
  description: 'xLoveCam ItemId',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 2
  }
},
{
  key: 'camAggXLoveCamAuthSecret',
  value: '',
  type: 'text',
  name: 'xLoveCam authSecret',
  description: 'xLoveCam authSecret',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 3
  }
},
{
  key: 'camAggBongacamsEnabled',
  value: false,
  type: 'boolean',
  name: 'Enable Bongacams',
  description: 'Enable/Disable Bongacams',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 4
  }
},
{
  key: 'camAggBongacamsC',
  value: '',
  type: 'text',
  name: 'Bongacams C',
  description: 'Bongacams c value',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 5
  }
},
{
  key: 'camAggChaturbatesEnabled',
  value: false,
  type: 'boolean',
  name: 'Enable Chaturbate',
  description: 'Enable/Disable Chaturbate',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 6
  }
},
{
  key: 'camAggChaturbateCampaign',
  value: '',
  type: 'text',
  name: 'Chaturbate Campaign',
  description: 'Chaturbate campaign value',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true
},
{
  key: 'camAggStripcashEnabled',
  value: false,
  type: 'boolean',
  name: 'Enable Stripcash',
  description: 'Enable/Disable Stripcash',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 20
  }
},
{
  key: 'camAggStripcashUserId',
  value: '',
  type: 'text',
  name: 'Stripcash userId',
  description: 'Stripcash userId value',
  public: false,
  group: 'camAggregator',
  editable: true,
  visible: true,
  meta: {
    ordering: 21
  }
}];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Starting migrate cam aggregator settings...');
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;

  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const count = await db.collection('settings').countDocuments({ key: setting.key });
    if (!count) {
      // eslint-disable-next-line no-await-in-loop
      await db.collection('settings').insertOne(setting);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Migrated cam aggregator settings is done');
  next();
};

module.exports.down = async function down(next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  await db.collection('settings').deleteMany({
    group: 'camAggregator'
  });
  next();
};
