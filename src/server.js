import http from 'node:http';

const initialState = () => ({
  users: [
    { id: 1, name: 'Ana Torres', email: 'ana@example.com', role: 'admin' },
    { id: 2, name: 'Luis Perez', email: 'luis@example.com', role: 'user' }
  ],
  products: [
    { id: 1, name: 'Teclado mecánico', price: 89.99, stock: 12 },
    { id: 2, name: 'Monitor 24 pulgadas', price: 179.5, stock: 7 }
  ],
  orders: [
    { id: 1, userId: 1, productId: 2, quantity: 1, status: 'created' }
  ]
});

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('invalid-json');
  }
};

const findById = (items, id) => items.find((item) => item.id === Number(id));
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidEmail = (value) => isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const isValidUser = (user) => isNonEmptyString(user.name) && isValidEmail(user.email);
const hasValidUserUpdates = (user) =>
  (user.name === undefined || isNonEmptyString(user.name)) &&
  (user.email === undefined || isValidEmail(user.email)) &&
  (user.role === undefined || isNonEmptyString(user.role));

export const createServer = () => {
  const state = initialState();

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const segments = url.pathname.split('/').filter(Boolean);
    const [api, resource, id] = segments;

    try {
      if (request.method === 'GET' && api === 'api' && resource === 'health') {
        return sendJson(response, 200, { status: 'ok-revision', service: 'mock-devops-api' });
      }

      if (api !== 'api') return sendJson(response, 404, { error: 'Route not found' });

      if (request.method === 'GET' && resource === 'users' && !id) {
        return sendJson(response, 200, { data: state.users });
      }

      if (request.method === 'POST' && resource === 'users' && !id) {
        const body = await readJson(request);
        if (body.name === undefined || body.email === undefined) return sendJson(response, 400, { error: 'name and email are required' });
        if (!isValidUser(body)) return sendJson(response, 400, { error: 'name and email must be valid strings' });
        const user = { id: Math.max(...state.users.map((item) => item.id), 0) + 1, name: body.name, email: body.email, role: body.role || 'user' };
        state.users.push(user);
        return sendJson(response, 201, { data: user });
      }

      if (request.method === 'PUT' && resource === 'users' && id) {
        const user = findById(state.users, id);
        if (!user) return sendJson(response, 404, { error: 'User not found' });
        const body = await readJson(request);
        if (!hasValidUserUpdates(body)) return sendJson(response, 400, { error: 'user fields must have valid values' });
        Object.assign(user, { name: body.name ?? user.name, email: body.email ?? user.email, role: body.role ?? user.role });
        return sendJson(response, 200, { data: user });
      }

      if (request.method === 'DELETE' && resource === 'users' && id) {
        const index = state.users.findIndex((item) => item.id === Number(id));
        if (index === -1) return sendJson(response, 404, { error: 'User not found' });
        const [deleted] = state.users.splice(index, 1);
        return sendJson(response, 200, { data: deleted, message: 'User deleted' });
      }

      if (request.method === 'POST' && resource === 'orders' && !id) {
        const body = await readJson(request);
        const user = findById(state.users, body.userId);
        const product = findById(state.products, body.productId);
        if (!isPositiveInteger(body.userId) || !isPositiveInteger(body.productId) || !user || !product || !isPositiveInteger(body.quantity)) {
          return sendJson(response, 400, { error: 'userId, productId and a positive integer quantity are required' });
        }
        if (product.stock < body.quantity) return sendJson(response, 409, { error: 'Insufficient stock' });
        product.stock -= body.quantity;
        const order = { id: Math.max(...state.orders.map((item) => item.id), 0) + 1, userId: body.userId, productId: body.productId, quantity: body.quantity, status: 'created' };
        state.orders.push(order);
        return sendJson(response, 201, { data: order });
      }

      return sendJson(response, 404, { error: 'Route not found' });
    } catch (error) {
      if (error.message === 'invalid-json') return sendJson(response, 400, { error: 'Request body must be valid JSON' });
      return sendJson(response, 500, { error: 'Internal server error' });
    }
  });
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => console.log(`Mock API listening on http://localhost:${port}`));
}