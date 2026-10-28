#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execSync } = require('child_process');

const DiscordIPC = require('../../extension/discord-ipc');
const StatsReader = require('../../extension/stats-reader');

const VERSION = '1.0.0';
const PID_FILE = path.join(os.tmpdir(), 'antigravity-rpc.pid');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

function banner() {
    console.log(`
${colors.magenta}${colors.bright}  █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗  █████╗ ██╗   ██╗██╗████████╗██╗   ██╗
 ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝
 ███████║██╔██╗ ██║   ██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║    ╚████╔╝ 
 ██╔══██║██║╚██╗██║   ██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝██║   ██║     ╚██╔╝  
 ██║  ██║██║ ╚████║   ██║   ██║╚██████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║   ██║      ██║   
 ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝      ╚═╝   ${colors.reset}
 ${colors.cyan}Discord Rich Presence for Antigravity & VS Code${colors.reset} ${colors.gray}v${VERSION}${colors.reset}
`);
}

function showHelp() {
    banner();
    console.log(`
${colors.bright}Usage:${colors.reset}
  ${colors.green}agy-rpc <command> [options]${colors.reset}

${colors.bright}Commands:${colors.reset}
  ${colors.cyan}run${colors.reset}        Start RPC in foreground with live terminal dashboard
  ${colors.cyan}start${colors.reset}      Start RPC daemon in background
  ${colors.cyan}stop${colors.reset}       Stop background RPC daemon
  ${colors.cyan}status${colors.reset}     Print current connection and Antigravity stats
  ${colors.cyan}setup${colors.reset}      Interactive setup & VS Code extension installation
  ${colors.cyan}help${colors.reset}       Display this help message

${colors.bright}Examples:${colors.reset}
  $ agy-rpc run
  $ npx antigravity-rpc status
  $ agy-rpc start
`);
}

function getDaemonPid() {
    if (fs.existsSync(PID_FILE)) {
        try {
            const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
            if (!isNaN(pid)) {
                // Check if process exists
                process.kill(pid, 0);
                return pid;
            }
        } catch (_) {
            fs.unlinkSync(PID_FILE);
        }
    }
    return null;
}

function cmdStatus() {
    banner();
    const reader = new StatsReader();
    const stats = reader.readStats();
    const daemonPid = getDaemonPid();

    console.log(`${colors.bright}System Status:${colors.reset}`);
    console.log(`  Background Daemon: ${daemonPid ? colors.green + '● Running (PID ' + daemonPid + ')' : colors.gray + '○ Stopped'}${colors.reset}`);
    console.log(`  Active Project:    ${colors.yellow}${stats.project}${colors.reset}`);
    console.log(`  Session Title:     ${colors.dim}${stats.title}${colors.reset}`);
    console.log(`  Active Model:      ${colors.cyan}${stats.model}${colors.reset}`);
    console.log(`  Lifetime Tokens:   ${colors.magenta}${stats.lifetimeTokens}${colors.reset}`);
    console.log(`  Today Tokens:      ${colors.green}${stats.todayTokens}${colors.reset}`);
    console.log(`  Coding Streak:     ${colors.yellow}🔥 ${stats.streakDays} day(s)${colors.reset}`);
    console.log(`  Current Mood:      ${colors.bright}${stats.mood}${colors.reset}`);
    console.log(`  Current Action:    ${colors.cyan}${stats.actionText}${colors.reset}`);
    console.log();
}

const ASSET_KEYS = {
    working: 'dino_coding',
    thinking: 'dino_thinking',
    idle: 'dino_sleeping',
    fallback: 'antigravity_logo'
};

