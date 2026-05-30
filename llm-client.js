// Updated JavaScript for HPE-APEX v3 with Local LLM Support
// This replaces the original sendMessage() function in HPE-APEX-v3-COMPLETE.html

let apiKey = localStorage.getItem('hpe-apex-apikey') || '';
let apiProvider = localStorage.getItem('hpe-apex-provider') || 'anthropic';
let modelName = localStorage.getItem('hpe-apex-model') || '';
let customEndpoint = localStorage.getItem('hpe-apex-custom-endpoint') || '';

// Model defaults for each provider
const PROVIDER_MODELS = {
  anthropic: 'claude-3-sonnet-20240229',
  openai: 'gpt-4-turbo',
  google: 'gemini-1.5-pro',
  groq: 'mixtral-8x7b-32768',
  openrouter: 'anthropic/claude-3-sonnet',
  perplexity: 'pplx-7b-chat',
  mistral: 'mistral-7b-instruct',
  cohere: 'command-r',
  custom: 'default'
};

function onProviderChange() {
  const provider = document.getElementById('providerSelect').value;
  const modelInput = document.getElementById('modelInput');
  apiProvider = provider;
  localStorage.setItem('hpe-apex-provider', provider);
  
  if (PROVIDER_MODELS[provider]) {
    modelInput.value = PROVIDER_MODELS[provider];
    modelName = PROVIDER_MODELS[provider];
  }
  
  // Show/hide endpoint input based on provider
  if (provider === 'custom') {
    modelInput.placeholder = 'Enter custom endpoint (e.g., http://localhost:5000)';
  } else {
    modelInput.placeholder = 'Model (auto-filled)';
  }
}

function saveApiKey() {
  const apikeyInput = document.getElementById('apikeyInput');
  const modelInput = document.getElementById('modelInput');
  const provider = document.getElementById('providerSelect').value;
  
  if (provider === 'custom') {
    customEndpoint = modelInput.value.trim();
    if (!customEndpoint) {
      showError('Please enter a custom endpoint URL');
      return;
    }
    localStorage.setItem('hpe-apex-custom-endpoint', customEndpoint);
    testLocalConnection(customEndpoint);
  } else {
    apiKey = apikeyInput.value.trim();
    modelName = modelInput.value.trim() || PROVIDER_MODELS[provider];
    
    if (!apiKey) {
      showError('Please enter an API key');
      return;
    }
    
    localStorage.setItem('hpe-apex-apikey', apiKey);
    localStorage.setItem('hpe-apex-model', modelName);
    updateBannerStatus(true);
    showNotification(`✓ Connected to ${provider}`);
  }
}

function testLocalConnection(endpoint) {
  fetch(`${endpoint}/health`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok') {
        updateBannerStatus(true);
        showNotification('✓ Connected to Local LLM Server');
        
        // Fetch available models
        return fetch(`${endpoint}/api/models`).then(r => r.json());
      } else {
        throw new Error(data.error || 'Server not ready');
      }
    })
    .then(data => {
      console.log('Available models:', data.models);
    })
    .catch(err => {
      updateBannerStatus(false);
      showError(`Cannot connect to ${endpoint}: ${err.message}`);
    });
}

async function sendMessage() {
  const userInput = document.getElementById('userInput');
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // Check if connected
  if (apiProvider === 'custom') {
    if (!customEndpoint) {
      showError('Please connect to a Custom endpoint first');
      return;
    }
  } else {
    if (!apiKey) {
      showError('Please enter an API key first');
      return;
    }
  }
  
  // Disable send button
  document.getElementById('sendBtn').disabled = true;
  userInput.value = '';
  autoResize(userInput);
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Show typing indicator
  const typingId = showTypingIndicator();
  
  try {
    let response;
    
    if (apiProvider === 'custom') {
      // Local LLM via Ollama
      response = await callLocalLLM(message);
    } else {
      // Cloud API
      response = await callCloudAPI(message);
    }
    
    // Remove typing indicator
    removeTypingIndicator(typingId);
    
    // Add AI response
    addMessage(response, 'ai');
    
  } catch (error) {
    removeTypingIndicator(typingId);
    addMessage(`Error: ${error.message}`, 'error');
  } finally {
    document.getElementById('sendBtn').disabled = false;
    userInput.focus();
  }
}

