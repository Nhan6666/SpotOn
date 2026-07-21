const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    reply: {
      text: { type: String, default: null },
      replied_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      replied_at: { type: Date, default: null }
    },
    status: {
      type: String,
      enum: ['PENDING', 'REPLIED', 'FLAGGED'],
      default: 'PENDING'
    },
    sla_deadline: {
      type: Date,
      default: null
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Review', ReviewSchema);
