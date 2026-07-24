const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const stateDir = path.join(process.cwd(), '.tmp');
const pidFile = path.join(stateDir, 'web-dev.pid');

function safeKillPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function stopFromPidFile() {
  if (!fs.existsSync(pidFile)) {
    return false;
  }

  const value = fs.readFileSync(pidFile, 'utf8').trim();
  const pid = Number.parseInt(value, 10);

  fs.rmSync(pidFile, { force: true });

  if (!Number.isInteger(pid)) {
    return false;
  }

  const stopped = safeKillPid(pid);
  if (stopped) {
    console.log(`[stop] Stopped tracked web dev process (pid ${pid}).`);
  }

  return stopped;
}

function killByPorts() {
  const ports = [5173, 5174, 5175, 5176];

  if (process.platform === 'win32') {
    const list = ports.join(',');
    const cmd = [
      '$ports = @(' + list + ')',
      ';',
      'Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue |',
      'Select-Object -ExpandProperty OwningProcess -Unique |',
      'ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }',
      ';',
      'exit 0',
    ].join(' ');

    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`, {
      stdio: 'ignore',
    });
    return;
  }

  for (const port of ports) {
    try {
      const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const pids = output
        .split(/\r?\n/)
        .map((entry) => Number.parseInt(entry, 10))
        .filter((entry) => Number.isInteger(entry));

      for (const pid of pids) {
        safeKillPid(pid);
      }
    } catch {
      // No listener for this port.
    }
  }
}

let stopped = false;

try {
  stopped = stopFromPidFile();
} catch {
  // Continue to fallback cleanup.
}

try {
  killByPorts();
  console.log('[stop] Cleared listeners for common Astro dev ports (5173-5176).');
} catch (error) {
  console.warn(`[stop] Port cleanup warning: ${error.message}`);
}

if (!stopped) {
  console.log('[stop] No tracked dev process was found.');
}
