const express = require('express');
const { chaosMiddleware } = require('chaoslib-node');
const path = require('path');

const app = express();

app.use(chaosMiddleware({
  configPath: path.join(__dirname, 'chaos.config.yml')
}));

app.get('/api/users', (req, res) => {
  res.json({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] });
});

app.get('/api/orders', (req, res) => {
  res.json({ orders: [{ id: 101, total: 25.50 }] });
});

app.get('/api/drop', (req, res) => {
  res.json({ status: 'success' });
});

app.listen(3000, () => {
  console.error('Node Demo API listening on port 3000');
  console.error('Logs are being piped to chaos.log');
});
