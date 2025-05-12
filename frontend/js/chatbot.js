// Firebase and Amadeus integration for chatbot

// 1. Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyDW2bIfUGjKSWFmsazAxgbEv8kJwvmOPkI",
    authDomain: "aerofinder-d6590.firebaseapp.com",
    projectId: "aerofinder-d6590",
    storageBucket: "aerofinder-d6590.firebasestorage.app",
    messagingSenderId: "504288222048",
    appId: "1:504288222048:web:921c78ca22b5f054d85c05",
    measurementId: "G-G49F97JRVY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Handle question submission
$(document).ready(function () {
    $(".chatbot-form-card form").on("submit", function (e) {
        e.preventDefault();
        const question = $("#question").val().trim();
        if (!question) return;
        // Save to Firestore
        db.collection("queries").add({
            question: question,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            // Optionally show a confirmation or clear the form
            $("#question").val("");
            // Show the custom response
            showResponse('custom');
        }).catch((error) => {
            alert("Error saving your question. Please try again.");
            console.error(error);
        });
    });
});

// 3. Amadeus API integration will be added here (OAuth2, search, etc.)
// ...

// Chatbot functionality
$(document).ready(function() {
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

    // Mock responses for demo
    const mockResponses = [
        "I can help you find flights to your destination. Where would you like to go?",
        "Let me check the available flights for you. What's your preferred travel date?",
        "I found several options for your travel plans. Would you like to see them?",
        "I can help you with booking and flight information. What specific details do you need?",
        "Here are some travel tips for your destination. Would you like to know more?"
    ];

    function getMockResponse() {
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }

    // Function to handle sending message
    function handleMessage() {
        const message = $userInput.val().trim();
        
        if (!message || isProcessing) {
            return;
        }

        isProcessing = true;

        // Disable input and button
        $userInput.prop('disabled', true);
        $sendButton.prop('disabled', true);

        // Clear input and reset height
        $userInput.val('');
        $userInput.css('height', 'auto');

        // Add user message
        addMessage(message, true);

        // Show typing indicator
        showTypingIndicator();

        // Simulate response delay
        setTimeout(() => {
            try {
                const botResponse = getMockResponse();
                removeTypingIndicator();
                addMessage(botResponse);
            } catch (error) {
                console.error('Error:', error);
                removeTypingIndicator();
                addMessage('Sorry, I encountered an error. Please try again.');
            } finally {
                $userInput.prop('disabled', false);
                $sendButton.prop('disabled', false);
                $userInput.focus();
                isProcessing = false;
            }
        }, 1000);
    }

    // Event Handlers
    $chatForm.on('submit', function(e) {
        e.preventDefault();
        handleMessage();
    });

    $sendButton.on('click', function() {
        handleMessage();
    });

    $userInput.on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage();
        }
    });

    // Auto-resize textarea
    $userInput.on('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // Load previous messages
    db.collection("chat_messages")
        .orderBy("timestamp", "asc")
        .limit(50)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                addMessage(data.message, data.isUser);
            });
        })
        .catch((error) => {
            console.error("Error loading messages:", error);
        });
}); 