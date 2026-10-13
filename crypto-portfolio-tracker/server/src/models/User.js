import mongoose from 'mongoose';

export const CURRENCIES = ['usd', 'eur', 'gbp', 'inr', 'jpy', 'aud', 'cad'];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: '' },
    currency: { type: String, enum: CURRENCIES, default: 'usd' },
    wallets: [
      {
        _id: false,
        address: { type: String, required: true },
        label: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    email: this.email,
    name: this.name,
    currency: this.currency,
  };
};

export default mongoose.model('User', userSchema);
