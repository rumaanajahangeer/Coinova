import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coinId: { type: String, required: true },
    symbol: { type: String, default: '' },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    currency: { type: String, required: true },
    condition: { type: String, enum: ['above', 'below'], required: true },
    targetPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    triggeredAt: { type: Date, default: null },
    triggeredPrice: { type: Number, default: null },
    seen: { type: Boolean, default: false }, // has the user been notified in the UI?
  },
  { timestamps: true }
);

export default mongoose.model('Alert', alertSchema);
