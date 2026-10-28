const vscode = require('vscode');
const path = require('path');
const DiscordIPC = require('./discord-ipc');
const StatsReader = require('./stats-reader');

let ipcClient = null;
let statsReader = null;
let updateIntervalTimer = null;
let statusBarItem = null;
let sessionStartTime = Math.floor(Date.now() / 1000);
let currentFrame = 0;

function getConfig() {
    return vscode.workspace.getConfiguration('antigravityRpc');
}

function getActiveEditorInfo() {
    const editor = vscode.window.activeTextEditor;
    let filename = '';
    let projectName = '';

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        projectName = vscode.workspace.workspaceFolders[0].name;
    }

    if (editor && editor.document) {
        filename = path.basename(editor.document.fileName);
    }

    return { filename, projectName };
}

// Discord Art Asset keys (uploaded in Discord Developer Portal -> Art Assets)
// Fallback to 'antigravity_logo' if custom keys are not yet uploaded
const ASSET_KEYS = {
    working: 'dino_coding',
    thinking: 'dino_thinking',
    idle: 'dino_sleeping',
    fallback: 'antigravity_logo'
};

function buildPresenceActivity(stats, config) {
    const animationMode = config.get('animationMode', true);
    const customFlexTokens = config.get('customFlexTokens', '').trim();
    const tokenDisplay = customFlexTokens || stats.lifetimeTokens;
    const model = stats.model || 'Gemini 3.8 Flash';
    const project = stats.project || 'Antigravity Workspace';
    const streak = stats.streakDays || 1;
    const todayTokens = stats.todayTokens || '+0';

    // Status image selection
    let largeImage = ASSET_KEYS.idle;
    let largeImageText = `💤 Zero-G Dino Resting · ${model}`;
    let smallImage = 'robot';
    let smallImageText = `🔥 ${streak}d streak`;

    if (stats.isRunning) {
        if (stats.mood === '🧠 Thinking') {
            largeImage = ASSET_KEYS.thinking;
            largeImageText = `🧠 Dino Reasoning · ${model}`;
        } else {
            largeImage = ASSET_KEYS.working;
            largeImageText = `💻 Dino Coding · ${project}`;
        }
    } else {
        largeImage = ASSET_KEYS.idle;
        largeImageText = `💤 Zero-G Dino Sleeping · ${tokenDisplay} tokens`;
    }

    // If configured to use classic rainbow arch
    if (config.get('useClassicLogo', false)) {
        largeImage = ASSET_KEYS.fallback;
    }

    let details = '';
    let state = '';

    if (animationMode) {
        if (!stats.isRunning) {
            // Idle rotation
            if (currentFrame % 2 === 0) {
                details = '💤 Resting / Standing by';
                state = `📁 ${project} · 🔥 ${streak}d streak`;
            } else {
                details = `💎 ${tokenDisplay} tokens (${todayTokens} today)`;
                state = `⚡ ${model} · Sleeping`;
            }
        } else {
            // Active working rotation
            if (currentFrame === 0) {
                details = stats.actionText || '⚡ Pair programming';
                state = `📁 ${project} · 🔥 ${streak}d streak`;
            } else if (currentFrame === 1) {
                details = `🧠 Reasoning · ${model}`;
                state = `📊 Tokens: ${todayTokens} today · ${tokenDisplay}`;
            } else if (currentFrame === 2 && stats.activeFile) {
                details = `📝 ${stats.activeFile} (${stats.activeLang})`;
                state = `📁 ${project} · Working on code`;
            } else {
                details = `⚡ ${model} · High Latency`;
                state = `🔥 ${streak}d streak · ${todayTokens} today`;
            }
        }
    } else {
        details = stats.isRunning ? (stats.actionText || `⚡ Working · ${model}`) : '💤 Resting / Standing by';
        state = `📁 ${project} · ${tokenDisplay} (${todayTokens})`;
    }

    const activity = {
        details: details.slice(0, 128),
        state: state.slice(0, 128),
        timestamps: {
            start: sessionStartTime
        },
        assets: {
            large_image: largeImage,
            large_text: largeImageText.slice(0, 128),
            small_image: smallImage,
            small_text: smallImageText.slice(0, 128)
        },
        instance: false
    };

    // Buttons
    const buttons = [];
    const btn1Label = config.get('button1Label', 'Antigravity AI').trim();
    const btn1Url = config.get('button1Url', 'https://github.com/google-deepmind').trim();
    const btn2Label = config.get('button2Label', 'Discord RPC').trim();
    const btn2Url = config.get('button2Url', 'https://antigravity-rpc.com').trim();

    if (btn1Label && btn1Url) {
        buttons.push({ label: btn1Label.slice(0, 32), url: btn1Url });
    }
    if (btn2Label && btn2Url) {
        buttons.push({ label: btn2Label.slice(0, 32), url: btn2Url });
    }

    if (buttons.length > 0) {
        activity.buttons = buttons;
    }

    return activity;
}

