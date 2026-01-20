"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const providerTabs = document.querySelectorAll('.provider-tab');
    const openaiSection = document.getElementById('openai-section');
    const ollamaSection = document.getElementById('ollama-section');
    const apiKeyInput = document.getElementById('apiKey');
    const ollamaUrlInput = document.getElementById('ollamaUrl');
    const ollamaModelInput = document.getElementById('ollamaModel');
    const saveBtn = document.getElementById('saveBtn');
    const removeBtn = document.getElementById('removeBtn');
    const toggleVisibility = document.getElementById('toggleVisibility');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const eyeIcon = document.getElementById('eyeIcon');
    let currentProvider = 'openai';
    // Load existing settings
    chrome.storage.local.get(['provider', 'openaiApiKey', 'ollamaUrl', 'ollamaModel'], (result) => {
        if (result.provider) {
            currentProvider = result.provider;
            updateProviderUI(currentProvider);
        }
        if (result.openaiApiKey && apiKeyInput) {
            apiKeyInput.value = result.openaiApiKey;
        }
        if (result.ollamaUrl && ollamaUrlInput) {
            ollamaUrlInput.value = result.ollamaUrl;
        }
        if (result.ollamaModel && ollamaModelInput) {
            ollamaModelInput.value = result.ollamaModel;
        }
        if (result.provider || result.openaiApiKey || result.ollamaUrl) {
            showStatus('Settings loaded', 'info');
        }
    });
    // Provider tab switching
    providerTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const provider = tab.dataset.provider;
            if (provider) {
                currentProvider = provider;
                updateProviderUI(provider);
            }
        });
    });
    function updateProviderUI(provider) {
        providerTabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.provider === provider);
        });
        openaiSection?.classList.toggle('active', provider === 'openai');
        ollamaSection?.classList.toggle('active', provider === 'ollama');
    }
    // Toggle password visibility
    toggleVisibility?.addEventListener('click', () => {
        if (!apiKeyInput || !eyeIcon)
            return;
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        if (isPassword) {
            eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
        }
        else {
            eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
        }
    });
    // Save settings
    saveBtn?.addEventListener('click', () => {
        const settings = { provider: currentProvider };
        if (currentProvider === 'openai') {
            const apiKey = apiKeyInput?.value.trim() || '';
            if (!apiKey) {
                showStatus('Please enter an API key', 'error');
                return;
            }
            if (!apiKey.startsWith('sk-')) {
                showStatus('Invalid API key format (should start with sk-)', 'error');
                return;
            }
            settings.openaiApiKey = apiKey;
        }
        else {
            const ollamaUrl = ollamaUrlInput?.value.trim() || 'http://localhost:11434';
            const ollamaModel = ollamaModelInput?.value.trim() || '';
            if (!ollamaModel) {
                showStatus('Please enter a model name', 'error');
                return;
            }
            settings.ollamaUrl = ollamaUrl;
            settings.ollamaModel = ollamaModel;
        }
        chrome.storage.local.set(settings, () => {
            showStatus('Settings saved successfully', 'success');
        });
    });
    // Remove/clear settings
    removeBtn?.addEventListener('click', () => {
        chrome.storage.local.remove(['provider', 'openaiApiKey', 'ollamaUrl', 'ollamaModel'], () => {
            if (apiKeyInput)
                apiKeyInput.value = '';
            if (ollamaUrlInput)
                ollamaUrlInput.value = '';
            if (ollamaModelInput)
                ollamaModelInput.value = '';
            currentProvider = 'openai';
            updateProviderUI('openai');
            showStatus('Settings cleared', 'success');
        });
    });
    function showStatus(message, type) {
        if (!status || !statusText)
            return;
        status.className = `status ${type}`;
        statusText.textContent = message;
        setTimeout(() => {
            if (status)
                status.className = 'status';
        }, 3000);
    }
});
