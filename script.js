const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Send message on Enter (Shift+Enter for new line)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        if (data.error) {
            addMessage('Sorry, I encountered an error: ' + data.error, 'bot');
        } else {
            addMessage(data.response, 'bot');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('Sorry, I encountered an error connecting to the server.', 'bot');
    }
    
    // Re-enable send button
    sendBtn.disabled = false;
    userInput.focus();
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'bot') {
        const strong = document.createElement('strong');
        strong.textContent = '📚 Digital Librarian Bot';
        contentDiv.appendChild(strong);
        
        const p = document.createElement('p');
        p.textContent = text;
        contentDiv.appendChild(p);
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.id = 'typing-indicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    contentDiv.appendChild(typingDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return 'typing-indicator';
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

async function clearChat() {
    if (!confirm('Are you sure you want to clear the chat history?')) {
        return;
    }
    
    try {
        await fetch('/clear', {
            method: 'POST',
        });
        
        // Clear chat box except welcome message
        chatBox.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <strong>📚 Digital Librarian Bot</strong>
                    <p>👋 Hello! I'm your Digital Librarian Bot. You can ask me about book summaries, authors, characters, reviews, genres, or recommendations!</p>
                </div>
            </div>
        `;
    } catch (error) {
        alert('Error clearing chat history');
    }
}

function askQuestion(question) {
    userInput.value = question;
    sendMessage();
}

// Focus on input when page loads
window.addEventListener('load', () => {
    userInput.focus();
});
