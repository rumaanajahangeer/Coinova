import mongoose from 'mongoose';

// A point-in-time record of a user's total portfolio value (powers the history chart).
const snapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currency: { type: String, required: true },
  totalValue: { type: Number, required: true },
  costBasis: { type: Number, default: 0 },
  takenAt: { type: Date, default: Date.now },
});

snapshotSchema.index({ user: 1, currency: 1, takenAt: -1 });

export default mongoose.model('Snapshot', snapshotSchema);
