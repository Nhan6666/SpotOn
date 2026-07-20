const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('users').updateMany({}, { $set: { is_email_verified: true } });
  console.log('Updated all users');
  process.exit(0);
});
