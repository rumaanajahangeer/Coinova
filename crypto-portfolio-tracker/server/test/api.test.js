import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('health endpoint', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('protected routes require a token', async () => {
  for (const path of ['/api/portfolio', '/api/holdings', '/api/alerts', '/api/wallet', '/api/coins/top']) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 401, path);
  }
});

test('register validates input before touching the database', async () => {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /email/);
});

test('malformed JSON returns 400', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad json',
  });
  assert.equal(res.status, 400);
});

test('unknown routes return 404', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
});
