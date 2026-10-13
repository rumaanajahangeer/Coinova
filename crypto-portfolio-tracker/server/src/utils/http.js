import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function parseObjectId(value) {
  if (!mongoose.isValidObjectId(value)) throw new HttpError(400, 'Invalid id');
  return value;
}
