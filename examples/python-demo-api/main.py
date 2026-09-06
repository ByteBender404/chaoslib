import sys
import uvicorn
from fastapi import FastAPI
from chaoslib_python import FastAPIChaosMiddleware
import os

app = FastAPI()

config_path = os.path.join(os.path.dirname(__file__), "chaos.config.yml")
app.add_middleware(FastAPIChaosMiddleware, config_path=config_path)

@app.get("/api/users")
def get_users():
    return {"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}

@app.get("/api/orders")
def get_orders():
    return {"orders": [{"id": 101, "total": 25.50}]}

@app.get("/api/drop")
def drop():
    return {"status": "success"}

if __name__ == "__main__":
    print("Python Demo API listening on port 8000", file=sys.stderr)
    print("Logs are being piped to stdout, redirect to chaos.log to use CLI", file=sys.stderr)
    uvicorn.run(app, host="12.7.0.0.1", port=8000)
