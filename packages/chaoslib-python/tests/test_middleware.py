import pytest
import json
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from chaoslib_python import FastAPIChaosMiddleware

@pytest.fixture
def mock_config():
    return {
        "enabled": True,
        "rules": [
            {
                "route": "/api/*",
                "fault_type": "error",
                "probability": 1.0, # Always trigger for test
                "error_status": 503,
                "error_body": {"msg": "chaos"}
            }
        ]
    }

def test_fastapi_chaos_error_fault(mock_config, capsys):
    app = FastAPI()
    
    @app.get("/api/users")
    def get_users():
        return {"users": []}

    with patch('chaoslib_python.middleware_asgi.load_config', return_value=mock_config):
        app.add_middleware(FastAPIChaosMiddleware, config_path="dummy.yml")
        client = TestClient(app)
        
        response = client.get("/api/users")
        
        assert response.status_code == 503
        assert response.json() == {"msg": "chaos"}
        
        captured = capsys.readouterr()
        log_event = json.loads(captured.out.strip().split('\n')[-1])
        assert log_event["fault_injected"] is True
        assert log_event["fault_type"] == "error"

def test_fastapi_chaos_disabled(capsys):
    app = FastAPI()
    
    @app.get("/api/users")
    def get_users():
        return {"users": []}

    with patch('chaoslib_python.middleware_asgi.load_config', return_value={"enabled": False, "rules": []}):
        app.add_middleware(FastAPIChaosMiddleware, config_path="dummy.yml")
        client = TestClient(app)
        
        response = client.get("/api/users")
        
        assert response.status_code == 200
        assert response.json() == {"users": []}
        
        captured = capsys.readouterr()
        log_event = json.loads(captured.out.strip().split('\n')[-1])
        assert log_event["fault_injected"] is False
