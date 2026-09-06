import yaml
from typing import Dict, Any, Optional
import fnmatch

def load_config(config_path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"chaoslib: Failed to load config from {config_path}: {e}")
        return None

def match_route(pattern: str, route: str) -> bool:
    # Use fnmatch to support glob patterns like /api/*
    return fnmatch.fnmatch(route, pattern)
