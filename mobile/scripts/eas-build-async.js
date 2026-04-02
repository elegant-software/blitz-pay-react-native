#!/usr/bin/env node

const { spawn } = require('node:child_process');

const DEFAULT_PROFILE = process.env.EAS_PROFILE || 'production';
const DEFAULT_PLATFORMS = ['ios', 'android'];
const DEFAULT_POLL_INTERVAL_MS = Number(process.env.EAS_POLL_INTERVAL_MS || 30000);

function parseArgs(argv) {
  const options = {
    profile: DEFAULT_PROFILE,
    platforms: DEFAULT_PLATFORMS,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
    clearCache: process.env.EAS_CLEAR_CACHE === '1',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--profile' && argv[i + 1]) {
      options.profile = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--platforms' && argv[i + 1]) {
      options.platforms = argv[i + 1]
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (arg === '--poll-ms' && argv[i + 1]) {
      const poll = Number(argv[i + 1]);
      if (!Number.isNaN(poll) && poll > 0) {
        options.pollIntervalMs = poll;
      }
      i += 1;
      continue;
    }
    if (arg === '--clear-cache') {
      options.clearCache = true;
      continue;
    }
  }

  options.platforms = options.platforms.filter((platform) =>
    ['ios', 'android'].includes(platform)
  );
  if (options.platforms.length === 0) {
    options.platforms = DEFAULT_PLATFORMS;
  }
  return options;
}

function parseJsonFromOutput(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('EAS returned empty JSON output.');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue with line-by-line fallback.
  }

  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // Ignore lines that are not JSON payloads.
    }
  }

  throw new Error(`Unable to parse JSON from EAS output:\n${trimmed}`);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      const message = `Failed to start command: ${command} ${args.join(' ')}\n${error.message}`;
      reject(Object.assign(new Error(message), { kind: 'spawn', command, args, stdout, stderr }));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const message = `Command failed: ${command} ${args.join(' ')}\n${stderr.trim() || stdout.trim()}`;
        reject(
          Object.assign(new Error(message), {
            kind: 'exit',
            code,
            command,
            args,
            stdout,
            stderr,
          })
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function isCliInvocationError(error) {
  const output = `${error?.message || ''}\n${error?.stderr || ''}\n${error?.stdout || ''}`;
  return (
    error?.kind === 'spawn' ||
    /could not determine executable to run|command not found|not found|ENOENT/i.test(output)
  );
}

async function runEasJson(args, options = {}) {
  const useNonInteractive = options.nonInteractive !== false;
  const commandSpecs = [
    { command: 'eas', prefix: [] },
    { command: 'npx', prefix: ['eas'] },
  ];

  let lastError = null;
  for (const spec of commandSpecs) {
    const fullArgs = [...spec.prefix, ...args, '--json'];
    if (useNonInteractive) {
      fullArgs.push('--non-interactive');
    }
    try {
      const { stdout } = await runCommand(spec.command, fullArgs);
      return parseJsonFromOutput(stdout);
    } catch (error) {
      lastError = error;
      if (isCliInvocationError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Unable to execute EAS CLI.');
}

async function runBuildViewWithRetry(buildId, attempts = 5, delayMs = 2000) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await runEasJson(['build:view', buildId], { nonInteractive: false });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      await delay(delayMs);
    }
  }
  throw lastError || new Error(`Unable to fetch build:view for ${buildId}.`);
}

function pickBuildObject(payload) {
  if (Array.isArray(payload)) {
    return payload[0];
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data[0];
  }
  return payload;
}

function getBuildId(payload) {
  const build = pickBuildObject(payload);
  return build?.id || build?.buildId || null;
}

function getStatus(payload) {
  const build = pickBuildObject(payload);
  return (build?.status || '').toString().toLowerCase();
}

function getBuildUrl(payload) {
  const build = pickBuildObject(payload);
  return build?.webUrl || build?.url || null;
}

function isFinishedStatus(status) {
  return status === 'finished';
}

function isFailedStatus(status) {
  return status === 'errored' || status === 'canceled' || status === 'cancelled';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerBuild(platform, options) {
  const args = ['build', '--platform', platform, '--profile', options.profile, '--no-wait'];
  if (options.clearCache) {
    args.push('--clear-cache');
  }

  const payload = await runEasJson(args, { nonInteractive: true });
  const build = pickBuildObject(payload);
  const buildId = getBuildId(payload);

  if (!buildId) {
    throw new Error(`[${platform}] Unable to determine build ID from EAS response.`);
  }

  const url = getBuildUrl(payload);
  const status = getStatus(payload) || 'new';
  console.log(`[${platform}] started: ${buildId} (${status})${url ? ` ${url}` : ''}`);

  return {
    platform,
    buildId,
    initialBuild: build,
  };
}

async function pollBuild(buildMeta, options) {
  const { platform, buildId } = buildMeta;
  let lastStatus = '';

  while (true) {
    const payload = await runBuildViewWithRetry(buildId);
    const status = getStatus(payload);
    const url = getBuildUrl(payload);

    if (status && status !== lastStatus) {
      console.log(`[${platform}] status: ${status}${url ? ` ${url}` : ''}`);
      lastStatus = status;
    }

    if (isFinishedStatus(status)) {
      return { platform, payload };
    }

    if (isFailedStatus(status)) {
      throw new Error(`[${platform}] build ${buildId} ended with status "${status}".`);
    }

    await delay(options.pollIntervalMs);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(
    `Starting EAS builds (profile=${options.profile}, platforms=${options.platforms.join(
      ','
    )}, poll=${options.pollIntervalMs}ms)`
  );

  const startedBuilds = await Promise.all(
    options.platforms.map((platform) => triggerBuild(platform, options))
  );

  const results = await Promise.allSettled(
    startedBuilds.map((buildMeta) => pollBuild(buildMeta, options))
  );

  let hasFailure = false;
  for (const result of results) {
    if (result.status === 'rejected') {
      hasFailure = true;
      console.error(result.reason?.message || String(result.reason));
    } else {
      const url = getBuildUrl(result.value.payload);
      console.log(
        `[${result.value.platform}] completed successfully${url ? ` ${url}` : ''}`
      );
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
