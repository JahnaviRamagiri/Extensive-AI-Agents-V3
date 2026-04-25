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

    document.getElementById('startBtn').addEventListener('click', () => {
        const landing = document.getElementById('landingView');
        landing.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
            landing.style.display = 'none';
        }, 800);
        document.getElementById('appView').style.display = 'flex';
    });

    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('agentPromptInput').value = btn.dataset.query;
            runAgent();
        });
    });

    startFactRotation();
});

const FACTS = [
    "Up to 90% of visible skin aging is caused by sun exposure. Always wear your SPF!",
    "Hyaluronic acid can hold up to 1,000 times its weight in water.",
    "Skin cells regenerate every 28 to 30 days. Consistency is key.",
    "Vitamin C is a powerful antioxidant that brightens skin and boosts collagen.",
    "Retinol is the gold standard for anti-aging and skin texture renewal."
];

function startFactRotation() {
    const el = document.getElementById('factText');
    let idx = 0;
    setInterval(() => {
        idx = (idx + 1) % FACTS.length;
        el.style.opacity = 0;
        setTimeout(() => {
            el.textContent = FACTS[idx];
            el.style.opacity = 1;
        }, 500);
    }, 6000);
}

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

    const initial = document.getElementById('initialDashboard');
    if (initial) initial.style.display = 'none';
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
                update.text,
                true // showPreviewToggle
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
                JSON.stringify(update.result, null, 2),
                true // showPreviewToggle
            );
            break;

        case 'final': {
            const container = document.getElementById('finalResultContainer');
            const el = document.getElementById('finalResult');
            container.style.display = 'block';
            
            // Render full Markdown for rich formatting (headings, bolds, etc.)
            el.innerHTML = typeof marked !== 'undefined' 
                ? marked.parse(update.text) 
                : escapeHtml(update.text);
                
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

    if (prompt) {
        const btn = document.createElement('button');
        btn.className = 'toggle-btn';
        btn.textContent = '📋 View Prompt';

        const promptBox = document.createElement('div');
        promptBox.className = 'prompt-box';
        promptBox.style.display = 'none';
        promptBox.textContent = prompt;

        btn.addEventListener('click', () => {
            const isOpen = promptBox.style.display !== 'none';
            promptBox.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '📋 View Prompt' : '🔼 Hide Prompt';
            btn.classList.toggle('active', !isOpen);
        });

        el.appendChild(btn);
        el._promptBox = promptBox;
    }

    chain.appendChild(el);
    if (el._promptBox) chain.appendChild(el._promptBox);
}

function appendStep(chain, type, label, body, showPreview = false) {
    const el = document.createElement('div');
    el.className = `step ${type}`;

    let html = `<div class="step-label">${label}</div>`;
    if (body) {
        html += `<pre class="step-body">${escapeHtml(body)}</pre>`;
    }

    if (showPreview) {
        html += `<div class="step-controls"></div>`;
    }

    el.innerHTML = html;

    if (showPreview && body) {
        const controls = el.querySelector('.step-controls');
        const btn = document.createElement('button');
        btn.className = 'toggle-btn';
        btn.textContent = '✨ Clean View';

        const previewBox = document.createElement('div');
        previewBox.className = 'preview-box';
        previewBox.style.display = 'none';
        
        // Try to parse JSON and get 'answer', else just clean the text
        previewBox.textContent = getCleanPreview(body);

        btn.addEventListener('click', () => {
            const isOpen = previewBox.style.display !== 'none';
            previewBox.style.display = isOpen ? 'none' : 'block';
            btn.textContent = isOpen ? '✨ Clean View' : '🔼 Raw View';
            btn.classList.toggle('active', !isOpen);
        });

        controls.appendChild(btn);
        el.appendChild(previewBox);
    }

    chain.appendChild(el);
}

function getCleanPreview(text) {
    try {
        // 1. Try to parse as raw JSON first (common for tool results)
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // 2. If not raw JSON, try to extract JSON from surrounding text (common for LLM thoughts)
            const match = text.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
        }

        if (data) {
            // If it's a tool result with an 'analysis' field
            if (data.analysis) return stripMarkdown(data.analysis);
            // If it's a tool result with a 'pricing' field
            if (data.pricing) return stripMarkdown(data.pricing);
            // If it's a search result
            if (data.results) return stripMarkdown(data.results);
            // If it's the final answer object
            if (data.answer) return stripMarkdown(data.answer);
            // If it's a tool call object
            if (data.tool_name) return `Action: ${data.tool_name}\nArgs: ${JSON.stringify(data.tool_arguments)}`;
            
            // Fallback: pretty print the data keys if it's just a generic object
            return Object.entries(data)
                .map(([k, v]) => `${k.toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join('\n');
        }
    } catch (e) {}
    
    // Fallback: just strip markdown from whatever text we have
    return stripMarkdown(text);
}

function activateTool(name) {
    const map = {
        searchWeb:             'tool-search',
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
    const initial = document.getElementById('initialDashboard');
    if (initial) initial.style.display = 'block';
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
