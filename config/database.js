const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose
  .connect(
    `mongodb://${process.env.DATABASEURL}:${process.env.DATABSEPORT}/${process.env.DATABASE}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }
  )
  .then((res) => {
    // mongoose.pluralize(null);
    // mongoose.set('debug',true);

    console.log('database connected successfully');
  })
  .catch((error) => {
    console.log('error in connecting with database ', error);
  });
