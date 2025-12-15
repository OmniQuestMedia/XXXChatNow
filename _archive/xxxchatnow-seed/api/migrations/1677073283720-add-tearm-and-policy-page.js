const { readFileSync } = require('fs');
const { join } = require('path');
const { replace } = require('lodash');
const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  const regExp = /\[\[DOMAIN\]\]/g;
  const terms = readFileSync(join(__dirname, 'content', 'terms-of-conditions.html')).toString();
  const policy = readFileSync(join(__dirname, 'content', 'policy.html')).toString();

  const [
    termsContent,
    policyContent
  ] = await Promise.all([
    replace(terms, regExp, process.env.DOMAIN),
    replace(policy, regExp, process.env.DOMAIN)
  ]);

  const KEYS = {
    TERMS: 'terms-and-conditions',
    POLICY: 'privacy-policy'
  };

  const pages = [
    {
      title: 'Terms and Conditions',
      type: 'post',
      status: 'published',
      authorId: null,
      shortDescription: 'terms and conditions',
      content: termsContent,
      slug: KEYS.TERMS
    },
    {
      title: ' Privacy Policy',
      type: 'post',
      status: 'published',
      authorId: null,
      shortDescription: 'Privacy policy',
      content: policyContent,
      slug: KEYS.POLICY
    }
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const p of pages) {
    // eslint-disable-next-line no-await-in-loop
    const post = await DB.collection(COLLECTION.POST).findOne({ slug: p.slug });
    if (!post) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.POST).insertOne({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Created post ${p.title}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Post ${p.title} existed!`);
    }
  }

  next();
}

module.exports.down = function down(next) {
  next()
}
