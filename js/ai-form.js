// js/ai-form.js

import { startPlaceholderAnimation, stopPlaceholderAnimation } from './typewriter.js';

class AiFormManager {
    constructor() {
        this.isInitialized = false;
        this.chatHistory = [];
        this.isLoading = false;
        this.elements = {};
        
        // Bind methods to maintain context
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChatSubmit = this.handleChatSubmit.bind(this);
        this.handleStartChat = this.handleStartChat.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleWindowClick = this.handleWindowClick.bind(this);
    }

    // Initialisierung der Komponente
    init() {
        if (this.isInitialized) {
            console.warn('AiFormManager bereits initialisiert');
            return;
        }

        if (!this.findElements()) {
            console.error('Nicht alle benötigten Elemente gefunden');
            return;
        }

        this.attachEventListeners();
        this.isInitialized = true;
        console.log('AiFormManager erfolgreich initialisiert');
    }

    // Alle benötigten DOM-Elemente finden
    findElements() {
        const elementIds = {
            aiForm: 'ai-form',
            aiQuestionInput: 'ai-question',
            aiStatus: 'ai-status',
            modal: 'ai-response-modal',
            responseContent: 'ai-response-content',
            startChatButton: 'start-chat-button',
            closeModalButton: 'close-modal-button',
            initialResponseContainer: 'initial-ai-response',
            chatContainer: 'ai-chat-container',
            chatHistory: 'chat-history',
            chatForm: 'chat-form',
            chatInput: 'chat-input'
        };

        for (const [key, id] of Object.entries(elementIds)) {
            this.elements[key] = document.getElementById(id);
            if (!this.elements[key]) {
                console.error(`Element mit ID '${id}' nicht gefunden`);
                return false;
            }
        }

        // Submit-Button aus dem Formular finden
        this.elements.submitButton = this.elements.aiForm.querySelector('button[type="submit"]');
        if (!this.elements.submitButton) {
            console.error('Submit-Button nicht gefunden');
            return false;
        }

        return true;
    }

    // Event-Listener anhängen
    attachEventListeners() {
        // Hauptformular
        this.elements.aiForm.addEventListener('submit', this.handleSubmit);
        
        // Chat-Formular
        this.elements.chatForm.addEventListener('submit', this.handleChatSubmit);
        
        // Modal-Buttons
        this.elements.startChatButton.addEventListener('click', this.handleStartChat);
        this.elements.closeModalButton.addEventListener('click', this.handleCloseModal);
        
        // Keyboard-Events
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Window-Click für Modal schließen
        window.addEventListener('click', this.handleWindowClick);
    }

    // Event-Listener entfernen (für Cleanup)
    removeEventListeners() {
        this.elements.aiForm?.removeEventListener('submit', this.handleSubmit);
        this.elements.chatForm?.removeEventListener('submit', this.handleChatSubmit);
        this.elements.startChatButton?.removeEventListener('click', this.handleStartChat);
        this.elements.closeModalButton?.removeEventListener('click', this.handleCloseModal);
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('click', this.handleWindowClick);
    }

    // Hauptformular-Submit Handler
    async handleSubmit(e) {
        e.preventDefault();
        
        const question = this.elements.aiQuestionInput.value.trim();
        if (!question || this.isLoading) return;

        this.setLoadingState(true);
        
        try {
            const response = await this.sendApiRequest(question);
            this.showInitialResponse(response.answer);
            this.resetChatHistory();
            
        } catch (error) {
            this.showError(`Fehler: ${error.message}`);
            console.error('Fehler bei der KI-Anfrage:', error);
            
        } finally {
            this.setLoadingState(false);
        }
    }

    // Chat-Submit Handler
    async handleChatSubmit(e) {
        e.preventDefault();
        
        const userMessage = this.elements.chatInput.value.trim();
        if (!userMessage || this.isLoading) return;

        // User-Nachricht zum Chat hinzufügen
        this.addMessageToChat('user', userMessage);
        this.elements.chatInput.value = '';
        
        // Loading-Nachricht hinzufügen
        const loadingId = this.addLoadingMessage();
        
        try {
            const response = await this.sendApiRequest(userMessage, this.getChatContext());
            this.replaceLoadingMessage(loadingId, response.answer);
            
        } catch (error) {
            this.replaceLoadingMessage(loadingId, `Entschuldigung, ein Fehler ist aufgetreten: ${error.message}`, true);
            console.error('Fehler bei der Chat-Antwort:', error);
        }
    }

    // Chat starten
    handleStartChat() {
        this.elements.initialResponseContainer.style.display = 'none';
        this.elements.chatContainer.style.display = 'block';
        this.elements.closeModalButton.style.display = 'block';
        
        // Erste AI-Antwort zum Chat-Verlauf hinzufügen
        const initialResponse = this.elements.responseContent.innerHTML;
        this.addMessageToChat('assistant', initialResponse);
        
        this.elements.chatInput.focus();
    }

    // Modal schließen
    handleCloseModal() {
        this.hideModal();
    }