async function callLocalLLM(message) {
  const response = await fetch(`${customEndpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      model: 'mistral', // or other available model
      temperature: 0.7,
      top_p: 0.9
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.message || data.response || 'No response';
}

async function callCloudAPI(message) {
  // Existing cloud API logic for Anthropic, OpenAI, etc.
  // (Keep your original implementation here)
  throw new Error('Cloud API support coming soon. Use local Ollama endpoint for now.');
}

function addMessage(text, role) {
  const chatInner = document.getElementById('chatInner');
  const welcomeScreen = document.getElementById('welcomeScreen');
  
  if (welcomeScreen) welcomeScreen.remove();
  
  const message = document.createElement('div');
  message.className = `message ${role}`;
  
  const avatarClass = role === 'user' ? 'user' : role === 'error' ? 'error' : 'ai';
  const avatarText = role === 'user' ? 'YOU' : role === 'error' ? '⚠' : 'APEX';
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  message.innerHTML = `
    <div class="msg-avatar ${avatarClass}">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name ${role === 'user' ? 'user' : 'ai'}">${avatarText}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-bubble ${role === 'error' ? 'error-bubble' : role}">
        ${markdownToHtml(text)}
      </div>
    </div>
  `;
  
  chatInner.appendChild(message);
  
  // Scroll to bottom
  const chatWrapper = document.getElementById('chatWrapper');
  setTimeout(() => {
    chatWrapper.scrollTop = chatWrapper.scrollHeight;
  }, 0);
}

function showTypingIndicator() {
  const chatInner = document.getElementById('chatInner');
  const id = 'typing-' + Date.now();
  
  const typing = document.createElement('div');
  typing.id = id;
  typing.className = 'message';
  typing.innerHTML = `
    <div class="msg-avatar ai">APEX</div>
    <div class="msg-body">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span class="typing-label">THINKING...</span>
      </div>
    </div>
  `;
  
  chatInner.appendChild(typing);
  
  const chatWrapper = document.getElementById('chatWrapper');
  chatWrapper.scrollTop = chatWrapper.scrollHeight;
  
  return id;
}

function removeTypingIndicator(id) {
  const typing = document.getElementById(id);
  if (typing) typing.remove();
}

function updateBannerStatus(connected) {
  const banner = document.getElementById('apikeyBanner');
  const status = document.getElementById('apikeyStatus');
  
  if (connected) {
    banner.classList.add('connected');
    status.textContent = '✓ CONNECTED';
  } else {
    banner.classList.remove('connected');
    status.textContent = 'Not connected';
  }
}

function showError(msg) {
  const error = document.createElement('div');
  error.className = 'error-bubble';
  error.textContent = msg;
  error.style.cssText = 'position: fixed; top: 100px; right: 20px; padding: 12px 16px; border-radius: 4px; z-index: 999; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
  document.body.appendChild(error);
  setTimeout(() => error.remove(), 5000);
}

function showNotification(msg) {
  const notif = document.createElement('div');
  notif.textContent = msg;
  notif.style.cssText = 'position: fixed; top: 100px; right: 20px; padding: 12px 16px; background: rgba(1,169,130,0.9); border-radius: 4px; z-index: 999; color: white; font-family: monospace; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function markdownToHtml(text) {
  // Simple markdown to HTML conversion
  text = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
  return text;
}

function handleKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
}

function clearChat() {
  const chatInner = document.getElementById('chatInner');
  chatInner.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <div class="welcome-icon">
        <svg viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="8" rx="1"/>
          <rect x="2" y="14" width="20" height="8" rx="1"/>
          <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/>
          <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none"/>
          <line x1="10" y1="6" x2="18" y2="6"/>
          <line x1="10" y1="18" x2="18" y2="18"/>
        </svg>
      </div>
      <div class="welcome-title">HPE Server <span>AI Expert</span></div>
      <div class="welcome-desc">Your professional-grade AI assistant for HPE servers.</div>
    </div>
  `;
}

function quickTopic(topic) {
  document.getElementById('userInput').value = topic;
  autoResize(document.getElementById('userInput'));
  sendMessage();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const provider = localStorage.getItem('hpe-apex-provider') || 'anthropic';
  document.getElementById('providerSelect').value = provider;
  
  const apiKeyInput = document.getElementById('apikeyInput');
  const modelInput = document.getElementById('modelInput');
  
  if (apiProvider === 'custom' && customEndpoint) {
    modelInput.value = customEndpoint;
    updateBannerStatus(true);
  } else if (apiKey) {
    apiKeyInput.value = apiKey;
    modelInput.value = modelName || PROVIDER_MODELS[provider];
    updateBannerStatus(true);
  }
  
  onProviderChange();
});
