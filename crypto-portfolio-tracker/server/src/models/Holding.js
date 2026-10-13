import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coinId: { type: String, required: true }, // CoinGecko coin id, e.g. "bitcoin"
    symbol: { type: String, default: '' },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    // Average buy price per coin, expressed in the user's selected currency.
    buyPrice: { type: Number, min: 0, default: null },
    notes: { type: String, maxlength: 500, default: '' },
    source: { type: String, enum: ['manual', 'wallet'], default: 'manual' },
    walletAddress: { type: String, default: null },
  },
  { timestamps: true }
);

// One manual row per coin; one wallet row per coin per wallet.
holdingSchema.index({ user: 1, coinId: 1, source: 1, walletAddress: 1 }, { unique: true });

export default mongoose.model('Holding', holdingSchema);
