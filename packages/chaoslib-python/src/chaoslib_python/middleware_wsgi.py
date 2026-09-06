import json
import random
import time
from datetime import datetime, timezone
from werkzeug.wrappers import Request, Response
from .config import load_config, match_route

class FlaskChaosMiddleware:
    def __init__(self, app, config_path: str):
        self.app = app
        self.config_path = config_path
        self.config = load_config(config_path)

    def _log_event(self, event: dict):
        print(json.dumps(event))

    def __call__(self, environ, start_response):
        request = Request(environ)
        route = request.path
        method = request.method

        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "route": route,
            "method": method,
            "fault_injected": False,
            "fault_type": None
        }

        if not self.config or not self.config.get("enabled", False) or not self.config.get("rules"):
            self._log_event(event)
            return self.app(environ, start_response)

        for rule in self.config.get("rules", []):
            if match_route(rule.get("route", ""), route):
                probability = rule.get("probability", 0.0)
                if random.random() < probability:
                    event["fault_injected"] = True
                    event["fault_type"] = rule.get("fault_type")
                    self._log_event(event)
                    return self._execute_fault(rule, environ, start_response)

        self._log_event(event)
        return self.app(environ, start_response)

    def _execute_fault(self, rule: dict, environ, start_response):
        fault_type = rule.get("fault_type")
        
        if fault_type == "latency":
            min_ms, max_ms = rule.get("latency_ms", [100, 500])
            delay = random.uniform(min_ms, max_ms) / 1000.0
            time.sleep(delay)
            return self.app(environ, start_response)
            
        elif fault_type == "error":
            status = rule.get("error_status", 500)
            body = rule.get("error_body", {"error": "chaoslib injected error"})
            response = Response(json.dumps(body), status=status, content_type="application/json")
            return response(environ, start_response)
            
        elif fault_type == "drop_connection":
            # In WSGI, attempt to find the raw socket in environ and close it directly.
            # Werkzeug (Flask dev server)
            sock = environ.get('werkzeug.socket')
            if sock:
                try:
                    import socket
                    sock.shutdown(socket.SHUT_RDWR)
                except Exception:
                    pass
                try:
                    sock.close()
                except Exception:
                    pass
            
            # Gunicorn
            sock = environ.get('gunicorn.socket')
            if sock:
                try:
                    import socket
                    sock.shutdown(socket.SHUT_RDWR)
                except Exception:
                    pass
                try:
                    sock.close()
                except Exception:
                    pass

            return []
        else:
            return self.app(environ, start_response)
