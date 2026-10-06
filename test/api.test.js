import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const request = (path, options) => fetch(`${baseUrl}${path}`, {
  ...options,
  headers: { 'content-type': 'application/json', ...(options?.headers || {}) }
});

test('1. GET /api/health responde estado del servicio', async () => {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('2. GET /api/users lista usuarios mock', async () => {
  const response = await request('/api/users');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.length, 2);
});

test('3. POST /api/users crea un usuario', async () => {
  const response = await request('/api/users', { method: 'POST', body: JSON.stringify({ name: 'Marta Ruiz', email: 'marta@example.com' }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.name, 'Marta Ruiz');
});

test('4. PUT /api/users/:id actualiza un usuario', async () => {
  const response = await request('/api/users/1', { method: 'PUT', body: JSON.stringify({ role: 'operator' }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.role, 'operator');
});

test('5. DELETE /api/users/:id elimina un usuario', async () => {
  const response = await request('/api/users/3', { method: 'DELETE' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, 'User deleted');
});

test('6. POST /api/orders crea una orden y descuenta stock', async () => {
  const response = await request('/api/orders', { method: 'POST', body: JSON.stringify({ userId: 1, productId: 1, quantity: 2 }) });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.status, 'created');
});

test('7. POST /api/users rechaza datos incompletos', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Usuario sin correo' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'name and email are required');
});

test('8. POST /api/users rechaza JSON inválido', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: '{"name":"Usuario sin cerrar"'
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Request body must be valid JSON');
});

test('9. POST /api/orders rechaza una orden con datos inválidos', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 999, productId: 1, quantity: 1 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});

test('10. POST /api/orders rechaza una orden sin stock suficiente', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1, productId: 1, quantity: 99 })
  });
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.error, 'Insufficient stock');
});

test('11. POST /api/users rechaza un nombre numérico', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 12345, email: 'numero@example.com' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'name and email must be valid strings');
});

test('12. POST /api/users rechaza un nombre compuesto solo por espacios', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: '   ', email: 'espacios@example.com' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'name and email must be valid strings');
});

test('13. POST /api/users rechaza un correo numérico', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Correo numérico', email: 123456 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'name and email must be valid strings');
});

test('14. POST /api/users rechaza un correo con formato inválido', async () => {
  const response = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Correo inválido', email: 'correo-sin-formato' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'name and email must be valid strings');
});

test('15. PUT /api/users/:id rechaza actualizar con un valor numérico', async () => {
  const response = await request('/api/users/1', {
    method: 'PUT',
    body: JSON.stringify({ name: 987 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'user fields must have valid values');
});

test('16. PUT /api/users/:id rechaza actualizar con espacios', async () => {
  const response = await request('/api/users/1', {
    method: 'PUT',
    body: JSON.stringify({ email: '   ' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'user fields must have valid values');
});

test('17. POST /api/orders rechaza cantidad cero', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1, productId: 1, quantity: 0 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});

test('18. POST /api/orders rechaza cantidad negativa', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1, productId: 1, quantity: -2 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});

test('19. POST /api/orders rechaza una cantidad decimal', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1, productId: 1, quantity: 1.5 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});

test('20. POST /api/orders rechaza una cantidad escrita como texto', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: 1, productId: 1, quantity: '2' })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});

test('21. POST /api/orders rechaza un identificador de usuario textual', async () => {
  const response = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ userId: '1', productId: 1, quantity: 1 })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'userId, productId and a positive integer quantity are required');
});