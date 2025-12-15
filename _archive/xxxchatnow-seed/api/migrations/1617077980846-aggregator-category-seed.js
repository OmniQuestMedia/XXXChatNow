

const mongoose = require('mongoose');

const $TAGS = [{"id":1,"display_name":"69","name":"69"},{"id":2,"display_name":"Anal Sex","name":"anal"},{"id":3,"display_name":"Closeup","name":"closeup"},{"id":4,"display_name":"Sex Toys","name":"toys"},{"id":5,"display_name":"Femdom","name":"femdom"},{"id":6,"display_name":"Fetish","name":"fetish"},{"id":7,"display_name":"Hairy","name":"hairy"},{"id":8,"display_name":"Latex","name":"latex"},{"id":9,"display_name":"Leather","name":"leather"},{"id":10,"display_name":"Orgasm","name":"orgasm"},{"id":11,"display_name":"Love Balls","name":"balls"},{"id":12,"display_name":"Massage","name":"massage"},{"id":13,"display_name":"Masturbation","name":"masturbation"},{"id":14,"display_name":"Moaning","name":"moaning"},{"id":15,"display_name":"Nurse","name":"nurse"},{"id":16,"display_name":"Nylon","name":"nylon"},{"id":17,"display_name":"Oil","name":"oil"},{"id":18,"display_name":"Oral","name":"oral"},{"id":19,"display_name":"Panties","name":"panties"},{"id":20,"display_name":"Pantyhose","name":"pantyhose"},{"id":21,"display_name":"Piercings","name":"piercings"},{"id":22,"display_name":"Pornstar","name":"pornstar"},{"id":23,"display_name":"Secretary","name":"secretary"},{"id":24,"display_name":"Shower","name":"shower"},{"id":25,"display_name":"Buttplug","name":"buttplug"},{"id":26,"display_name":"MILF","name":"milf"},{"id":27,"display_name":"Foot","name":"foot"},{"id":28,"display_name":"Spanking","name":"spanking"},{"id":29,"display_name":"Squirting","name":"squirting"},{"id":30,"display_name":"Stockings","name":"stockings"},{"id":31,"display_name":"Submissive","name":"submissive"},{"id":32,"display_name":"Tattoo","name":"tattoo"},{"id":33,"display_name":"Uniform","name":"uniform"},{"id":34,"display_name":"Vibrator","name":"vibrator"},{"id":35,"display_name":"Zoom Cam","name":"zoom cam"},{"id":36,"display_name":"Anilingus","name":"anilingus"},{"id":37,"display_name":"Armpits","name":"armpits"},{"id":38,"display_name":"Big Penis","name":"big penis"},{"id":39,"display_name":"Boots","name":"boots"},{"id":40,"display_name":"Exhibitionism","name":"exhibitionism"},{"id":41,"display_name":"Fur","name":"fur"},{"id":42,"display_name":"Legs","name":"leg"},{"id":43,"display_name":"Muscles","name":"muscles"},{"id":44,"display_name":"Older Men","name":"older men"},{"id":45,"display_name":"Rubber","name":"rubber"},{"id":46,"display_name":"Shoes","name":"shoes"},{"id":47,"display_name":"Small Penis","name":"small penis"},{"id":48,"display_name":"Tickling","name":"tickling"},{"id":49,"display_name":"Transvestism","name":"transvestism"},{"id":50,"display_name":"Underwear","name":"underwear"},{"id":51,"display_name":"Voyeurism","name":"voyeurism"},{"id":52,"display_name":"Cunnilingus","name":"cunnilingus"},{"id":53,"display_name":"Teen","name":"teen"},{"id":54,"display_name":"Young","name":"young"},{"id":55,"display_name":"Mature","name":"mature"},{"id":56,"display_name":"Granny","name":"granny"},{"id":57,"display_name":"Blowjob","name":"blowjob"},{"id":58,"display_name":"Bondage","name":"bondage"},{"id":59,"display_name":"Cooking","name":"cooking"},{"id":60,"display_name":"Cosplay","name":"cosplay"},{"id":61,"display_name":"Creampie","name":"creampie"},{"id":62,"display_name":"Dance","name":"dance"},{"id":63,"display_name":"Deepthroat","name":"deepthroat"},{"id":64,"display_name":"Dildo","name":"dildo"},{"id":65,"display_name":"Dirty Talk","name":"dirty talk"},{"id":66,"display_name":"Doggy","name":"doggy"},{"id":67,"display_name":"Fingering","name":"fingering"},{"id":68,"display_name":"Fisting","name":"fisting"},{"id":69,"display_name":"Fuck Machine","name":"fuck machine"},{"id":70,"display_name":"Gag","name":"gag"},{"id":71,"display_name":"Office","name":"office"},{"id":72,"display_name":"Ohmibod","name":"ohmibod"},{"id":73,"display_name":"Outdoor","name":"outdoor"},{"id":74,"display_name":"Sex Games","name":"games"},{"id":75,"display_name":"Role Play","name":"role play"},{"id":77,"display_name":"Smoking","name":"smoking"},{"id":78,"display_name":"Squirt","name":"squirt"},{"id":79,"display_name":"Striptease","name":"striptease"},{"id":80,"display_name":"Tittyfuck","name":"tittyfuck"},{"id":81,"display_name":"Topless","name":"topless"},{"id":82,"display_name":"Twerk","name":"twerk"},{"id":83,"display_name":"Vaping","name":"vaping"},{"id":84,"display_name":"Yoga","name":"yoga"},{"id":85,"display_name":"Ass","name":"ass"},{"id":86,"display_name":"Big Ass","name":"big ass"},{"id":87,"display_name":"Big Tits","name":"big tits"},{"id":88,"display_name":"Lesbian","name":"lesbian"},{"id":89,"display_name":"Shaven","name":"shaven"},{"id":90,"display_name":"Small Tits","name":"small tits"},{"id":91,"display_name":"Interracial","name":"interracial"},{"id":92,"display_name":"Pregnant","name":"pregnant"},{"id":93,"display_name":"BDSM","name":"bdsm"},{"id":94,"display_name":"Cuckold","name":"cuckold"},{"id":95,"display_name":"Slave","name":"slave"},{"id":96,"display_name":"Swingers","name":"swingers"},{"id":97,"display_name":"Glamour","name":"glamour"},{"id":98,"display_name":"Hipster","name":"hipster"},{"id":99,"display_name":"Housewife","name":"housewife"},{"id":100,"display_name":"Romantic","name":"romantic"},{"id":101,"display_name":"Student","name":"student"},{"id":102,"display_name":"Arab","name":"arab"},{"id":103,"display_name":"Asian","name":"asian"},{"id":104,"display_name":"White","name":"white"},{"id":105,"display_name":"Skinny","name":"skinny"},{"id":106,"display_name":"Athletic","name":"athletic"},{"id":107,"display_name":"Medium","name":"medium"},{"id":108,"display_name":"Curvy","name":"curvy"},{"id":109,"display_name":"BBW","name":"bbw"},{"id":110,"display_name":"Bald","name":"bald"},{"id":111,"display_name":"Colorful","name":"colorful"},{"id":112,"display_name":"Redhead","name":"redhead"},{"id":113,"display_name":"Hardcore","name":"hardcore"},{"id":114,"display_name":"Non Nude","name":"non nude"},{"id":115,"display_name":"Lovense","name":"lovense"},{"id":116,"display_name":"Kiiroo","name":"kiiroo"},{"id":117,"display_name":"Group","name":"group"},{"id":118,"display_name":"ASMR","name":"asmr"},{"id":119,"display_name":"Corset","name":"corset"},{"id":120,"display_name":"Jerk-off Instruction","name":"jerk-off instruction"},{"id":121,"display_name":"Mistress","name":"mistress"},{"id":122,"display_name":"Twink","name":"twink"},{"id":123,"display_name":"Grandpa","name":"grandpa"},{"id":124,"display_name":"Daddy","name":"daddy"},{"id":125,"display_name":"Penis Ring","name":"penis ring"},{"id":126,"display_name":"Muscular","name":"muscular"},{"id":127,"display_name":"Chunky","name":"chunky"},{"id":128,"display_name":"Blond","name":"blond"},{"id":129,"display_name":"Brunet","name":"brunet"},{"id":130,"display_name":"Bears","name":"bears"},{"id":131,"display_name":"Big Cock","name":"big cock"},{"id":132,"display_name":"Bisexual","name":"bisexual"},{"id":133,"display_name":"Gay","name":"gay"},{"id":134,"display_name":"Straight","name":"straight"},{"id":135,"display_name":"Sexy","name":"sexy"},{"id":136,"display_name":"School","name":"school"},{"id":137,"display_name":"Anime","name":"anime"},{"id":138,"display_name":"Cute","name":"cute"},{"id":139,"display_name":"Hand job","name":"hand job"}];

module.exports.up = async function up (next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  // eslint-disable-next-line no-restricted-syntax
  for (const tag of $TAGS) {
    const alias = tag.display_name.toLowerCase().replace(/[^a-zA-Z0-9\.]/g, '-');
    // eslint-disable-next-line no-await-in-loop
    const count = await db.collection('aggregatorcategories').countDocuments({ alias });
    if (!count) {
      // eslint-disable-next-line no-await-in-loop
      await db.collection('aggregatorcategories').insertOne({
        name: tag.display_name,
        alias,
        tags: [tag.name],
        active: true
      });
    }
  }

  next()
}

module.exports.down = async function down (next) {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
  });

  const { db } = mongoose.connection;
  await db.collection('aggregatorcategories').deleteMany({});
  next()
}
