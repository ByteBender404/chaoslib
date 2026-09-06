const blessed = require('blessed');
const fs = require('fs');

let screen;
let box;
let list;

function startDashboard() {
  screen = blessed.screen({
    smartCSR: true,
    title: 'chaoslib Dashboard',
  });

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

  box = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '33%',
    height: 5,
    label: ' Total Requests ',
    content: '0',
    border: { type: 'line' },
  });

  list = blessed.list({
    parent: screen,
    top: 8,
    left: 0,
    width: '100%',
    height: '100%-8',
    label: ' Last 10 ',
    border: { type: 'line' },
    items: []
  });

  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
  });

  screen.render();
}

startDashboard();

let count = 0;
setInterval(() => {
  count++;
  box.setContent(`${count}`);
  let items = [];
  for (let i = 0; i < Math.min(count, 10); i++) {
    items.push(`Item ${count - i}`);
  }
  list.setItems(items);
  screen.render();
  if (count > 20) process.exit(0);
}, 200);