function cmdRun() {
    banner();
    console.log(`${colors.dim}Connecting to local Discord client...${colors.reset}`);

    const clientId = '1564990931835297822';
    const reader = new StatsReader();
    const ipc = new DiscordIPC(clientId);

    let frame = 0;
    const startTime = Math.floor(Date.now() / 1000);

    ipc.on('ready', (user) => {
        if (process.stdout.isTTY) {
            console.clear();
            banner();
        }
        console.log(`${colors.green}✔ Connected to Discord!${colors.reset} User: ${colors.bright}${user.username || 'Active'}${colors.reset}`);
        console.log(`${colors.gray}Press Ctrl+C to stop.${colors.reset}\n`);

        const tick = () => {
            const stats = reader.readStats();
            frame = (frame + 1) % 4;

            let largeImg = ASSET_KEYS.idle;
            let largeText = `💤 Dino Resting · ${stats.model}`;

            if (stats.isRunning) {
                if (stats.mood === '🧠 Thinking') {
                    largeImg = ASSET_KEYS.thinking;
                    largeText = `🧠 Dino Reasoning · ${stats.model}`;
                } else {
                    largeImg = ASSET_KEYS.working;
                    largeText = `💻 Dino Coding · ${stats.project}`;
                }
            } else {
                largeImg = ASSET_KEYS.idle;
                largeText = `💤 Zero-G Dino Sleeping · ${stats.lifetimeTokens} tokens`;
            }

            let details = stats.actionText || '⚡ Pair programming';
            let state = `📁 ${stats.project} · 🔥 ${stats.streakDays}d streak`;

            if (!stats.isRunning) {
                details = '💤 Resting / Standing by';
                state = `📁 ${stats.project} · 💎 ${stats.lifetimeTokens}`;
            } else if (frame === 1) {
                details = `🧠 Reasoning · ${stats.model}`;
                state = `📊 Tokens: ${stats.todayTokens} today · ${stats.lifetimeTokens}`;
            } else if (frame === 2 && stats.activeFile) {
                details = `📝 ${stats.activeFile} (${stats.activeLang})`;
                state = `📁 ${stats.project} · Working on code`;
            }

            ipc.setActivity({
                details: details.slice(0, 128),
                state: state.slice(0, 128),
                timestamps: { start: startTime },
                assets: {
                    large_image: largeImg,
                    large_text: largeText.slice(0, 128),
                    small_image: 'robot',
                    small_text: `${stats.mood} · 🔥 ${stats.streakDays}d streak`
                },
                buttons: [
                    { label: 'Antigravity RPC', url: 'https://antigravity-rpc.com' },
                    { label: 'GitHub', url: 'https://github.com/A-Gift-Of-Flame' }
                ],
                instance: false
            });

            // Live terminal dashboard if TTY
            if (process.stdout.isTTY) {
                process.stdout.write(
                    `\r${colors.cyan}[${new Date().toLocaleTimeString()}]${colors.reset} ` +
                    `${colors.magenta}${stats.lifetimeTokens}${colors.reset} tokens | ` +
                    `Streak: ${colors.yellow}${stats.streakDays}d${colors.reset} | ` +
                    `${colors.green}${details}${colors.reset}    `
                );
            }
        };

        tick();
        setInterval(tick, 3000);
    });

    ipc.on('error', (err) => {
        if (process.stdout.isTTY) {
            console.error(`${colors.yellow}[Antigravity RPC] Waiting for Discord... (${err.message})${colors.reset}`);
        }
        setTimeout(() => ipc.connect(), 5000);
    });

    ipc.on('disconnected', () => {
        if (process.stdout.isTTY) {
            console.log(`${colors.yellow}[Antigravity RPC] Discord disconnected, retrying in 5s...${colors.reset}`);
        }
        setTimeout(() => ipc.connect(), 5000);
    });

    // Keep process alive indefinitely
    setInterval(() => {}, 1 << 30);

    ipc.connect();
}

