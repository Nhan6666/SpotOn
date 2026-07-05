require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require('./src/models/Booking');
  const date = new Date('2026-07-05');
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const conflictingBookings = await Booking.find({
    branch_id: '6a48f97bc005a96f9ac132b1',
    shift: 'DINNER',
    reservation_date: { $gte: date, $lt: nextDate },
    $or: [
      { status: { $in: ['PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED'] } },
      { status: 'HOLDING', expires_at: { $gt: new Date() } }
    ]
  });

  console.log('Conflicting:', conflictingBookings.length);
  conflictingBookings.forEach(b => console.log(b._id, b.status, b.expires_at, b.table_ids));
  process.exit();
}).catch(console.error);
