const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function getAntigravityBaseDir() {
    return path.join(os.homedir(), '.gemini', 'antigravity');
}

function getFileLanguage(filename) {
    if (!filename) return 'Code';
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.jsx': 'React',
        '.tsx': 'React TS',
        '.py': 'Python',
        '.cpp': 'C++',
        '.c': 'C',
        '.h': 'C/C++ Header',
        '.hpp': 'C++',
        '.rs': 'Rust',
        '.go': 'Go',
        '.java': 'Java',
        '.cs': 'C#',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.json': 'JSON',
        '.md': 'Markdown',
        '.vue': 'Vue',
        '.svelte': 'Svelte',
        '.sql': 'SQL',
        '.sh': 'Shell',
        '.ps1': 'PowerShell'
    };
    return map[ext] || (ext ? ext.replace('.', '').toUpperCase() : 'Code');
}

function formatTokens(count) {
    if (count >= 1_000_000_000) {
        return (count / 1_000_000_000).toFixed(1) + 'B';
    }
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1) + 'M';
    }
    if (count >= 1_000) {
        return Math.floor(count / 1000) + 'k';
    }
    return count.toString();
}

class StatsReader {
    constructor() {
        this.baseDir = getAntigravityBaseDir();
        this.dbPath = path.join(this.baseDir, 'conversation_summaries.db');
        this.useSqliteNative = false;

        try {
            const { DatabaseSync } = require('node:sqlite');
            if (DatabaseSync) {
                this.useSqliteNative = true;
            }
        } catch (_) {
            this.useSqliteNative = false;
        }
    }

    readStats(activeEditorInfo = null) {
        const stats = {
            isRunning: true,
            convoId: '',
            title: 'Antigravity Session',
            project: 'Workspace',
            totalSteps: 0,
            lifetimeTokens: '2.7B',
            todayTokens: '+1.3B',
            streakDays: 1,
            model: 'Gemini 3.8 Flash',
            mood: '⚡ Active',
            actionText: 'Pair programming with Antigravity',
            activeFile: '',
            activeLang: ''
        };

        if (activeEditorInfo && activeEditorInfo.filename) {
            stats.activeFile = activeEditorInfo.filename;
            stats.activeLang = getFileLanguage(activeEditorInfo.filename);
            if (activeEditorInfo.projectName) {
                stats.project = activeEditorInfo.projectName;
            }
        }

        try {
            if (fs.existsSync(this.dbPath)) {
                if (this.useSqliteNative) {
                    this._queryWithNativeSqlite(stats);
                } else {
                    this._queryWithPythonFallback(stats);
                }
            }
        } catch (err) {
            // fallback silently with defaults
        }

        // Check active transcript for current agent tool or state
        if (stats.convoId) {
            this._checkTranscript(stats);
        }

        return stats;
    }

    _queryWithNativeSqlite(stats) {
        const { DatabaseSync } = require('node:sqlite');
        const db = new DatabaseSync(this.dbPath, { readOnly: true });
        try {
            const latest = db.prepare(`
                SELECT conversation_id, title, project_id, workspace_uris, not_fully_idle, status 
                FROM conversation_summaries 
                ORDER BY last_modified_time DESC LIMIT 1
            `).get();

            if (latest) {
                stats.convoId = latest.conversation_id || '';
                stats.title = latest.title || stats.title;
                const isWorking = (latest.not_fully_idle === 1 || latest.status === 'CASCADE_RUN_STATUS_RUNNING');
                stats.isRunning = isWorking;

                if (!stats.project || stats.project === 'Workspace') {
                    if (latest.workspace_uris) {
                        try {
                            const uris = JSON.parse(latest.workspace_uris);
                            if (uris && uris.length > 0) {
                                const clean = uris[0].replace('file:///', '').replace('%3A', ':').replace(/%20/g, ' ');
                                stats.project = path.basename(path.normalize(clean));
                            }
                        } catch (_) {}
                    }
                }
            }

            const total = db.prepare('SELECT SUM(step_count) as total FROM conversation_summaries').get();
            const totalSteps = (total && total.total) || 0;
            stats.totalSteps = totalSteps;
            stats.lifetimeTokens = formatTokens(totalSteps * 45000);

            // Today's steps
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayRow = db.prepare('SELECT SUM(step_count) as today FROM conversation_summaries WHERE last_modified_time LIKE ?').get(todayStr + '%');
            const todaySteps = (todayRow && todayRow.today) || 0;
            stats.todayTokens = '+' + formatTokens(todaySteps * 45000);

            // Streak calculation
            const rows = db.prepare('SELECT DISTINCT substr(last_modified_time, 1, 10) as day FROM conversation_summaries WHERE last_modified_time IS NOT NULL ORDER BY day DESC').all();
            const dateSet = new Set(rows.map(r => r.day));
            let streak = 0;
            let check = new Date();
            let checkStr = check.toISOString().slice(0, 10);
            if (!dateSet.has(checkStr)) {
                check.setDate(check.getDate() - 1);
                checkStr = check.toISOString().slice(0, 10);
            }
            while (dateSet.has(checkStr)) {
                streak++;
                check.setDate(check.getDate() - 1);
                checkStr = check.toISOString().slice(0, 10);
            }
            stats.streakDays = Math.max(1, streak);
        } finally {
            db.close();
        }
    }

