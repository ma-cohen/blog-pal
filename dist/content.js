"use strict";
// BlogPal Content Script
// Handles text selection, floating button, and refinement UI
(function () {
    'use strict';
    let floatingButton = null;
    let refinementPopup = null;
    let selectedText = '';
    // Create floating button element
    function createFloatingButton() {
        const button = document.createElement('div');
        button.id = 'blogpal-floating-button';
        button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      <span>Refine</span>
    `;
        button.style.display = 'none';
        document.body.appendChild(button);
        button.addEventListener('click', handleRefineClick);
        return button;
    }
    // Create refinement popup element
    function createRefinementPopup() {
        const popup = document.createElement('div');
        popup.id = 'blogpal-refinement-popup';
        popup.innerHTML = `
      <div class="blogpal-popup-header">
        <div class="blogpal-popup-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          BlogPal
        </div>
        <button class="blogpal-close-btn" id="blogpal-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="blogpal-popup-content">
        <div class="blogpal-loading" id="blogpal-loading">
          <div class="blogpal-spinner"></div>
          <span>Refining your text...</span>
        </div>
        <div class="blogpal-result" id="blogpal-result" style="display: none;">
          <div class="blogpal-result-text" id="blogpal-result-text"></div>
          <div class="blogpal-actions">
            <button class="blogpal-btn blogpal-btn-primary" id="blogpal-copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy to Clipboard
            </button>
          </div>
        </div>
        <div class="blogpal-error" id="blogpal-error" style="display: none;">
          <span id="blogpal-error-text"></span>
        </div>
      </div>
    `;
        popup.style.display = 'none';
        document.body.appendChild(popup);
        // Event listeners
        const closeBtn = popup.querySelector('#blogpal-close');
        const copyBtn = popup.querySelector('#blogpal-copy');
        if (closeBtn) {
            closeBtn.addEventListener('click', hidePopup);
        }
        if (copyBtn) {
            copyBtn.addEventListener('click', handleCopy);
        }
        return popup;
    }
    // Initialize elements
    function init() {
        floatingButton = createFloatingButton();
        refinementPopup = createRefinementPopup();
        // Listen for text selection
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
    }
    // Handle mouse up - check for text selection
    function handleMouseUp(e) {
        // Ignore clicks on our own elements
        const target = e.target;
        if (target.closest('#blogpal-floating-button') ||
            target.closest('#blogpal-refinement-popup')) {
            return;
        }
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim() || '';
            if (text.length > 0) {
                selectedText = text;
                showFloatingButton(e.clientX, e.clientY);
            }
            else {
                hideFloatingButton();
            }
        }, 10);
    }
    // Handle mouse down - hide button if clicking elsewhere
    function handleMouseDown(e) {
        const target = e.target;
        if (!target.closest('#blogpal-floating-button') &&
            !target.closest('#blogpal-refinement-popup')) {
            hideFloatingButton();
        }
    }
    // Handle escape key
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            hideFloatingButton();
            hidePopup();
        }
    }
    // Show floating button near selection
    function showFloatingButton(x, y) {
        if (!floatingButton)
            return;
        const buttonWidth = 90;
        const buttonHeight = 32;
        const padding = 10;
        // Adjust position to stay within viewport
        let left = x + padding;
        let top = y + padding;
        if (left + buttonWidth > window.innerWidth) {
            left = x - buttonWidth - padding;
        }
        if (top + buttonHeight > window.innerHeight) {
            top = y - buttonHeight - padding;
        }
        floatingButton.style.left = `${left + window.scrollX}px`;
        floatingButton.style.top = `${top + window.scrollY}px`;
        floatingButton.style.display = 'flex';
    }
    // Hide floating button
    function hideFloatingButton() {
        if (floatingButton) {
            floatingButton.style.display = 'none';
        }
    }
    // Handle refine button click
    async function handleRefineClick(e) {
        e.preventDefault();
        e.stopPropagation();
        hideFloatingButton();
        showPopup();
        await refineText(selectedText);
    }
    // Show refinement popup
    function showPopup() {
        if (!refinementPopup)
            return;
        const loading = refinementPopup.querySelector('#blogpal-loading');
        const result = refinementPopup.querySelector('#blogpal-result');
        const error = refinementPopup.querySelector('#blogpal-error');
        if (loading)
            loading.style.display = 'flex';
        if (result)
            result.style.display = 'none';
        if (error)
            error.style.display = 'none';
        // Center popup in viewport
        refinementPopup.style.display = 'block';
    }
    // Hide refinement popup
    function hidePopup() {
        if (refinementPopup) {
            refinementPopup.style.display = 'none';
        }
    }
    // Show result in popup
    function showResult(text) {
        if (!refinementPopup)
            return;
        const loading = refinementPopup.querySelector('#blogpal-loading');
        const result = refinementPopup.querySelector('#blogpal-result');
        const resultText = refinementPopup.querySelector('#blogpal-result-text');
        if (loading)
            loading.style.display = 'none';
        if (result)
            result.style.display = 'block';
        if (resultText)
            resultText.textContent = text;
    }
    // Show error in popup
    function showError(message) {
        if (!refinementPopup)
            return;
        const loading = refinementPopup.querySelector('#blogpal-loading');
        const error = refinementPopup.querySelector('#blogpal-error');
        const errorText = refinementPopup.querySelector('#blogpal-error-text');
        if (loading)
            loading.style.display = 'none';
        if (error)
            error.style.display = 'block';
        if (errorText)
            errorText.textContent = message;
    }
    // Refine text using configured provider (OpenAI or Ollama)
    async function refineText(text) {
        try {
            // Send message to background script to make API call
            chrome.runtime.sendMessage({ action: 'refineText', text: text }, (response) => {
                if (chrome.runtime.lastError) {
                    showError('Extension error. Please try again.');
                    return;
                }
                if (response.error) {
                    showError(response.error);
                }
                else if (response.refinedText) {
                    showResult(response.refinedText);
                }
            });
        }
        catch (err) {
            showError('An unexpected error occurred. Please try again.');
            console.error('BlogPal error:', err);
        }
    }
    // Handle copy to clipboard
    async function handleCopy() {
        if (!refinementPopup)
            return;
        const resultText = refinementPopup.querySelector('#blogpal-result-text');
        const copyBtn = refinementPopup.querySelector('#blogpal-copy');
        if (!resultText || !copyBtn)
            return;
        try {
            await navigator.clipboard.writeText(resultText.textContent || '');
            // Show success feedback
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
            copyBtn.classList.add('blogpal-btn-success');
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('blogpal-btn-success');
            }, 2000);
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    }
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }
})();
