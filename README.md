# chaoslib

A lightweight chaos engineering toolkit for injecting controlled failures into Node.js and Python APIs — inspired by Netflix's Chaos Monkey, built for teams (or individuals) who want to verify their systems actually handle real-world failure instead of assuming they do.

`chaoslib` deliberately injects **latency spikes**, **error responses**, and **dropped connections** into live API traffic, based on a shared, portable config format across both languages.

---

## Why this exists

Most APIs are only ever tested against the happy path. Chaos engineering flips that: you deliberately break things in a controlled environment to see whether your system degrades gracefully — retries, fallbacks, circuit breakers — or falls over completely. Netflix built Chaos Monkey to do this at massive scale in production; `chaoslib` is a portable version any team can drop into dev or staging.

**Supports:**
- Node.js — Express middleware
- Python — both FastAPI (ASGI) and Flask (WSGI) middleware
- One shared YAML config format across all three runtimes
- A live terminal dashboard for watching fault injection happen in real time

---

## What this actually took to get right

This wasn't a "generate once and ship it" build — getting fault injection to behave *correctly*, not just run without crashing, surfaced some genuinely tricky bugs:

- **Dropped connections aren't the same as error responses.** The first implementation of `drop_connection` on both the FastAPI and Flask side returned a clean `500` instead of actually terminating the connection — which defeats the purpose, since a real dropped connection and a real error response require different handling from a resilient client. Fixed by directly closing the underlying socket at the transport level instead of raising an exception the framework could catch and convert into a normal response.
- **WSGI (Flask) doesn't give you the socket the easy way.** Unlike Node's direct `socket.destroy()`, Flask's WSGI middleware had to reach into `environ` for the raw server socket (`werkzeug.socket`) and shut it down manually — and even then, an early version occasionally hung indefinitely under load until wrapped correctly.
- **The live dashboard silently stopped tracking traffic on Windows.** Root cause: Node's `fs.watch` (used by the `tail` package by default) is known to be unreliable on Windows under rapid file writes. Switched to `fs.watchFile` (polling) for reliable cross-platform log tailing, plus a `try/finally` guard around the render debounce so a rendering error can't permanently freeze the UI.

All fault types (`latency`, `error`, `drop_connection`) across Node, FastAPI, and Flask were manually verified with real traffic — not just unit tests — before calling this done.

---

## Architecture

```
chaoslib/
├── packages/
│   ├── chaoslib-node/      # TypeScript Express middleware
│   ├── chaoslib-python/    # Python package: FastAPI + Flask middleware
│   └── chaoslib-cli/       # Live terminal monitoring dashboard
├── examples/
│   ├── node-demo-api/      # Express demo wired with chaoslib-node
│   └── python-demo-api/    # FastAPI + Flask demo wired with chaoslib-python
└── .github/workflows/      # CI: lint + test both packages
```

## Config format

Both middlewares read the same `chaos.config.yml` schema:

```yaml
enabled: true
rules:
  - route: "/api/users"
    fault_type: "latency"
    probability: 0.10
    latency_ms: [500, 1500]

  - route: "/api/orders"
    fault_type: "error"
    probability: 0.05
    error_status: 500
    error_body:
      error: "Internal Server Error (Chaoslib injected)"

  - route: "/api/drop"
    fault_type: "drop_connection"
    probability: 0.20
```

## Quick start

**Node.js (Express):**
```bash
npm install chaoslib-node
```
```ts
import { chaosMiddleware } from "chaoslib-node";
app.use(chaosMiddleware({ configPath: "./chaos.config.yml" }));
```

**Python (FastAPI):**
```bash
pip install chaoslib-python
```
```python
from chaoslib_python import FastAPIChaosMiddleware
app.add_middleware(FastAPIChaosMiddleware, config_path="./chaos.config.yml")
```

**Python (Flask):**
```python
from chaoslib_python import FlaskChaosMiddleware
app.wsgi_app = FlaskChaosMiddleware(app.wsgi_app, config_path="./chaos.config.yml")
```

**Live dashboard:**
```bash
node dist/index.js watch --log ./chaos.log
```

---

## Testing

```bash
# Node
cd packages/chaoslib-node && npm test

# Python
cd packages/chaoslib-python && pytest
```

CI runs both suites on every push via GitHub Actions.

---

## License

MIT