    _queryWithPythonFallback(stats) {
        const pyScript = path.join(this.baseDir, 'get_stats.py');
        if (fs.existsSync(pyScript)) {
            const out = execFileSync('python', [pyScript], { encoding: 'utf8', timeout: 3000 });
            const data = JSON.parse(out.trim());
            if (data) {
                stats.convoId = data.convo_id || stats.convoId;
                stats.title = data.title || stats.title;
                stats.project = data.project || stats.project;
                stats.lifetimeTokens = data.lifetime_tokens || stats.lifetimeTokens;
                stats.todayTokens = data.today_tokens || stats.todayTokens;
                stats.streakDays = data.streak_days || stats.streakDays;
                stats.model = data.model || stats.model;
                stats.isRunning = data.is_running;
                if (data.action_text) stats.actionText = data.action_text;
            }
        }
    }

    _checkTranscript(stats) {
        const transcriptPath = path.join(this.baseDir, 'brain', stats.convoId, '.system_generated', 'logs', 'transcript.jsonl');
        if (!fs.existsSync(transcriptPath)) return;

        try {
            const content = fs.readFileSync(transcriptPath, 'utf8');
            const lines = content.trim().split('\n');
            if (lines.length === 0) return;

            const last = JSON.parse(lines[lines.length - 1]);
            const tc = last.tool_calls;
            if (tc && tc.length > 0) {
                const tool = tc[0];
                const name = tool.name || '';
                let args = tool.args || {};
                if (typeof args === 'string') {
                    try { args = JSON.parse(args); } catch (_) {}
                }

                if (name.includes('file')) {
                    const target = args.TargetFile || args.AbsolutePath || args.Path || '';
                    if (target) {
                        const fname = path.basename(target.replace(/\\/g, '/'));
                        const lang = getFileLanguage(fname);
                        stats.actionText = `📝 Editing ${fname} (${lang})`;
                        stats.mood = '💻 Coding';
                    } else {
                        stats.actionText = '📝 Editing code';
                        stats.mood = '💻 Coding';
                    }
                } else if (name.includes('command')) {
                    const cmd = (args.CommandLine || '').toLowerCase();
                    if (/build|compile|test|npm|cargo|pip|cmake/.test(cmd)) {
                        stats.actionText = '🔨 Running build & tests';
                    } else {
                        stats.actionText = '🐚 Executing command';
                    }
                    stats.mood = '💻 Terminal';
                } else if (name.includes('web') || name.includes('search')) {
                    stats.actionText = '🔍 Researching documentation';
                    stats.mood = '🔍 Research';
                }
            } else if (last.type === 'PLANNER_RESPONSE' || last.thinking) {
                stats.actionText = `🧠 Reasoning (${stats.model})`;
                stats.mood = '🧠 Thinking';
            }
        } catch (_) {}
    }
}

module.exports = StatsReader;

