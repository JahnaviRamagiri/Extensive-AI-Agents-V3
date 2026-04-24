import { AgenticGeminiAPI } from './gemini_api.js';

let api = null;
let isRunning = false;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            initAPI(result.geminiApiKey);
            document.getElementById('settingsOverlay').style.display = 'none';
        } else {
            document.getElementById('settingsOverlay').style.display = 'flex';
        }
    });

    document.getElementById('saveApiKey').addEventListener('click', saveKey);
    document.getElementById('apiKeyInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') saveKey();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsOverlay').style.display = 'flex';
    });

    document.getElementById('runAgentBtn').addEventListener('click', runAgent);
    document.getElementById('clearBtn').addEventListener('click', resetUI);

    document.getElementById('agentPromptInput').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            runAgent();
        }
    });

    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('agentPromptInput').value = btn.dataset.query;
            runAgent();
        });
    });
});

function saveKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) return;
    chrome.storage.local.set({ geminiApiKey: key }, () => {
        initAPI(key);
        document.getElementById('settingsOverlay').style.display = 'none';
    });
}

function initAPI(key) {
    api = new AgenticGeminiAPI(key);
}

// ── Run Agent ─────────────────────────────────────────────────────────────────
async function runAgent() {
    if (isRunning) return;
    const prompt = document.getElementById('agentPromptInput').value.trim();
    if (!prompt) return;
    if (!api) { document.getElementById('settingsOverlay').style.display = 'flex'; return; }

    isRunning = true;
    setBusy(true);

    document.getElementById('initialState').style.display = 'none';
    document.getElementById('agentUI').style.display = 'block';

    const chain = document.getElementById('reasoningChain');
    chain.innerHTML = '';

    document.getElementById('finalResultContainer').style.display = 'none';
    document.getElementById('finalResult').innerHTML = '';

    const badge = document.getElementById('iterationBadge');
    badge.textContent = 'Running...';
    badge.className = 'status-badge pulse';

    document.querySelectorAll('.tool-card').forEach(t => t.classList.remove('active'));

    // Show user query as first step
    appendStep(chain, 'user-query', '👤 User Query', prompt);

    try {
        await api.runAgentLoop(prompt, update => onProgress(update, chain));
    } catch (err) {
        appendStep(chain, 'error', '❌ Error', err.message);
        badge.textContent = 'Error';
    } finally {
        isRunning = false;
        setBusy(false);
    }
}

// ── Progress Handler ──────────────────────────────────────────────────────────
function onProgress(update, chain) {
    const badge = document.getElementById('iterationBadge');

    switch (update.type) {

        case 'status':
            appendStep(chain, 'status', update.message, null);
            break;

        case 'iteration':
            badge.textContent = `Iteration ${update.iteration}`;
            badge.className = 'status-badge pulse';
            appendDivider(chain, update.iteration, update.prompt);
            break;

        case 'llm_thought':
            appendStep(chain, 'llm-thought',
                `🧠 LLM Decision — Iteration ${update.iteration}`,
                update.text
            );
            break;

        case 'tool_call':
            activateTool(update.name);
            appendStep(chain, 'tool-call',
                `⚙️ Tool Call: ${update.name}`,
                JSON.stringify(update.args, null, 2)
            );
            break;

        case 'tool_result':
            appendStep(chain, 'tool-result',
                `✅ Result: ${update.name}`,
                JSON.stringify(update.result, null, 2)
            );
            break;

        case 'final': {
            const container = document.getElementById('finalResultContainer');
            const el = document.getElementById('finalResult');
            container.style.display = 'block';
            // Strip markdown symbols — show clean plain text
            el.textContent = stripMarkdown(update.text);
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            badge.textContent = '✓ Complete';
            badge.className = 'status-badge done';
            break;
        }
    }

    chain.scrollTop = chain.scrollHeight;
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function appendDivider(chain, iteration, prompt) {
    const el = document.createElement('div');
    el.className = 'iter-divider';

    const label = document.createElement('span');
    label.textContent = `Iteration ${iteration}`;

    el.appendChild(label);

    // "View Prompt" toggle button — shows the full text sent to the LLM
    if (prompt) {
        const btn = document.createElement('button');
        btn.className = 'prompt-toggle-btn';
        btn.textContent = '📋 View Prompt';

        const promptBox = document.createElement('div');
        promptBox.className = 'prompt-box';
        promptBox.style.display = 'none';
        promptBox.textContent = prompt;   // raw text, no escaping needed for textContent

        btn.addEventListener('click', () => {
            const isOpen = promptBox.style.display !== 'none';
            promptBox.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '📋 View Prompt' : '🔼 Hide Prompt';
            btn.classList.toggle('active', !isOpen);
        });

        el.appendChild(btn);

        // Prompt box goes right after the divider row, as a full-width sibling
        el.insertAdjacentElement('afterend', promptBox);
        // We need to append the promptBox AFTER el is added to chain,
        // so use a small trick: store it on the divider and attach after appendChild
        el._promptBox = promptBox;
    }

    chain.appendChild(el);

    // Now attach promptBox right after the divider in the chain
    if (el._promptBox) {
        chain.appendChild(el._promptBox);
    }
}

function appendStep(chain, type, label, body) {
    const el = document.createElement('div');
    el.className = `step ${type}`;

    let html = `<div class="step-label">${label}</div>`;
    if (body) {
        html += `<pre class="step-body">${escapeHtml(body)}</pre>`;
    }
    el.innerHTML = html;
    chain.appendChild(el);
}

function activateTool(name) {
    const map = {
        searchProductDatabase: 'tool-search',
        getIngredientAnalysis: 'tool-ingredient',
        checkRetailPricing:    'tool-price'
    };
    document.querySelectorAll('.tool-card').forEach(t => t.classList.remove('active'));
    const id = map[name];
    if (id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('active');
            setTimeout(() => el.classList.remove('active'), 3500);
        }
    }
}

function setBusy(busy) {
    const btn   = document.getElementById('runAgentBtn');
    const label = document.getElementById('btnLabel');
    btn.disabled = busy;
    label.innerHTML = busy
        ? '<span class="spinner"></span> Agent Running...'
        : 'Dispatch Agent ✦';
}

function resetUI() {
    document.getElementById('agentPromptInput').value = '';
    document.getElementById('agentUI').style.display = 'none';
    document.getElementById('initialState').style.display = 'flex';
    document.getElementById('reasoningChain').innerHTML = '';
    document.getElementById('finalResult').innerHTML = '';
    document.getElementById('finalResultContainer').style.display = 'none';
    document.getElementById('iterationBadge').textContent = '';
    document.getElementById('iterationBadge').className = 'status-badge';
    document.querySelectorAll('.tool-card').forEach(t => t.classList.remove('active'));
}

// ── Markdown → Plain Text ─────────────────────────────────────────────────────
function stripMarkdown(text) {
    return text
        // Remove heading markers (### ## #)
        .replace(/^#{1,6}\s+/gm, '')
        // Bold **text** or __text__
        .replace(/\*\*(.+?)\*\*/gs, '$1')
        .replace(/__(.+?)__/gs, '$1')
        // Italic *text* or _text_
        .replace(/\*(.+?)\*/gs, '$1')
        .replace(/_(.+?)_/gs, '$1')
        // Inline code `code`
        .replace(/`(.+?)`/g, '$1')
        // Convert bullet list markers to bullet character
        .replace(/^\s*[-*+]\s+/gm, '• ')
        // Convert numbered lists  "1. " → plain
        .replace(/^\s*\d+\.\s+/gm, '')
        // Collapse 3+ blank lines to 2
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
