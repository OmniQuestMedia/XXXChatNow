const {
  DB, COLLECTION, encryptPassword, generateSalt
} = require('./lib');

const defaultPassword = 'adminadmin';

async function createAuth(newUser, userId, type = 'email') {
  const salt = generateSalt();
  const authCheck = await DB.collection(COLLECTION.AUTH).findOne({
    type,
    source: 'user',
    sourceId: userId
  });
  if (!authCheck) {
    await DB.collection(COLLECTION.AUTH).insertOne({
      type,
      source: 'user',
      sourceId: userId,
      salt,
      value: encryptPassword(defaultPassword, salt),
      key: type === 'email' ? newUser.email : newUser.username
    });
  }
}

module.exports.up = async function up(next) {
  const users = [
    {
      firstName: 'Admin',
      lastName: 'Admin',
      email: `admin@${process.env.DOMAIN || 'example.com'}`,
      username: 'admin',
      roles: ['admin'],
      status: 'active',
      emailVerified: true
    }
  ];

  // Lặp qua mảng users để kiểm tra từng user
  users.forEach(async (user) => {
    // Tìm đối tượng trong collection với email và username tương ứng
    const existingUser = await DB.collection(COLLECTION.USER).findOne({ $or: [{ email: user.email }, { username: user.username }] });

    if (existingUser) {
      // eslint-disable-next-line no-console
      console.log(`User with email ${user.email} and username ${user.username} exists in the collection`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Seeding ${user.username}`);
      const userId = await DB.collection(COLLECTION.USER).insertOne({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await createAuth(user, userId.insertedId, 'email');
      await createAuth(user, userId.insertedId, 'username');
    }
  });
  next();
};

module.exports.down = function down(next) {
  next();
};
