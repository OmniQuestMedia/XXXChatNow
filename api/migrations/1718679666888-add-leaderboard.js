const { DB, COLLECTION } = require('./lib');



const leaderboards = [
  {
    duration: 'last_day',
    status: 'active',
    title: 'Top user last day',
    type: 'totalSpent'
  },
  {
    duration: 'last_week',
    status: 'active',
    title: 'Top user last week',
    type: 'totalSpent'
  },
  {
    duration: 'last_month',
    status: 'active',
    title: 'Top user last month',
    type: 'totalSpent'
  },
  {
    duration: 'last_year',
    status: 'active',
    title: 'Top user last year',
    type: 'totalSpent'
  },
  {
    duration: 'last_day',
    status: 'active',
    title: 'Top performer last day',
    type: 'totalEarned'
  },
  {
    duration: 'last_week',
    status: 'active',
    title: 'Top performer last week',
    type: 'totalEarned'
  },
  {
    duration: 'last_month',
    status: 'active',
    title: 'Top performer last month',
    type: 'totalEarned'
  },
  {
    duration: 'last_year',
    status: 'active',
    title: 'Top performer last year',
    type: 'totalEarned'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update referral commission settings');

  // eslint-disable-next-line no-restricted-syntax
  for (const leaderboard of leaderboards) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.LEADERBOARDS).findOne({
      duration: leaderboard.duration,
      type: leaderboard.type
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.LEADERBOARDS).insertOne({
        ...leaderboard,
        duration: leaderboard.duration || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted leaderboards`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Leaderboards exists`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Update commission settings');
  next();
};

module.exports.down = function down(next) {
  next();
};
