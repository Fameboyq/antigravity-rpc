// Commands per tab
const commands = {
  ps: 'irm https://antigravity-rpc.com/install.ps1 | iex',
  bash: 'curl -fsSL https://antigravity-rpc.com/install.sh | bash',
  npx: 'npx antigravity-rpc setup'
};

// State
let currentTab = 'ps';
let timerSeconds = 165;
let animationEnabled = true;
let animInterval = null;
let animStep = 0;

// Elements
const cmdDisplay = document.getElementById('cmdDisplay');
const copyBtn = document.getElementById('copyBtn');
const copyText = document.getElementById('copyText');
const cardDetails = document.getElementById('cardDetails');
const cardState = document.getElementById('cardState');
const cardTimer = document.getElementById('cardTimer');
const projectInput = document.getElementById('projectInput');
const modelInput = document.getElementById('modelInput');
const animToggle = document.getElementById('animToggle');

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    cmdDisplay.textContent = commands[currentTab] || commands.ps;
  });
});

// Copy button
copyBtn.addEventListener('click', () => {
  const textToCopy = cmdDisplay.textContent;
  navigator.clipboard.writeText(textToCopy).then(() => {
    copyBtn.classList.add('copied');
    copyText.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyText.textContent = 'Copy';
    }, 2000);
  });
});

// Real-time Elapsed Timer
function updateTimer() {
  timerSeconds++;
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} elapsed`;
  cardTimer.textContent = str;
}
setInterval(updateTimer, 1000);

// Simulator modes
const modes = {
  thinking: {
    details: (model) => `🧠 Reasoning (${model})`,
    state: (project) => `📁 ${project} · 🔥 3d streak`
  },
  coding: {
    details: () => `📝 Editing stats-reader.js (JavaScript)`,
    state: (project) => `📁 ${project} · Working on code`
  },
  terminal: {
    details: () => `🐚 Executing 'npm test'`,
    state: (project) => `📁 ${project} · 🔨 Running build`
  },
  flex: {
    details: () => `💎 2.7B Lifetime Tokens · +1.3B today`,
    state: () => `⚡ 144k t/s · High Latency Engine`
  },
  idle: {
    details: (model) => `⚡ Pair programming · ${model}`,
    state: (project) => `📁 ${project} · Waiting for prompt`
  }
};

let currentMode = 'thinking';

function applyCurrentState() {
  const project = projectInput.value.trim() || 'antigravity-core';
  const model = modelInput.value.trim() || 'Gemini 3.8 Flash';
  const modeData = modes[currentMode] || modes.thinking;

  cardDetails.textContent = modeData.details(model);
  cardState.textContent = modeData.state(project);
}

// Simulator button clicks
document.querySelectorAll('.sim-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    applyCurrentState();
  });
});

// Input changes
projectInput.addEventListener('input', applyCurrentState);
modelInput.addEventListener('input', applyCurrentState);

// Dynamic Animation Simulation
function startAnimation() {
  if (animInterval) clearInterval(animInterval);
  const simModes = ['thinking', 'coding', 'flex', 'terminal'];

  animInterval = setInterval(() => {
    if (!animationEnabled) return;
    animStep = (animStep + 1) % simModes.length;
    currentMode = simModes[animStep];

    document.querySelectorAll('.sim-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === currentMode);
    });

    applyCurrentState();
  }, 4000);
}

animToggle.addEventListener('change', (e) => {
  animationEnabled = e.target.checked;
  if (!animationEnabled && animInterval) {
    clearInterval(animInterval);
  } else if (animationEnabled) {
    startAnimation();
  }
});

startAnimation();

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('active');
    const plus = item.querySelector('.faq-question span:last-child');
    if (plus) {
      plus.textContent = item.classList.contains('active') ? '−' : '+';
    }
  });
});

