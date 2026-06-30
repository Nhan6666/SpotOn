const mongoose = require('mongoose');
const Branch = require('./src/models/Branch');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/spoton_db';

async function sync() {
  try {
    await mongoose.connect(MONGO_URI);
    const branches = await Branch.find();
    for (const b of branches) {
      if (b.manager_id) {
        await User.findByIdAndUpdate(b.manager_id, { branch_id: b._id });
        console.log(`Synced user ${b.manager_id} to branch ${b._id}`);
      }
    }
    console.log('Sync complete!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}
sync();
