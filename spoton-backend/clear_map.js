const mongoose = require('mongoose');
require('dotenv').config();
const Branch = require('./src/models/Branch');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected. Clearing zones/tables from all branches...');
  
  await Branch.updateMany({}, { $set: { zones: [] } });
  
  console.log('Successfully cleared all maps.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
