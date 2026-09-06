#!/usr/bin/env node

import { program } from 'commander';
import { Tail } from 'tail';
import { startDashboard, updateDashboard } from './dashboard';
import * as fs from 'fs';

program
  .name('chaoslib')
  .description('Chaos engineering toolkit CLI')
  .version('1.0.0');

function logError(msg: string, err?: any) {
  try {
    const errStr = err ? (err.stack || err.toString()) : '';
    fs.appendFileSync('chaoslib-debug.log', `${new Date().toISOString()} - ${msg} ${errStr}\n`);
  } catch (e) {}
}

program
  .command('watch')
  .description('Watch chaos logs and display a live dashboard')
  .requiredOption('-l, --log <path>', 'path to the chaos log file')
  .action((options) => {
    if (!fs.existsSync(options.log)) {
      // Create empty log file if it doesn't exist to allow tailing
      fs.writeFileSync(options.log, '');
    }

    startDashboard();

    const tail = new Tail(options.log, { 
      fromBeginning: true,
      useWatchFile: true // Prevents silent file watcher drop-offs on Windows
    });

    tail.on('line', (data: string) => {
      try {
        const event = JSON.parse(data);
        if (event.timestamp && event.route) {
          updateDashboard(event);
        }
      } catch (err) {
        // Ignore lines that aren't valid JSON, but log parsing errors just in case
        logError('Failed to parse line or update dashboard', err);
      }
    });

    tail.on('error', (error: any) => {
      logError('Tail ERROR:', error);
    });
  });

program.parse();
