const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['REMINDER', 'OVERLOAD_ALERT', 'PROMO', 'REFUND', 'BOOKING_UPDATE'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    is_read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
