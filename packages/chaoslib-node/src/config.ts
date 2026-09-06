import * as fs from 'fs';
import * as yaml from 'yaml';
import { ChaosConfig } from './types';

export function loadConfig(configPath: string): ChaosConfig | null {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(fileContents);
    return config as ChaosConfig;
  } catch (error) {
    console.error(`chaoslib: Failed to load config from ${configPath}`, error);
    return null;
  }
}
