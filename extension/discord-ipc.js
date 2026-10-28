const net = require('net');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');

const OPCODES = {
    HANDSHAKE: 0,
    FRAME: 1,
    CLOSE: 2,
    PING: 3,
    PONG: 4
};

function getPipePath(id = 0) {
    if (process.platform === 'win32') {
        return `\\\\?\\pipe\\discord-ipc-${id}`;
    }
    const envDirs = [
        process.env.XDG_RUNTIME_DIR,
        process.env.TMPDIR,
        process.env.TMP,
        process.env.TEMP,
        '/tmp'
    ].filter(Boolean);

    for (const dir of envDirs) {
        const pipePath = path.join(dir, `discord-ipc-${id}`);
        try {
            return pipePath;
        } catch (_) {}
    }
    return `/tmp/discord-ipc-${id}`;
}

class DiscordIPC extends EventEmitter {
    constructor(clientId) {
        super();
        this.clientId = clientId || '1440730997460172810';
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.buffer = Buffer.alloc(0);
        this.pipeIndex = 0;
    }

    encode(op, data) {
        const json = JSON.stringify(data);
        const len = Buffer.byteLength(json, 'utf8');
        const packet = Buffer.alloc(8 + len);
        packet.writeInt32LE(op, 0);
        packet.writeInt32LE(len, 4);
        packet.write(json, 8, len, 'utf8');
        return packet;
    }

    connect() {
        if (this.isConnected || this.isConnecting) return;
        this.isConnecting = true;
        this.pipeIndex = 0;
        this._tryConnect();
    }

    _tryConnect() {
        if (this.pipeIndex > 9) {
            this.isConnecting = false;
            this.emit('error', new Error('Could not find active Discord IPC pipe (0-9)'));
            return;
        }

        const pipePath = getPipePath(this.pipeIndex);
        const socket = net.createConnection(pipePath);

        const onError = (err) => {
            socket.removeAllListeners();
            socket.destroy();
            this.pipeIndex++;
            this._tryConnect();
        };

        socket.once('error', onError);

        socket.once('connect', () => {
            socket.removeListener('error', onError);
            this.socket = socket;
            this.buffer = Buffer.alloc(0);

            this.socket.on('data', (chunk) => this._onData(chunk));
            this.socket.on('close', () => this._onClose());
            this.socket.on('error', (err) => this.emit('error', err));

            // Send handshake
            const handshake = this.encode(OPCODES.HANDSHAKE, {
                v: 1,
                client_id: this.clientId
            });
            this.socket.write(handshake);
        });
    }

    _onData(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        while (this.buffer.length >= 8) {
            const op = this.buffer.readInt32LE(0);
            const len = this.buffer.readInt32LE(4);

            if (this.buffer.length < 8 + len) {
                break; // Wait for full payload
            }

            const rawData = this.buffer.subarray(8, 8 + len).toString('utf8');
            this.buffer = this.buffer.subarray(8 + len);

            try {
                const parsed = JSON.parse(rawData);
                this._handleMessage(op, parsed);
            } catch (err) {
                this.emit('error', err);
            }
        }
    }

    _handleMessage(op, data) {
        if (op === OPCODES.FRAME) {
            if (data.cmd === 'DISPATCH' && data.evt === 'READY') {
                this.isConnected = true;
                this.isConnecting = false;
                this.emit('ready', data.data);
            } else if (data.evt === 'ERROR') {
                this.emit('error', new Error(data.data?.message || 'Discord RPC Error'));
            }
        } else if (op === OPCODES.PING) {
            if (this.socket && this.socket.writable) {
                this.socket.write(this.encode(OPCODES.PONG, data));
            }
        } else if (op === OPCODES.CLOSE) {
            this.disconnect();
        }
    }

    setActivity(activity) {
        if (!this.isConnected || !this.socket || !this.socket.writable) {
            return false;
        }

        const payload = {
            cmd: 'SET_ACTIVITY',
            args: {
                pid: process.pid,
                activity: activity
            },
            nonce: Math.random().toString(36).substring(2, 15)
        };

        const packet = this.encode(OPCODES.FRAME, payload);
        this.socket.write(packet);
        return true;
    }

    clearActivity() {
        return this.setActivity(null);
    }

    _onClose() {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.isConnecting = false;
        this.socket = null;
        if (wasConnected) {
            this.emit('disconnected');
        }
    }

    disconnect() {
        if (this.socket) {
            try {
                this.clearActivity();
                this.socket.destroy();
            } catch (_) {}
            this.socket = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
    }
}

module.exports = DiscordIPC;

