// Simple chatbot implementation
$(document).ready(function () {
    const $chatMessages = $('#chat-messages');
    const $userInput = $('#user-input');
    const $sendButton = $('#send-button');
    const $chatForm = $('#chat-form');
    let isProcessing = false;

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageHtml = `
            <div class="message ${isUser ? 'user-message' : 'bot-message'}">
                <div class="message-content">${message}</div>
            </div>
        `;
        $chatMessages.append(messageHtml);
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingHtml = `
            <div class="message bot-message" id="typing-indicator">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        $chatMessages.append(typingHtml);
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        $('#typing-indicator').remove();
    }

    // Function to handle sending message
    async function handleMessage() {
        const message = $userInput.val().trim();

        if (!message || isProcessing) {
            return;
        }

        isProcessing = true;

        // Disable input and button while processing
        $userInput.prop('disabled', true);
        $sendButton.prop('disabled', true);

        // Clear input and reset height
        $userInput.val('');
        $userInput.css('height', 'auto');

        // Add user message
        addMessage(message, true);

        // Show typing indicator
        showTypingIndicator();

        try {
            // Send message to backend
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator();

            if (!response.ok) {
                console.error('API Error:', data);
                if (response.status === 503) {
                    // Model is still loading
                    addMessage("I'm still getting ready. Please try again in a few seconds.");
                } else {
                    addMessage("I'm having trouble understanding right now. Please try again.");
                }
                return;
            }

            // Add bot response to chat
            if (data.error) {
                console.error('Bot Error:', data.error);
                addMessage("I apologize, but I'm having trouble right now. Please try again in a moment.");
            } else {
                const botResponse = data.response.trim();
                if (botResponse) {
                    addMessage(botResponse);
                } else {
                    addMessage("I understand. How can I help you with your travel plans?");
                }
            }
        } catch (error) {
            console.error('Network Error:', error);
            removeTypingIndicator();
            addMessage("Sorry, I'm having trouble connecting. Please check your internet connection and try again.");
        } finally {
            // Re-enable input and button
            $userInput.prop('disabled', false);
            $sendButton.prop('disabled', false);
            $userInput.focus();
            isProcessing = false;
        }
    }

    // Event Handlers
    $chatForm.on('submit', function (e) {
        e.preventDefault();
        handleMessage();
    });

    $sendButton.on('click', function () {
        handleMessage();
    });

    $userInput.on('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage();
        }
    });

    // Auto-resize textarea
    $userInput.on('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
}); 