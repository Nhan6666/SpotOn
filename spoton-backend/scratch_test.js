require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

async function test() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const booking = await Booking.findById('6a5740dd9b01b1d5f8216df8');
  console.log('Raw Booking from DB:');
  console.log('customer_id:', booking?.customer_id);
  console.log('walk_in_name:', booking?.walk_in_name);
  console.log('walk_in_phone:', booking?.walk_in_phone);
  console.log('branch_id:', booking?.branch_id);
  console.log('status:', booking?.status);
  
  process.exit(0);
}

test();
