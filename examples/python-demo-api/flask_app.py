import sys
import os
from flask import Flask, jsonify
from chaoslib_python import FlaskChaosMiddleware

app = Flask(__name__)

config_path = os.path.join(os.path.dirname(__file__), "chaos.config.yml")
app.wsgi_app = FlaskChaosMiddleware(app.wsgi_app, config_path=config_path)

@app.route("/api/users", methods=["GET"])
def get_users():
    return jsonify({"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]})

@app.route("/api/orders", methods=["GET"])
def get_orders():
    return jsonify({"orders": [{"id": 101, "total": 25.50}]})

@app.route("/api/drop", methods=["GET"])
def drop():
    return jsonify({"status": "success"})

if __name__ == "__main__":
    print("Flask Demo API listening on port 8001", file=sys.stderr)
    print("Logs are being piped to stdout, redirect to chaos.log to use CLI", file=sys.stderr)
    app.run(host="127.0.0.1", port=8001)
