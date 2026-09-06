import asyncio
import json
import random
import time
from datetime import datetime, timezone
from starlette.types import ASGIApp, Receive, Scope, Send
from .config import load_config, match_route

class FastAPIChaosMiddleware:
    def __init__(self, app: ASGIApp, config_path: str):
        self.app = app
        self.config_path = config_path
        self.config = load_config(config_path)

    def _log_event(self, event: dict):
        print(json.dumps(event))

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        route = scope.get("path", "")
        method = scope.get("method", "GET")

        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "route": route,
            "method": method,
            "fault_injected": False,
            "fault_type": None
        }

        if not self.config or not self.config.get("enabled", False) or not self.config.get("rules"):
            self._log_event(event)
            return await self.app(scope, receive, send)

        for rule in self.config.get("rules", []):
            if match_route(rule.get("route", ""), route):
                probability = rule.get("probability", 0.0)
                if random.random() < probability:
                    event["fault_injected"] = True
                    event["fault_type"] = rule.get("fault_type")
                    self._log_event(event)
                    return await self._execute_fault(rule, scope, receive, send)

        self._log_event(event)
        return await self.app(scope, receive, send)

    async def _execute_fault(self, rule: dict, scope: Scope, receive: Receive, send: Send):
        fault_type = rule.get("fault_type")
        
        if fault_type == "latency":
            min_ms, max_ms = rule.get("latency_ms", [100, 500])
            delay = random.uniform(min_ms, max_ms) / 1000.0
            await asyncio.sleep(delay)
            return await self.app(scope, receive, send)
            
        elif fault_type == "error":
            status = rule.get("error_status", 500)
            body = rule.get("error_body", {"error": "chaoslib injected error"})
            body_bytes = json.dumps(body).encode("utf-8")
            
            await send({
                "type": "http.response.start",
                "status": status,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body_bytes)).encode("utf-8")),
                ]
            })
            await send({
                "type": "http.response.body",
                "body": body_bytes,
            })
            return
            
        elif fault_type == "drop_connection":
            # ASGI standard doesn't have a direct "destroy connection" message from server to client.
            # We attempt to find the underlying transport and close it directly to simulate a TCP drop.
            s = send
            visited = set()
            while True:
                if hasattr(s, '__self__'):
                    protocol = getattr(s, '__self__')
                    if hasattr(protocol, 'transport'):
                        # Mark as started/complete to suppress Uvicorn error logs if possible
                        if hasattr(protocol, 'response_started'):
                            protocol.response_started = True
                        if hasattr(protocol, 'response_complete'):
                            protocol.response_complete = True
                        transport = getattr(protocol, 'transport')
                        if hasattr(transport, 'close'):
                            transport.close()
                            return
                
                # Unwrap closures (e.g., Starlette BaseHTTPMiddleware wrappers)
                if hasattr(s, '__closure__') and s.__closure__:
                    found_next = False
                    for cell in s.__closure__:
                        contents = cell.cell_contents
                        if callable(contents) and id(contents) not in visited:
                            visited.add(id(contents))
                            s = contents
                            found_next = True
                            break
                    if found_next:
                        continue
                
                # Unwrap objects with __call__
                if hasattr(s, '__call__') and hasattr(s.__call__, '__self__') and getattr(s.__call__, '__self__') is not s:
                     s = s.__call__
                     continue
                     
                break
            
            # Fallback if we couldn't forcefully close it
            return
            
        else:
            return await self.app(scope, receive, send)
