import { Request, Response, NextFunction } from 'express';
import { minimatch } from 'minimatch';
import { ChaosMiddlewareOptions, ChaosConfig, ChaosRule, ChaosLogEvent } from './types';
import { loadConfig } from './config';

function logEvent(event: ChaosLogEvent) {
  // Ensure we stringify as a single line for easy parsing
  console.log(JSON.stringify(event));
}

function executeFault(rule: ChaosRule, req: Request, res: Response, next: NextFunction, event: ChaosLogEvent) {
  event.fault_injected = true;
  event.fault_type = rule.fault_type;
  logEvent(event);

  if (rule.fault_type === 'latency') {
    const [min, max] = rule.latency_ms || [100, 500];
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(() => {
      next();
    }, delay);
  } else if (rule.fault_type === 'error') {
    const status = rule.error_status || 500;
    const body = rule.error_body || { error: 'chaoslib injected error' };
    res.status(status).json(body);
  } else if (rule.fault_type === 'drop_connection') {
    req.socket.destroy();
  } else {
    // fallback if unknown fault type
    next();
  }
}

export function chaosMiddleware(options: ChaosMiddlewareOptions) {
  // Load config synchronously once at startup (in a real app, maybe watch the file)
  const config = loadConfig(options.configPath);

  return function (req: Request, res: Response, next: NextFunction) {
    const event: ChaosLogEvent = {
      timestamp: new Date().toISOString(),
      route: req.originalUrl,
      method: req.method,
      fault_injected: false,
      fault_type: null,
    };

    if (!config || !config.enabled || !config.rules) {
      logEvent(event);
      return next();
    }

    // Check rules
    for (const rule of config.rules) {
      if (minimatch(req.originalUrl, rule.route)) {
        const roll = Math.random();
        if (roll < rule.probability) {
          return executeFault(rule, req, res, next, event);
        }
      }
    }

    // No fault triggered
    logEvent(event);
    next();
  };
}
