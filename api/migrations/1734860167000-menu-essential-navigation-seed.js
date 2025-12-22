const { DB, COLLECTION } = require('./lib');

/**
 * Migration to seed essential navigation menus for the site
 * This includes footer menus and primary navigation with hierarchical support
 */
module.exports.up = async function up(next) {
  // Check if menus already exist to prevent duplicates
  const existingMenuCount = await DB.collection(COLLECTION.MENU).countDocuments();
  
  if (existingMenuCount > 0) {
    console.log('Menus already exist, skipping seed');
    next();
    return;
  }

  // Essential footer menus
  const footerMenus = [
    {
      title: 'Contact',
      path: '/contact-us',
      section: 'footer',
      internal: true,
      isOpenNewTab: false,
      parentId: null,
      ordering: 1,
      public: true,
      help: 'Contact us page'
    },
    {
      title: 'Terms of Service',
      path: '/page/terms-of-service',
      section: 'footer',
      internal: true,
      isOpenNewTab: false,
      parentId: null,
      ordering: 2,
      public: true,
      help: 'Terms of Service page'
    },
    {
      title: 'DMCA',
      path: '/page/dmca',
      section: 'footer',
      internal: true,
      isOpenNewTab: false,
      parentId: null,
      ordering: 3,
      public: true,
      help: 'DMCA notice page'
    },
    {
      title: '2257',
      path: '/page/u.s.c-2257',
      section: 'footer',
      internal: true,
      isOpenNewTab: false,
      parentId: null,
      ordering: 4,
      public: true,
      help: 'U.S.C 2257 compliance page'
    },
    {
      title: 'Studio',
      path: '/studio/login',
      section: 'footer',
      internal: true,
      isOpenNewTab: true,
      parentId: null,
      ordering: 5,
      public: true,
      help: 'Studio login page'
    }
  ];

  // Primary navigation with hierarchical example
  const headerMenus = [
    {
      title: 'Home',
      path: '/',
      section: 'header',
      internal: true,
      isOpenNewTab: false,
      parentId: null,
      ordering: 1,
      public: true,
      help: 'Home page'
    }
  ];

  // Insert footer menus
  console.log('Inserting footer menus...');
  for (const menu of footerMenus) {
    await DB.collection(COLLECTION.MENU).insertOne({
      ...menu,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`  - Created footer menu: ${menu.title}`);
  }

  // Insert header menus
  console.log('Inserting header menus...');
  for (const menu of headerMenus) {
    const result = await DB.collection(COLLECTION.MENU).insertOne({
      ...menu,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`  - Created header menu: ${menu.title}`);

    // Create example submenu items under Home
    if (menu.title === 'Home') {
      const parentId = result.insertedId;
      const subMenus = [
        {
          title: 'Models',
          path: '/search/models',
          section: 'header',
          internal: true,
          isOpenNewTab: false,
          parentId: parentId,
          ordering: 1,
          public: true,
          help: 'Browse models'
        },
        {
          title: 'Live Cams',
          path: '/',
          section: 'header',
          internal: true,
          isOpenNewTab: false,
          parentId: parentId,
          ordering: 2,
          public: true,
          help: 'View live cameras'
        }
      ];

      for (const subMenu of subMenus) {
        await DB.collection(COLLECTION.MENU).insertOne({
          ...subMenu,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`    - Created submenu: ${subMenu.title}`);
      }
    }
  }

  console.log('Essential navigation menus seeded successfully');
  next();
};

module.exports.down = async function down(next) {
  // Remove only the menus we created
  const menuTitles = [
    'Contact', 'Terms of Service', 'DMCA', '2257', 'Studio',
    'Home', 'Models', 'Live Cams'
  ];
  
  await DB.collection(COLLECTION.MENU).deleteMany({
    title: { $in: menuTitles }
  });
  
  console.log('Essential navigation menus removed');
  next();
};