function updatePresence() {
    if (!ipcClient || !ipcClient.isConnected) return;

    const config = getConfig();
    if (!config.get('enabled', true)) {
        ipcClient.clearActivity();
        updateStatusBar(false);
        return;
    }

    const activeInfo = getActiveEditorInfo();
    const stats = statsReader.readStats(activeInfo);

    const activity = buildPresenceActivity(stats, config);
    ipcClient.setActivity(activity);

    currentFrame = (currentFrame + 1) % 4;
    updateStatusBar(true, stats);
}

function updateStatusBar(connected, stats = null) {
    if (!statusBarItem) return;

    if (connected) {
        statusBarItem.text = `$(broadcast) Antigravity RPC: Active`;
        if (stats) {
            statusBarItem.tooltip = `Antigravity Discord RPC\nTokens: ${stats.lifetimeTokens} (${stats.todayTokens} today)\nStreak: ${stats.streakDays} days\nModel: ${stats.model}\nAction: ${stats.actionText}`;
        } else {
            statusBarItem.tooltip = `Antigravity Discord RPC is connected and active`;
        }
        statusBarItem.show();
    } else {
        statusBarItem.text = `$(circle-slash) Antigravity RPC: Offline`;
        statusBarItem.tooltip = `Antigravity Discord RPC is disconnected. Click to reconnect.`;
        statusBarItem.show();
    }
}

function startRPC() {
    const config = getConfig();
    const clientId = config.get('clientId', '1564990931835297822').trim() || '1564990931835297822';

    if (ipcClient) {
        ipcClient.disconnect();
    }

    ipcClient = new DiscordIPC(clientId);

    ipcClient.on('ready', (user) => {
        console.log('[Antigravity RPC] Connected to Discord as', user.username);
        updateStatusBar(true);
        updatePresence();

        if (updateIntervalTimer) clearInterval(updateIntervalTimer);
        const intervalSec = Math.max(2, config.get('updateInterval', 3));
        updateIntervalTimer = setInterval(updatePresence, intervalSec * 1000);
    });

    ipcClient.on('error', (err) => {
        // Silent reconnect attempt
        updateStatusBar(false);
    });

    ipcClient.on('disconnected', () => {
        updateStatusBar(false);
        // Attempt reconnection after 10s
        setTimeout(() => {
            if (getConfig().get('enabled', true)) {
                startRPC();
            }
        }, 10000);
    });

    ipcClient.connect();
}

function activate(context) {
    console.log('[Antigravity RPC] Extension activating...');
    statsReader = new StatsReader();
    sessionStartTime = Math.floor(Date.now() / 1000);

    // Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'antigravity-rpc.status';
    context.subscriptions.push(statusBarItem);

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('antigravity-rpc.enable', () => {
            getConfig().update('enabled', true, vscode.ConfigurationTarget.Global);
            startRPC();
            vscode.window.showInformationMessage('Antigravity Discord RPC enabled!');
        }),
        vscode.commands.registerCommand('antigravity-rpc.disable', () => {
            getConfig().update('enabled', false, vscode.ConfigurationTarget.Global);
            if (ipcClient) ipcClient.disconnect();
            if (updateIntervalTimer) clearInterval(updateIntervalTimer);
            updateStatusBar(false);
            vscode.window.showInformationMessage('Antigravity Discord RPC disabled.');
        }),
        vscode.commands.registerCommand('antigravity-rpc.status', () => {
            const stats = statsReader.readStats(getActiveEditorInfo());
            const statusMsg = `🚀 Antigravity Stats:
• Lifetime Tokens: ${stats.lifetimeTokens}
• Today: ${stats.todayTokens}
• Coding Streak: ${stats.streakDays} days
• Active Model: ${stats.model}
• Current Action: ${stats.actionText}
• Discord RPC: ${ipcClient && ipcClient.isConnected ? 'Connected 🟢' : 'Disconnected 🔴'}`;

            vscode.window.showInformationMessage(statusMsg, 'Toggle Animation', 'Open Website').then(selection => {
                if (selection === 'Toggle Animation') {
                    const current = getConfig().get('animationMode', true);
                    getConfig().update('animationMode', !current, vscode.ConfigurationTarget.Global);
                } else if (selection === 'Open Website') {
                    vscode.env.openExternal(vscode.Uri.parse('https://antigravity-rpc.com'));
                }
            });
        })
    );

    // Listen for file changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            updatePresence();
        })
    );

    // Listen for config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('antigravityRpc')) {
                const config = getConfig();
                if (config.get('enabled', true)) {
                    startRPC();
                } else {
                    if (ipcClient) ipcClient.disconnect();
                    if (updateIntervalTimer) clearInterval(updateIntervalTimer);
                    updateStatusBar(false);
                }
            }
        })
    );

    // Auto-start if enabled
    if (getConfig().get('enabled', true)) {
        startRPC();
    }
}

function deactivate() {
    if (updateIntervalTimer) {
        clearInterval(updateIntervalTimer);
        updateIntervalTimer = null;
    }
    if (ipcClient) {
        ipcClient.disconnect();
        ipcClient = null;
    }
}

module.exports = {
    activate,
    deactivate
};

