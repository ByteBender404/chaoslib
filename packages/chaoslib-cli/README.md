# chaoslib-cli

Live terminal dashboard for monitoring chaoslib injected faults.

## Installation

```bash
npm install -g chaoslib-cli
# or use via npx
npx chaoslib watch --log ./chaos.log
```

## Usage

Ensure your API (Node or Python) is piping its stdout to a log file, for example:

```bash
node app.js > chaos.log
```

Then run the dashboard:

```bash
chaoslib watch --log ./chaos.log
```
