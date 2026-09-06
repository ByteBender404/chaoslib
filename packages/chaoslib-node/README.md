# chaoslib-node

Express middleware for injecting controlled failures.

## Installation

```bash
npm install chaoslib-node
```

## Usage

Create a `chaos.config.yml` in your project root:

```yaml
enabled: true
rules:
  - route: "/api/*"
    fault_type: "latency"
    probability: 0.1
    latency_ms: [200, 1000]
```

Add the middleware to your Express app:

```javascript
const express = require('express');
const { chaosMiddleware } = require('chaoslib-node');

const app = express();

app.use(chaosMiddleware({ configPath: './chaos.config.yml' }));

app.get('/api/users', (req, res) => res.json({ users: [] }));
app.listen(3000);
```