    // Keyboard-Events
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isModalVisible()) {
            this.hideModal();
        }
    }

    // Window-Click für Modal schließen
    handleWindowClick(e) {
        if (e.target === this.elements.modal) {
            this.hideModal();
        }
    }

    // API-Request senden
    async sendApiRequest(question, context = null) {
        const requestBody = { question };
        
        if (context && context.length > 0) {
            requestBody.context = context;
        }

        const response = await fetch('/api/ask-gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Loading-State setzen
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        if (isLoading) {
            stopPlaceholderAnimation();
            this.elements.aiStatus.innerText = "Einen Moment, Evita gleicht gerade ihre Bits und Bytes ab...";
            this.elements.aiStatus.classList.add('thinking');
            this.elements.aiQuestionInput.disabled = true;
            this.elements.submitButton.disabled = true;
        } else {
            this.elements.aiQuestionInput.value = '';
            this.elements.aiQuestionInput.disabled = false;
            this.elements.submitButton.disabled = false;
            this.elements.aiStatus.classList.remove('thinking');
            
            if (!this.elements.aiStatus.innerText.startsWith('Fehler')) {
                this.elements.aiStatus.innerText = '';
            }
            
            startPlaceholderAnimation();
        }
    }

    // Erste Antwort anzeigen
    showInitialResponse(answer) {
        this.elements.responseContent.innerHTML = answer;
        this.elements.modal.style.display = 'block';
        this.elements.initialResponseContainer.style.display = 'block';
        this.elements.chatContainer.style.display = 'none';
        this.elements.closeModalButton.style.display = 'none';
    }

    // Fehler anzeigen
    showError(message) {
        this.elements.aiStatus.innerText = message;
    }

    // Modal ausblenden
    hideModal() {
        this.elements.modal.style.display = 'none';
        this.resetChatHistory();
    }

    // Prüfen ob Modal sichtbar ist
    isModalVisible() {
        return this.elements.modal.style.display === 'block';
    }

    // Chat-Verlauf zurücksetzen
    resetChatHistory() {
        this.chatHistory = [];
        this.elements.chatHistory.innerHTML = '';
    }

    // Nachricht zum Chat hinzufügen
    addMessageToChat(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = role === 'user' ? 'user-message' : 'ai-message';
        
        if (typeof content === 'string') {
            messageElement.innerHTML = content;
        } else {
            messageElement.textContent = content;
        }
        
        this.elements.chatHistory.appendChild(messageElement);
        this.scrollChatToBottom();
        
        // Zur internen Historie hinzufügen
        this.chatHistory.push({
            role: role === 'user' ? 'user' : 'assistant',
            content: messageElement.textContent.trim()
        });
        
        return messageElement;
    }

    // Loading-Nachricht hinzufügen
    addLoadingMessage() {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'ai-message thinking';
        loadingElement.textContent = 'Evita denkt nach...';
        
        const loadingId = Date.now().toString();
        loadingElement.dataset.loadingId = loadingId;
        
        this.elements.chatHistory.appendChild(loadingElement);
        this.scrollChatToBottom();
        
        return loadingId;
    }

    // Loading-Nachricht ersetzen
    replaceLoadingMessage(loadingId, content, isError = false) {
        const loadingElement = this.elements.chatHistory.querySelector(`[data-loading-id="${loadingId}"]`);
        
        if (loadingElement) {
            loadingElement.innerHTML = content;
            loadingElement.classList.remove('thinking');
            
            if (isError) {
                loadingElement.classList.add('error-message');
            }
            
            // Zur internen Historie hinzufügen
            this.chatHistory.push({
                role: 'assistant',
                content: loadingElement.textContent.trim()
            });
        }
        
        this.scrollChatToBottom();
    }

    // Chat nach unten scrollen
    scrollChatToBottom() {
        this.elements.chatHistory.scrollTop = this.elements.chatHistory.scrollHeight;
    }

    // Chat-Kontext für API erstellen
    getChatContext() {
        // Nur die letzten 10 Nachrichten senden, um API-Limits zu respektieren
        return this.chatHistory.slice(-10);
    }

    // Cleanup-Methode
    destroy() {
        this.removeEventListeners();
        this.resetChatHistory();
        this.isInitialized = false;
        console.log('AiFormManager wurde bereinigt');
    }
}

// Globale Instanz erstellen
let aiFormManagerInstance = null;

// Export-Funktion für Kompatibilität
export function initAiForm() {
    // Vorherige Instanz bereinigen falls vorhanden
    if (aiFormManagerInstance) {
        aiFormManagerInstance.destroy();
    }
    
    // Neue Instanz erstellen und initialisieren
    aiFormManagerInstance = new AiFormManager();
    aiFormManagerInstance.init();
}

// Cleanup-Funktion exportieren
export function destroyAiForm() {
    if (aiFormManagerInstance) {
        aiFormManagerInstance.destroy();
        aiFormManagerInstance = null;
    }
}

// Bei Seitenwechsel automatisch bereinigen
window.addEventListener('beforeunload', destroyAiForm);
