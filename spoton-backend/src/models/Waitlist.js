const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema(
  {
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null nếu là khách Walk-in
    },
    walk_in_name: { type: String },
    walk_in_phone: { type: String },
    guest_count: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED'],
      default: 'WAITING',
    },
    joined_at: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model('Waitlist', WaitlistSchema);
