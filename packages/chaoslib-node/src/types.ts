export interface ChaosRule {
  route: string;
  fault_type: 'latency' | 'error' | 'drop_connection';
  probability: number;
  latency_ms?: [number, number]; // [min, max]
  error_status?: number;
  error_body?: any;
}

export interface ChaosConfig {
  enabled: boolean;
  rules: ChaosRule[];
}

export interface ChaosMiddlewareOptions {
  configPath: string;
}

export interface ChaosLogEvent {
  timestamp: string;
  route: string;
  method: string;
  fault_injected: boolean;
  fault_type: string | null;
}
