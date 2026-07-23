const http = require('http');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 3001;
const HEALTH_PATH = process.env.DEV_GUARD_HEALTH_PATH || '/health';

function requestHealth(timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: HEALTH_PATH,
        method: 'GET',
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ ok: res.statusCode === 200, body });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, timeout: true });
    });

    req.on('error', () => {
      resolve({ ok: false });
    });

    req.end();
  });
}

function startApiServer() {
  const child = spawn('pnpm', ['dev:api:raw'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code == null ? 1 : code);
  });
}

(async () => {
  if (process.env.FORCE_DEV === '1') {
    console.log('[dev-guard] FORCE_DEV=1 set; starting API server.');
    startApiServer();
    return;
  }

  const health = await requestHealth();
  if (health.ok) {
    console.log(
      `[dev-guard] API already appears to be running on port ${PORT} (${HEALTH_PATH} responded).`
    );
    console.log('[dev-guard] Not starting another API server.');
    console.log('[dev-guard] Set FORCE_DEV=1 if you intentionally want to start anyway.');
    process.exit(0);
    return;
  }

  console.log(`[dev-guard] No healthy API detected on port ${PORT}; starting API server.`);
  startApiServer();
})();
