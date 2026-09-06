import * as blessed from 'blessed';

let screen: blessed.Widgets.Screen;
let totalRequestsBox: blessed.Widgets.BoxElement;
let faultRateBox: blessed.Widgets.BoxElement;
let faultsByTypeBox: blessed.Widgets.BoxElement;
let recentFaultsTable: blessed.Widgets.ListElement;

let state = {
  totalRequests: 0,
  injectedFaults: 0,
  faultsByType: {
    latency: 0,
    error: 0,
    drop_connection: 0,
  } as Record<string, number>,
  recentFaults: [] as string[]
};

export function startDashboard() {
  screen = blessed.screen({
    smartCSR: true,
    title: 'chaoslib Dashboard'
  });

  // Title Box
  blessed.box({
    parent: screen,
    top: 0,
    left: 'center',
    width: 'shrink',
    height: 3,
    content: '{bold}Chaoslib Live Monitoring{/bold}',
    tags: true,
    style: { fg: 'white' }
  });

  // Total Requests
  totalRequestsBox = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '33%',
    height: 5,
    label: ' Total Requests ',
    content: '0',
    border: { type: 'line' },
    style: { border: { fg: 'blue' }, fg: 'white', bold: true },
    align: 'center',
    valign: 'middle'
  });

  // Fault Rate
  faultRateBox = blessed.box({
    parent: screen,
    top: 3,
    left: '33%',
    width: '34%',
    height: 5,
    label: ' Current Fault Rate ',
    content: '0.00%',
    border: { type: 'line' },
    style: { border: { fg: 'magenta' }, fg: 'white', bold: true },
    align: 'center',
    valign: 'middle'
  });

  // Faults By Type
  faultsByTypeBox = blessed.box({
    parent: screen,
    top: 3,
    left: '67%',
    width: '33%',
    height: 5,
    label: ' Faults by Type ',
    content: 'Latency: 0 | Error: 0 | Drop: 0',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, fg: 'white' },
    align: 'center',
    valign: 'middle'
  });

  // Recent Faults Table
  recentFaultsTable = blessed.list({
    parent: screen,
    top: 8,
    left: 0,
    width: '100%',
    height: '100%-8',
    label: ' Last 10 Injected Faults (Timestamp | Route | Type) ',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' },
      fg: 'white',
      selected: { bg: 'green', fg: 'black' }
    },
    items: []
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
  });

  screen.render();
}

let renderTimeout: NodeJS.Timeout | null = null;

export function updateDashboard(event: any) {
  state.totalRequests++;

  if (event.fault_injected) {
    state.injectedFaults++;
    const type = event.fault_type || 'unknown';
    if (state.faultsByType[type] !== undefined) {
      state.faultsByType[type]++;
    } else {
      state.faultsByType[type] = 1;
    }

    const time = new Date(event.timestamp).toLocaleTimeString();
    const logStr = `${time} | ${event.method} ${event.route} | ${type}`;
    state.recentFaults.unshift(logStr);
    
    if (state.recentFaults.length > 10) {
      state.recentFaults.pop();
    }
  }

  // Update UI components
  totalRequestsBox.setContent(`${state.totalRequests}`);
  
  const rate = state.totalRequests > 0 ? (state.injectedFaults / state.totalRequests) * 100 : 0;
  faultRateBox.setContent(`${rate.toFixed(2)}%`);

  const typeContent = `Latency: ${state.faultsByType.latency} | Error: ${state.faultsByType.error} | Drop: ${state.faultsByType.drop_connection}`;
  faultsByTypeBox.setContent(typeContent);

  recentFaultsTable.setItems(state.recentFaults);

  if (!renderTimeout) {
    renderTimeout = setTimeout(() => {
      try {
        screen.render();
      } catch (err: any) {
        try {
          require('fs').appendFileSync('chaoslib-debug.log', `${new Date().toISOString()} - Render Error: ${err.stack || err.toString()}\n`);
        } catch (e) {}
      } finally {
        renderTimeout = null;
      }
    }, 50);
  }
}
