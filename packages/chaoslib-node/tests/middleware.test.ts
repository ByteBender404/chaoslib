import { Request, Response, NextFunction } from 'express';
import { chaosMiddleware } from '../src/middleware';
import * as configModule from '../src/config';
import { ChaosConfig } from '../src/types';

jest.mock('../src/config');

describe('chaosMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      originalUrl: '/api/users',
      method: 'GET',
      socket: {
        destroy: jest.fn(),
      } as any,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    next = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Fixed roll to test probabilities
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes through if config is disabled', () => {
    (configModule.loadConfig as jest.Mock).mockReturnValue({
      enabled: false,
      rules: [],
    } as ChaosConfig);

    const middleware = chaosMiddleware({ configPath: 'dummy' });
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    const logEvent = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logEvent.fault_injected).toBe(false);
  });

  it('triggers error fault when probability is met', () => {
    (configModule.loadConfig as jest.Mock).mockReturnValue({
      enabled: true,
      rules: [
        {
          route: '/api/*',
          fault_type: 'error',
          probability: 0.6, // random is 0.5, so 0.5 < 0.6 = triggers
          error_status: 503,
          error_body: { msg: 'chaos' }
        }
      ],
    } as ChaosConfig);

    const middleware = chaosMiddleware({ configPath: 'dummy' });
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ msg: 'chaos' });
    expect(next).not.toHaveBeenCalled();
    const logEvent = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logEvent.fault_injected).toBe(true);
    expect(logEvent.fault_type).toBe('error');
  });

  it('does not trigger error when probability is not met', () => {
    (configModule.loadConfig as jest.Mock).mockReturnValue({
      enabled: true,
      rules: [
        {
          route: '/api/*',
          fault_type: 'error',
          probability: 0.4, // random is 0.5, so 0.5 < 0.4 = false
        }
      ],
    } as ChaosConfig);

    const middleware = chaosMiddleware({ configPath: 'dummy' });
    middleware(req as Request, res as Response, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    const logEvent = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logEvent.fault_injected).toBe(false);
  });
});
