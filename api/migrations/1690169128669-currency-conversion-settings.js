const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  CURRENCY_CONVERSTION_API_ENDPOINT: 'currencyConversionApiEndpoint',
  CURRENCY_CONVERSTION_API_KEY: 'currencyConversionApiKey',
  CURRENCY_CONVERSTION_BASE_CURRENCY: 'currencyConversionBaseCurrency'
};

const settings = [
  {
    key: SETTING_KEYS.CURRENCY_CONVERSTION_API_ENDPOINT,
    value: 'https://api.currencyfreaks.com/v2.0/rates/latest',
    name: 'API endpoint',
    description:
      'API endpoint for currency converstion. Check more info about server here https://www.currencyconverterapi.com/docs',
    public: false,
    autoload: false,
    group: 'currencyConversion',
    editable: true
  },
  {
    key: SETTING_KEYS.CURRENCY_CONVERSTION_API_KEY,
    value: '',
    name: 'API key',
    description: 'API key for currency converstion service.',
    public: false,
    autoload: false,
    group: 'currencyConversion',
    editable: true
  },
  {
    key: SETTING_KEYS.CURRENCY_CONVERSTION_BASE_CURRENCY,
    value: 'USD',
    name: 'Base currency',
    description:
      'Enter base currency code in your system, eg USD, EUR. User currency will be convert based on this value.',
    public: false,
    autoload: false,
    group: 'currencyConversion',
    editable: true
  }
];

module.exports.up = async function up(next) {
  await settings.reduce(async (lp, setting) => {
    await lp;
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
    return Promise.resolve();
  }, Promise.resolve());

  next();
};

module.exports.down = function down(next) {
  next();
};
