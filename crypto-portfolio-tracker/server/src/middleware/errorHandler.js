import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    return res.status(400).json({ error: message });
  }
  if (err?.code === 11000) return res.status(409).json({ error: 'Already exists' });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  const status = err.status || 500;
  if (status >= 500 && status !== 502) console.error(err);
  res.status(status).json({
    error: status === 500 && !err.expose ? 'Internal server error' : err.message,
  });
}
