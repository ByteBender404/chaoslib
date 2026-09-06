# chaoslib-python

ASGI/WSGI middleware for injecting controlled failures into FastAPI and Flask applications.

## Installation

```bash
pip install chaoslib-python
```

## Usage (FastAPI)

Create a `chaos.config.yml` in your project root:

```yaml
enabled: true
rules:
  - route: "/api/*"
    fault_type: "error"
    probability: 0.05
    error_status: 503
    error_body: 
      error: "Service Unavailable"
```

Add the middleware to your FastAPI app:

```python
from fastapi import FastAPI
from chaoslib_python import FastAPIChaosMiddleware

app = FastAPI()

app.add_middleware(FastAPIChaosMiddleware, config_path="./chaos.config.yml")
```

## Usage (Flask)

Add the middleware to your Flask app:

```python
from flask import Flask
from chaoslib_python import FlaskChaosMiddleware

app = Flask(__name__)

app.wsgi_app = FlaskChaosMiddleware(app.wsgi_app, config_path="./chaos.config.yml")
```
