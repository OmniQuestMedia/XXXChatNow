const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  REFERRAL_ENABLED: 'referralEnabled',
  OPTION_FOR_REFERRAL: 'optionForReferral',
  INVITE_USER_FLAT_FEE: 'inviteUserFlatFee',
  INVITE_MODEL_FLAT_FEE: 'inviteModelFlatFee',
  PERFORMER_REFERRAL_COMMISSION: 'performerReferralCommission',
  USER_REFERRAL_COMMISSION: 'userReferralCommission'
};

const settings = [
  {
    key: SETTING_KEYS.REFERRAL_ENABLED,
    value: false,
    name: 'Enable/Disable referral program',
    description: 'Enable/Disable referral program, inviter will not receive any commission if you turn this option off',
    public: true,
    group: 'referral',
    editable: true,
    autoload: true,
    type: 'boolean',
    ordering: 0
  },
  {
    key: SETTING_KEYS.OPTION_FOR_REFERRAL,
    value: 'flatFee',
    name: 'Option for referral reward',
    description: 'If sellect "Flat fee", inviter will receive reward one time only. If sellect "Commission", inviter will receive reward every time invited member spend (user) money/token or sell (model) an item',
    public: false,
    group: 'referral',
    autoload: false,
    editable: true,
    type: 'radio',
    meta: {
      value: [{ key: 'flatFee', name: 'Flat Fee' }, { key: 'commission', name: 'Commission' }]
    },
    ordering: 1
  },
  {
    key: SETTING_KEYS.INVITE_USER_FLAT_FEE,
    value: 5,
    name: 'Invite user flat fee (token)',
    description: 'Flat fee that inviter receive everytime they invite successfully an user',
    public: false,
    group: 'referral',
    autoload: false,
    editable: true,
    type: 'number',
    meta: {
      min: 0
    },
    ordering: 2
  },
  {
    key: SETTING_KEYS.INVITE_MODEL_FLAT_FEE,
    value: 5,
    name: 'Invite model flat fee (token)',
    description: 'Amount of token(user) or token earning(performer) to be paid to Inviter to invite a user',
    public: false,
    group: 'referral',
    editable: true,
    type: 'number',
    ordering: 3
  },
  {
    key: SETTING_KEYS.PERFORMER_REFERRAL_COMMISSION,
    value: 5,
    name: 'Model/fan refer a model',
    description: '5 means the referral gets 5% on model revenue for 1 year',
    public: true,
    group: 'referral',
    editable: true,
    type: 'number',
    meta: {
      min: 0
    },
    ordering: 4
  },
  {
    key: SETTING_KEYS.USER_REFERRAL_COMMISSION,
    value: 5,
    name: 'Model/fan refer a fan',
    description: '5 means the referral gets 5% on fan spends',
    public: true,
    group: 'referral',
    editable: true,
    type: 'number',
    meta: {
      min: 0
    },
    ordering: 5
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update referral commission settings');

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
  console.log('Update commission settings');
  next();
};

module.exports.down = function down(next) {
  next();
};