function cmdStart() {
    const scriptPath = path.resolve(__dirname, 'agy-rpc.js');
    
    if (process.platform === 'win32') {
        try {
            const escapedNode = process.execPath.replace(/'/g, "''");
            const escapedScript = scriptPath.replace(/'/g, "''");
            const cmd = `Start-Process -FilePath '${escapedNode}' -ArgumentList @('${escapedScript}', 'run') -WindowStyle Hidden`;
            execSync(`powershell -NoProfile -Command "${cmd}"`);
            console.log(`${colors.green}✔ Antigravity RPC started in background.${colors.reset}`);
        } catch (e) {
            console.error(`${colors.red}Failed to start daemon:${colors.reset}`, e.message);
        }
    } else {
        const child = spawn(process.execPath, [scriptPath, 'run'], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        fs.writeFileSync(PID_FILE, child.pid.toString(), 'utf8');
        console.log(`${colors.green}✔ Antigravity RPC started in background (PID: ${child.pid})${colors.reset}`);
    }
}

function cmdStop() {
    if (process.platform === 'win32') {
        try {
            execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'agy-rpc' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`, { stdio: 'ignore' });
            if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
            console.log(`${colors.green}✔ Antigravity RPC stopped.${colors.reset}`);
        } catch (e) {
            console.log(`${colors.gray}No running background Antigravity RPC found.${colors.reset}`);
        }
    } else {
        const pid = getDaemonPid();
        if (!pid) {
            console.log(`${colors.gray}No running background Antigravity RPC found.${colors.reset}`);
            return;
        }
        try {
            process.kill(pid);
            if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
            console.log(`${colors.green}✔ Antigravity RPC daemon stopped.${colors.reset}`);
        } catch (e) {
            console.error(`${colors.red}Failed to stop PID ${pid}:${colors.reset}`, e.message);
        }
    }
}

function cmdSetup() {
    banner();
    console.log(`${colors.bright}Setting up Antigravity Discord RPC...${colors.reset}\n`);

    // 1. Install extension into VS Code
    const extSrc = path.resolve(__dirname, '../../extension');
    const extDest = path.join(os.homedir(), '.vscode', 'extensions', 'antigravity.antigravity-rpc-1.0.0');

    try {
        console.log(`${colors.cyan}[1/2] Installing VS Code extension...${colors.reset}`);
        fs.mkdirSync(extDest, { recursive: true });
        
        const filesToCopy = ['package.json', 'extension.js', 'discord-ipc.js', 'stats-reader.js', 'icon.png'];
        for (const file of filesToCopy) {
            const src = path.join(extSrc, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, path.join(extDest, file));
            }
        }
        console.log(`${colors.green}✔ VS Code extension installed to:${colors.reset} ${extDest}`);
    } catch (err) {
        console.error(`${colors.red}Failed to copy extension:${colors.reset}`, err.message);
    }

    // 2. Test Discord connection
    console.log(`\n${colors.cyan}[2/2] Testing Discord connection...${colors.reset}`);
    const ipc = new DiscordIPC();
    ipc.on('ready', (user) => {
        console.log(`${colors.green}✔ Discord RPC connected successfully! User: ${user.username}${colors.reset}`);
        ipc.disconnect();
        console.log(`\n${colors.bright}${colors.green}Setup complete! Reload VS Code or run 'agy-rpc run' to start.${colors.reset}\n`);
        process.exit(0);
    });
    ipc.on('error', (err) => {
        console.log(`${colors.yellow}⚠ Could not connect to Discord (${err.message}). Make sure Discord desktop is running.${colors.reset}`);
        process.exit(0);
    });
    ipc.connect();
}

const args = process.argv.slice(2);
const command = args[0] || 'run';

switch (command.toLowerCase()) {
    case 'run':
        cmdRun();
        break;
    case 'start':
        cmdStart();
        break;
    case 'stop':
        cmdStop();
        break;
    case 'status':
        cmdStatus();
        break;
    case 'setup':
    case 'install':
        cmdSetup();
        break;
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;
    default:
        console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
        showHelp();
        process.exit(1);
}
