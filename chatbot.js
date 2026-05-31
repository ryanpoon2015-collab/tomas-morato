// ============================================================
// chatbot.js — Tomas Morato AI Discovery Assistant
// Powered by Google Gemini
// ============================================================

const CHATBOT = (() => {

  // ── Config ──────────────────────────────────────────────
  const getFallbackApiKey = () => {
    return typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
  };

  const getActiveKey = () => {
    return localStorage.getItem('tm_gemini_api_key') || getFallbackApiKey();
  };

  const isAccessToken = (key) => {
    return key.startsWith('ya29.');
  };

  // ── State ────────────────────────────────────────────────
  let isOpen = false;
  let isTyping = false;
  let isSettingsOpen = false;
  let conversationHistory = [];

  // ── Build system prompt from live RESTAURANTS data ───────
  function buildSystemPrompt() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const restaurantSummaries = RESTAURANTS.map(r => {
      const open = isOpenNow(r.hours);
      const price = priceSymbol(r.priceRange);
      const dietary = r.dietary.length ? r.dietary.join(', ') : 'none listed';
      const ambiance = r.ambiance.map(a => AMBIANCE_LABELS[a] || a).join(', ');
      const topItems = r.menu.flatMap(cat => cat.items.slice(0, 2)).slice(0, 4)
        .map(item => `${item.name} (₱${item.price})`).join(', ');

      return [
        `Restaurant: ${r.name}`,
        `  Cuisine: ${r.cuisine}`,
        `  Description: ${r.description}`,
        `  Address: ${r.address}`,
        `  Price Range: ${price} (${r.priceRange}/4)`,
        `  Rating: ${r.rating}⭐ (${r.reviews} reviews)`,
        `  Hours: ${r.hours.open} – ${r.hours.close}`,
        `  Currently: ${open ? 'OPEN' : 'CLOSED'}`,
        `  Wait Time: ${r.waitTime === 'none' ? 'No wait' : r.waitTime === 'packed' ? 'Packed (long wait)' : r.waitTime + ' min'}`,
        `  Ambiance: ${ambiance || 'General dining'}`,
        `  Dietary Options: ${dietary}`,
        `  Popular Items: ${topItems}`,
        r.dailySpecial ? `  Today's Special: ${r.dailySpecial.title} — ${r.dailySpecial.description} (${r.dailySpecial.valid})` : '',
        `  Phone: ${r.phone}`,
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    return `You are "Morato AI", a friendly and knowledgeable food discovery assistant for the Tomas Morato Avenue dining strip in Quezon City, Philippines.

The current time is ${timeStr}. Today is ${now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Your role is STRICTLY to help users discover restaurants, answer questions about food options, operating hours, budgets, dietary needs, ambiance, and provide personalized recommendations. You are NOT able to process orders, handle payments, make reservations, or book tables.

Here is the complete and up-to-date list of restaurants along Tomas Morato Avenue that you know about:

${restaurantSummaries}

Guidelines:
- Be warm, conversational, and enthusiastic about food
- When recommending restaurants, always mention relevant details (price, hours, rating, dietary options)
- If asked about restaurants open "now" or "tonight", use the OPEN/CLOSED status above
- Suggest 2–3 restaurants when possible, not just one
- If a user mentions a budget, map it: ₱ = Budget, ₱₱ = Moderate (₱300–₱600/head), ₱₱₱ = Upscale (₱600–₱1500/head), ₱₱₱₱ = Fine Dining
- Keep responses concise (3–5 sentences max per recommendation block)
- If asked about anything outside food discovery (orders, payments, reservations), politely explain that's outside your scope
- Always use Philippine Peso (₱) for prices
- Add relevant emojis to make responses feel lively but don't overdo it`;
  }

  // ── Gemini API call with streaming ───────────────────────
  async function streamGeminiResponse(userMessage, onChunk, onDone, onError) {
    // Add user message to history
    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const activeKey = getActiveKey();
    let url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent';
    const headers = { 'Content-Type': 'application/json' };

    if (isAccessToken(activeKey)) {
      headers['Authorization'] = `Bearer ${activeKey}`;
      url += '?alt=sse';
    } else {
      url += `?key=${activeKey}&alt=sse`;
    }

    const body = {
      system_instruction: {
        parts: { text: buildSystemPrompt() }
      },
      contents: conversationHistory
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const json = JSON.parse(dataStr);
              if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
                const textChunk = json.candidates[0].content.parts[0].text;
                if (textChunk) {
                  fullContent += textChunk;
                  onChunk(textChunk);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON chunks
            }
          }
        }
      }

      // Add assistant response to history
      conversationHistory.push({ role: 'model', parts: [{ text: fullContent }] });
      onDone();

    } catch (err) {
      onError(err);
    }
  }

  // ── DOM helpers ──────────────────────────────────────────
  function getEl(id) { return document.getElementById(id); }

  function scrollToBottom() {
    const body = getEl('chatbot-messages');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function timestamp() {
    return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  function appendMessage(role, text, isStreaming = false) {
    const body = getEl('chatbot-messages');
    if (!body) return null;

    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg chatbot-msg--${role}`;

    const inner = document.createElement('div');
    inner.className = 'chatbot-msg__bubble';
    inner.innerHTML = formatText(text);

    const ts = document.createElement('div');
    ts.className = 'chatbot-msg__time';
    ts.textContent = timestamp();

    bubble.appendChild(inner);
    bubble.appendChild(ts);
    body.appendChild(bubble);
    scrollToBottom();

    return inner; // return reference for streaming updates
  }

  function formatText(text) {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function showTypingIndicator() {
    const body = getEl('chatbot-messages');
    if (!body) return;

    const el = document.createElement('div');
    el.className = 'chatbot-msg chatbot-msg--assistant';
    el.id = 'chatbot-typing';
    el.innerHTML = `
      <div class="chatbot-msg__bubble chatbot-typing-indicator">
        <span></span><span></span><span></span>
      </div>`;
    body.appendChild(el);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = getEl('chatbot-typing');
    if (el) el.remove();
  }

  // ── Send message ─────────────────────────────────────────
  async function sendMessage() {
    if (isTyping) return;

    const input = getEl('chatbot-input');
    const sendBtn = getEl('chatbot-send-btn');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    isTyping = true;
    sendBtn.disabled = true;

    appendMessage('user', text);
    showTypingIndicator();

    // Create streaming assistant bubble
    let assistantBubble = null;
    let accumulatedText = '';

    await streamGeminiResponse(
      text,
      // onChunk
      (chunk) => {
        accumulatedText += chunk;
        removeTypingIndicator();

        if (!assistantBubble) {
          assistantBubble = appendMessage('assistant', '');
        }
        if (assistantBubble) {
          assistantBubble.innerHTML = formatText(accumulatedText);
          scrollToBottom();
        }
      },
      // onDone
      () => {
        removeTypingIndicator();
        isTyping = false;
        sendBtn.disabled = false;
        input.focus();
      },
      // onError
      (err) => {
        removeTypingIndicator();
        console.error('Gemini error:', err);

        // Show a friendly error
        let errMsg = `⚠️ Something went wrong: ${err.message}. Please try again.`;
        
        const hasUserKey = !!localStorage.getItem('tm_gemini_api_key');
        const fallbackKey = getFallbackApiKey();
        
        const isAuthError = err.message.includes('401') || err.message.includes('403') ||
          err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid') ||
          err.message.includes('UNAUTHENTICATED') || err.message.includes('PERMISSION_DENIED') ||
          err.message.includes('unregistered callers');

        const isAdmin = sessionStorage.getItem('tm_user_role') === 'admin';

        if (isAuthError) {
          if (isAdmin) {
            if (hasUserKey) {
              errMsg = `⚠️ Your API key is invalid or unauthorized (${err.message.includes('403') ? 'Error 403' : 'Error 401'}). Please verify and update your key.<br><button class="chatbot-error-btn" onclick="CHATBOT.toggleSettings()">Update API Key</button>`;
            } else {
              errMsg = `⚠️ API access denied. The current key in <code>api-keys.js</code> is not valid for the Gemini API.<br>Please get a free key from <strong>Google AI Studio</strong> (starts with <code>AIzaSy</code> or <code>AQ.</code>) and configure it below.<br><button class="chatbot-error-btn" onclick="CHATBOT.toggleSettings()">Configure API Key →</button>`;
            }
          } else {
            errMsg = `⚠️ The AI Assistant is currently unavailable due to a configuration issue. Please try again later.`;
          }
        } else if (fallbackKey === 'PUT_YOUR_GEMINI_API_KEY_HERE' && !hasUserKey) {
          if (isAdmin) {
            errMsg = `⚠️ Please configure your <strong>Gemini API Key</strong> to use the assistant!<br><button class="chatbot-error-btn" onclick="CHATBOT.toggleSettings()">Set API Key</button>`;
          } else {
            errMsg = `⚠️ The AI Assistant is not configured yet.`;
          }
        }

        appendMessage('assistant', errMsg);
        conversationHistory.pop(); // remove failed user message
        isTyping = false;
        sendBtn.disabled = false;
        input.focus();
      }
    );
  }

  // ── Open / Close ─────────────────────────────────────────
  function open() {
    isOpen = true;
    const panel = getEl('chatbot-panel');
    const btn = getEl('chatbot-fab');
    if (panel) { panel.classList.add('chatbot-panel--open'); panel.setAttribute('aria-hidden', 'false'); }
    if (btn) btn.classList.add('chatbot-fab--open');

    // Hide settings button for non-admins
    const settingsBtn = getEl('chatbot-settings-btn');
    if (settingsBtn) {
      const role = sessionStorage.getItem('tm_user_role');
      settingsBtn.style.display = (role === 'admin') ? 'inline-flex' : 'none';
    }

    setTimeout(() => { const input = getEl('chatbot-input'); if (input) input.focus(); }, 300);
  }

  function close() {
    isOpen = false;
    const panel = getEl('chatbot-panel');
    const btn = getEl('chatbot-fab');
    if (panel) { panel.classList.remove('chatbot-panel--open'); panel.setAttribute('aria-hidden', 'true'); }
    if (btn) btn.classList.remove('chatbot-fab--open');
  }

  function toggle() { isOpen ? close() : open(); }

  // ── Suggested questions ───────────────────────────────────
  function useSuggestion(text) {
    const input = getEl('chatbot-input');
    if (input) { input.value = text; input.focus(); }
    // Hide suggestions after use
    const sugg = getEl('chatbot-suggestions');
    if (sugg) sugg.style.display = 'none';
  }

  function clearChat() {
    conversationHistory = [];
    const body = getEl('chatbot-messages');
    if (!body) return;
    body.innerHTML = '';
    const sugg = getEl('chatbot-suggestions');
    if (sugg) sugg.style.display = 'flex';
    appendWelcome();
  }

  function appendWelcome() {
    appendMessage('assistant',
      `👋 Hi! I'm **Morato AI**, your personal food discovery guide for **Tomas Morato Avenue**.\n\nAsk me anything — best places for date night, open late, budget-friendly picks, vegan options, and more! What are you craving? 🍽️`
    );
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    injectHTML();
    bindEvents();
    appendWelcome();
  }

  function injectHTML() {
    const container = document.createElement('div');
    container.id = 'chatbot-root';
    container.innerHTML = `
      <!-- Floating Action Button -->
      <button id="chatbot-fab" class="chatbot-fab" onclick="CHATBOT.toggle()" aria-label="Open AI food assistant" title="Ask Morato AI">
        <div class="chatbot-fab__icon chatbot-fab__icon--closed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        <div class="chatbot-fab__icon chatbot-fab__icon--open">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div class="chatbot-fab__pulse"></div>
        <div class="chatbot-fab__label">Morato AI</div>
      </button>

      <!-- Chat Panel -->
      <div id="chatbot-panel" class="chatbot-panel" role="dialog" aria-label="Morato AI Chat" aria-hidden="true">

        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header__left">
            <div class="chatbot-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
                <path d="M5 14v7h14v-7"/>
                <line x1="9" y1="18" x2="9" y2="14"/>
                <line x1="12" y1="18" x2="12" y2="14"/>
                <line x1="15" y1="18" x2="15" y2="14"/>
              </svg>
            </div>
            <div class="chatbot-header__info">
              <div class="chatbot-header__name">Morato AI</div>
              <div class="chatbot-header__status">
                <span class="chatbot-status-dot"></span>
                Powered by Google Gemini
              </div>
            </div>
          </div>
          <div class="chatbot-header__actions">
            <button id="chatbot-settings-btn" class="chatbot-icon-btn" onclick="CHATBOT.toggleSettings()" title="API Settings" aria-label="API Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button class="chatbot-icon-btn" onclick="CHATBOT.clearChat()" title="Clear conversation" aria-label="Clear chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
              </svg>
            </button>
            <button class="chatbot-icon-btn" onclick="CHATBOT.close()" title="Close chat" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Settings Overlay -->
        <div id="chatbot-settings" class="chatbot-settings-overlay" style="display: none;">
          <h3>⚙️ Morato AI Settings</h3>
          <p>Configure a custom Gemini API key or access token. Get a key at <a href="https://aistudio.google.com/" target="_blank" style="color: var(--orange); text-decoration: underline;">Google AI Studio</a>.</p>
          <div class="chatbot-settings-field">
            <label for="chatbot-key-input">API Key / Access Token</label>
            <div class="chatbot-settings-input-container">
              <input type="password" id="chatbot-key-input" class="chatbot-input" style="width:100%;" placeholder="AIzaSy... or AQ...." />
              <button type="button" id="chatbot-key-toggle" class="chatbot-settings-toggle-btn" onclick="CHATBOT.toggleKeyVisibility()">👁️</button>
            </div>
          </div>
          <div id="chatbot-settings-msg" class="chatbot-settings-msg" style="display: none;"></div>
          <div class="chatbot-settings-actions">
            <button type="button" class="chatbot-settings-btn chatbot-settings-btn--cancel" onclick="CHATBOT.toggleSettings()">Cancel</button>
            <button type="button" class="chatbot-settings-btn chatbot-settings-btn--save" onclick="CHATBOT.saveSettings()">Save Key</button>
          </div>
        </div>

        <!-- Messages -->
        <div id="chatbot-messages" class="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages"></div>

        <!-- Suggested questions -->
        <div id="chatbot-suggestions" class="chatbot-suggestions">
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('What restaurants are open right now?')">🕐 Open right now</button>
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('Suggest a romantic date night restaurant')">💕 Date night spots</button>
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('Where can I eat for under ₱300 per person?')">💰 Budget-friendly</button>
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('Any vegan or vegetarian options nearby?')">🌱 Vegan options</button>
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('Which restaurants are best rated?')">⭐ Top rated</button>
          <button class="chatbot-sugg-chip" onclick="CHATBOT.useSuggestion('Where can I go with my family?')">👨‍👩‍👧 Family dining</button>
        </div>

        <!-- Input Area -->
        <div class="chatbot-input-area">
          <textarea
            id="chatbot-input"
            class="chatbot-input"
            placeholder="Ask about restaurants, hours, budget…"
            rows="1"
            maxlength="500"
            aria-label="Type your message"
          ></textarea>
          <button id="chatbot-send-btn" class="chatbot-send-btn" onclick="CHATBOT.sendMessage()" aria-label="Send message" title="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <!-- Footer disclaimer -->
        <div class="chatbot-footer">
          ⚡ Powered by Gemini API · Discovery only · No orders or reservations
        </div>

      </div>
    `;
    document.body.appendChild(container);
  }

  function bindEvents() {
    // Auto-resize textarea & Enter to send
    document.addEventListener('keydown', (e) => {
      const input = getEl('chatbot-input');
      if (document.activeElement !== input) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id !== 'chatbot-input') return;
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

      // Show/hide send button active state
      const btn = getEl('chatbot-send-btn');
      if (btn) btn.classList.toggle('chatbot-send-btn--active', e.target.value.trim().length > 0);
    });
  }

  // ── Settings Panel Logic ──────────────────────────────────
  function toggleSettings() {
    const role = sessionStorage.getItem('tm_user_role');
    if (role !== 'admin') {
      if (typeof showToast === 'function') {
        showToast('Only admins can access API settings.', '🔒');
      }
      return;
    }

    const settingsPanel = getEl('chatbot-settings');
    if (!settingsPanel) return;

    isSettingsOpen = !isSettingsOpen;
    if (isSettingsOpen) {
      settingsPanel.style.display = 'flex';
      // Load current key into input
      const keyInput = getEl('chatbot-key-input');
      if (keyInput) {
        keyInput.value = localStorage.getItem('tm_gemini_api_key') || '';
      }
      const msg = getEl('chatbot-settings-msg');
      if (msg) {
        msg.style.display = 'none';
        msg.className = 'chatbot-settings-msg';
        msg.innerHTML = '';
      }
    } else {
      settingsPanel.style.display = 'none';
    }
  }

  function saveSettings() {
    const keyInput = getEl('chatbot-key-input');
    const msg = getEl('chatbot-settings-msg');
    if (!keyInput || !msg) return;

    const value = keyInput.value.trim();
    
    // Validate key
    if (!value) {
      // Allow clearing the key to use default
      localStorage.removeItem('tm_gemini_api_key');
      msg.style.display = 'block';
      msg.className = 'chatbot-settings-msg chatbot-settings-msg--success';
      msg.innerHTML = '✨ Settings saved. Using default API Key.';
      setTimeout(() => toggleSettings(), 1500);
      return;
    }

    if (!value.startsWith('AIzaSy') && !value.startsWith('AQ.')) {
      msg.style.display = 'block';
      msg.className = 'chatbot-settings-msg chatbot-settings-msg--error';
      msg.innerHTML = '⚠️ Warning: Keys usually start with "AIzaSy" or "AQ."';
    } else {
      msg.style.display = 'block';
      msg.className = 'chatbot-settings-msg chatbot-settings-msg--success';
      msg.innerHTML = '✨ Key saved successfully!';
    }

    localStorage.setItem('tm_gemini_api_key', value);
    setTimeout(() => toggleSettings(), 1200);
  }

  function toggleKeyVisibility() {
    const keyInput = getEl('chatbot-key-input');
    const toggleBtn = getEl('chatbot-key-toggle');
    if (!keyInput || !toggleBtn) return;

    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      keyInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  }

  // ── Public API ────────────────────────────────────────────
  return { 
    init, 
    toggle, 
    open, 
    close, 
    clearChat, 
    sendMessage, 
    useSuggestion,
    toggleSettings,
    saveSettings,
    toggleKeyVisibility
  };

})();

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => CHATBOT.init());
