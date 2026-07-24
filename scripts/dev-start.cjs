const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const stateDir = path.join(process.cwd(), '.tmp');
const pidFile = path.join(stateDir, 'web-dev.pid');
const logFile = path.join(stateDir, 'web-dev.log');

function ensureStateDir() {
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
}

function isPidRunning(pid) {
  if (!Number.isInteger(pid)) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readExistingPid() {
  if (!fs.existsSync(pidFile)) {
    return null;
  }

  const value = fs.readFileSync(pidFile, 'utf8').trim();
  const pid = Number.parseInt(value, 10);
  return Number.isInteger(pid) ? pid : null;
}

function cleanupPidFile() {
  if (fs.existsSync(pidFile)) {
    fs.rmSync(pidFile, { force: true });
  }
}

const existingPid = readExistingPid();
if (existingPid && isPidRunning(existingPid)) {
  console.log(`[start] Web dev server already running (pid ${existingPid}).`);
  console.log('[start] Open http://localhost:5173 (or the URL shown in that running terminal).');
  process.exit(0);
}

cleanupPidFile();
ensureStateDir();

const out = fs.openSync(logFile, 'a');
console.log('[start] Launching Astro dev server for @venom-atlas/web in background...');
const child = spawn('pnpm --filter @venom-atlas/web dev', {
  cwd: process.cwd(),
  shell: true,
  detached: true,
  stdio: ['ignore', out, out],
  env: process.env,
});

if (typeof child.pid === 'number') {
  fs.writeFileSync(pidFile, String(child.pid));
}
child.unref();

console.log('[start] Started.');
console.log(`[start] PID file: ${path.relative(process.cwd(), pidFile)}`);
console.log(`[start] Log file: ${path.relative(process.cwd(), logFile)}`);
console.log('[start] Open http://localhost:5173 (or the URL shown in the log).');
