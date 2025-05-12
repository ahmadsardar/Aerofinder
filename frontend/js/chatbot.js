// js/chatbot.js
$(document).ready(() => {
    let isProcessing = false;

    const $chatForm = $('#chatForm');
    const $userInput = $('#userInput');
    const $chatMessages = $('#chatMessages');

    // Prevent reload on Enter
    $chatForm.on('submit', e => {
        e.preventDefault();
        if (!isProcessing) handleMessage();
    });
    $userInput.on('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            $chatForm.submit();
        }
    });

    async function handleMessage() {
        const text = $userInput.val().trim();
        if (!text) return;

        isProcessing = true;
        $userInput.val('');
        addMessage(text, true);
        showTypingIndicator();

        try {
            // Call our proxy instead of Google directly
            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || resp.statusText);
            }
            const { reply } = await resp.json();
            removeTypingIndicator();
            addMessage(reply, false);

        } catch (err) {
            console.error('Chat error:', err);
            removeTypingIndicator();
            addMessage('Error contacting AI. See console.', false);
        } finally {
            isProcessing = false;
        }
    }

    // ─── UI Helpers ────────────────────────────────────────────────
    function addMessage(text, isUser) {
        const cls = isUser ? 'user' : 'bot';
        const $msg = $(`
      <div class="message ${cls}">
        <div class="bubble">${text}</div>
      </div>
    `);
        $chatMessages.append($msg);
        scrollToBottom();
    }
    function showTypingIndicator() {
        const $indicator = $(`
      <div id="typingIndicator" class="message bot">
        <div class="bubble">
          <span class="typing-indicator"></span>
          <span class="typing-indicator"></span>
          <span class="typing-indicator"></span>
        </div>
      </div>
    `);
        $chatMessages.append($indicator);
        scrollToBottom();
    }
    function removeTypingIndicator() {
        $('#typingIndicator').remove();
    }
    function scrollToBottom() {
        $chatMessages.stop().animate(
            { scrollTop: $chatMessages[0].scrollHeight },
            200
        );
    }
});
