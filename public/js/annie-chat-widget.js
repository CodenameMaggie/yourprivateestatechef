// ============================================================================
// ANNIE CHAT WIDGET
// Support chat powered by ANNIE (CSO) for YPEC website
// ============================================================================

(function() {
  'use strict';

  const ANNIE_CONFIG = {
    apiEndpoint: '/api/ypec/concierge',
    botName: 'ANNIE',
    companyName: 'Your Private Estate Chef',
    greeting: "Welcome to Your Private Estate Chef. I'm ANNIE, and I'm here to help you explore how our exceptional private chefs can serve your household.",
    position: 'bottom-right', // bottom-right, bottom-left
    primaryColor: '#d4af37',
    accentColor: '#c9a237',
    darkColor: '#1a1a2e'
  };

  // Create chat widget HTML
  const createChatWidget = () => {
    const widgetHTML = `
      <div id="annie-chat-widget" class="annie-chat-widget">
        <!-- Chat Button -->
        <button id="annie-chat-button" class="annie-chat-button" aria-label="Open chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="annie-notification-dot" style="display: none;"></span>
        </button>

        <!-- Chat Window -->
        <div id="annie-chat-window" class="annie-chat-window" style="display: none;">
          <!-- Header -->
          <div class="annie-chat-header">
            <div class="annie-header-info">
              <div class="annie-avatar">A</div>
              <div>
                <div class="annie-bot-name">${ANNIE_CONFIG.botName}</div>
                <div class="annie-bot-status">
                  <span class="annie-status-dot"></span>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button id="annie-close-button" class="annie-close-button" aria-label="Close chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Messages Container -->
          <div id="annie-messages" class="annie-messages">
            <!-- Messages will be inserted here -->
          </div>

          <!-- Quick Actions -->
          <div id="annie-quick-actions" class="annie-quick-actions">
            <button class="annie-quick-action" data-message="How much does a personal chef cost?">
              Pricing
            </button>
            <button class="annie-quick-action" data-message="What services do you offer?">
              Services
            </button>
            <button class="annie-quick-action" data-message="How do I get started?">
              Get Started
            </button>
          </div>

          <!-- Input Area -->
          <div class="annie-input-container">
            <input
              type="text"
              id="annie-message-input"
              class="annie-message-input"
              placeholder="Ask about our services..."
              autocomplete="off"
            />
            <button id="annie-send-button" class="annie-send-button" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          <!-- Powered By -->
          <div class="annie-powered-by">
            Powered by Forbes Command AI
          </div>
        </div>
      </div>
    `;

    // Insert widget into page
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  };

  // Create styles
  const createStyles = () => {
    const styles = `
      <style>
        .annie-chat-widget {
          position: fixed;
          ${ANNIE_CONFIG.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
          bottom: 20px;
          z-index: 10000;
          font-family: 'Cormorant', serif;
        }

        .annie-chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${ANNIE_CONFIG.primaryColor} 0%, ${ANNIE_CONFIG.accentColor} 100%);
          border: none;
          color: ${ANNIE_CONFIG.darkColor};
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .annie-chat-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        .annie-notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 12px;
          height: 12px;
          background: #ff4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .annie-chat-window {
          position: absolute;
          bottom: 80px;
          ${ANNIE_CONFIG.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
          width: 380px;
          height: 600px;
          max-height: 80vh;
          background: rgba(26, 26, 46, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .annie-chat-header {
          background: linear-gradient(135deg, ${ANNIE_CONFIG.primaryColor} 0%, ${ANNIE_CONFIG.accentColor} 100%);
          color: ${ANNIE_CONFIG.darkColor};
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .annie-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .annie-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(26, 26, 46, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }

        .annie-bot-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 2px;
        }

        .annie-bot-status {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.9;
        }

        .annie-status-dot {
          width: 8px;
          height: 8px;
          background: #44ff44;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .annie-close-button {
          background: none;
          border: none;
          color: ${ANNIE_CONFIG.darkColor};
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .annie-close-button:hover {
          background: rgba(26, 26, 46, 0.2);
        }

        .annie-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .annie-message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .annie-message.bot {
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #f5f5f5;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .annie-message.user {
          background: linear-gradient(135deg, ${ANNIE_CONFIG.primaryColor} 0%, ${ANNIE_CONFIG.accentColor} 100%);
          color: ${ANNIE_CONFIG.darkColor};
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .annie-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          border-bottom-left-radius: 4px;
          width: fit-content;
        }

        .annie-typing span {
          width: 8px;
          height: 8px;
          background: ${ANNIE_CONFIG.primaryColor};
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .annie-typing span:nth-child(2) { animation-delay: 0.2s; }
        .annie-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .annie-quick-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
        }

        .annie-quick-action {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: ${ANNIE_CONFIG.primaryColor};
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .annie-quick-action:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateY(-2px);
        }

        .annie-input-container {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
        }

        .annie-message-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #f5f5f5;
          padding: 12px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-family: 'Cormorant', serif;
          transition: all 0.2s ease;
        }

        .annie-message-input:focus {
          outline: none;
          border-color: ${ANNIE_CONFIG.primaryColor};
          background: rgba(255, 255, 255, 0.12);
        }

        .annie-message-input::placeholder {
          color: rgba(245, 245, 245, 0.5);
        }

        .annie-send-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${ANNIE_CONFIG.primaryColor} 0%, ${ANNIE_CONFIG.accentColor} 100%);
          border: none;
          color: ${ANNIE_CONFIG.darkColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .annie-send-button:hover {
          transform: scale(1.05);
        }

        .annie-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .annie-powered-by {
          text-align: center;
          font-size: 11px;
          color: rgba(245, 245, 245, 0.5);
          padding: 8px;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        @media (max-width: 480px) {
          .annie-chat-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 100px);
            max-height: none;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  };

  // Initialize chat
  const initChat = () => {
    const chatButton = document.getElementById('annie-chat-button');
    const chatWindow = document.getElementById('annie-chat-window');
    const closeButton = document.getElementById('annie-close-button');
    const sendButton = document.getElementById('annie-send-button');
    const messageInput = document.getElementById('annie-message-input');
    const messagesContainer = document.getElementById('annie-messages');
    const quickActions = document.querySelectorAll('.annie-quick-action');

    let chatOpened = false;

    // Toggle chat window
    chatButton.addEventListener('click', () => {
      chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';

      if (!chatOpened) {
        // First time opening - show greeting
        addMessage(ANNIE_CONFIG.greeting, 'bot');
        chatOpened = true;
      }
    });

    closeButton.addEventListener('click', () => {
      chatWindow.style.display = 'none';
    });

    // Send message
    const sendMessage = async () => {
      const message = messageInput.value.trim();
      if (!message) return;

      // Add user message
      addMessage(message, 'user');
      messageInput.value = '';

      // Show typing indicator
      showTyping();

      // Send to ANNIE
      try {
        const response = await fetch(ANNIE_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'chat',
            data: {
              message: message,
              session_id: getSessionId()
            }
          })
        });

        const data = await response.json();

        hideTyping();

        // Add bot response
        if (data.response) {
          addMessage(data.response, 'bot');
        } else {
          addMessage("I'd be happy to help you. Could you please contact us at concierge@yourprivateestatechef.com or call us during business hours? A member of our team will assist you personally.", 'bot');
        }
      } catch (error) {
        console.error('Chat error:', error);
        hideTyping();
        addMessage("I apologize, but I'm having trouble connecting right now. Please email us at concierge@yourprivateestatechef.com and we'll respond within 24 hours.", 'bot');
      }
    };

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Quick actions
    quickActions.forEach(button => {
      button.addEventListener('click', () => {
        messageInput.value = button.dataset.message;
        sendMessage();
      });
    });
  };

  // Add message to chat
  const addMessage = (text, sender) => {
    const messagesContainer = document.getElementById('annie-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `annie-message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // Show typing indicator
  const showTyping = () => {
    const messagesContainer = document.getElementById('annie-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'annie-typing';
    typingDiv.id = 'annie-typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // Hide typing indicator
  const hideTyping = () => {
    const typingIndicator = document.getElementById('annie-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  };

  // Get/create session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('annie-session-id');
    if (!sessionId) {
      sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2);
      sessionStorage.setItem('annie-session-id', sessionId);
    }
    return sessionId;
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createStyles();
      createChatWidget();
      initChat();
    });
  } else {
    createStyles();
    createChatWidget();
    initChat();
  }

})();
