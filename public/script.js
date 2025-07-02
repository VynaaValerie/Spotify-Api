document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginContainer = document.getElementById('loginContainer');
  const chatContainer = document.getElementById('chatContainer');
  const usernameInput = document.getElementById('usernameInput');
  const roomIdInput = document.getElementById('roomIdInput');
  const joinButton = document.getElementById('joinButton');
  const messagesContainer = document.getElementById('messagesContainer');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const roomTitle = document.getElementById('roomTitle');
  const userCount = document.getElementById('userCount');
  const typingIndicator = document.getElementById('typingIndicator');

  // Socket.io connection
  const socket = io();
  let currentUser = '';
  let currentRoom = '';
  let isTyping = false;
  let typingTimeout;

  // Join chat room
  joinButton.addEventListener('click', joinChat);
  roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
  });

  function joinChat() {
    const username = usernameInput.value.trim();
    const roomId = roomIdInput.value.trim();
    
    if (!username || !roomId) {
      alert('Please enter both username and room ID');
      return;
    }
    
    currentUser = username;
    currentRoom = roomId;
    
    socket.emit('joinRoom', { roomId, username });
    
    // Update UI
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    roomTitle.textContent = `Room: ${roomId}`;
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }

  // Send message
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentRoom || !currentUser) return;
    
    socket.emit('sendMessage', {
      roomId: currentRoom,
      senderName: currentUser,
      message: message
    });
    
    messageInput.value = '';
    resetTyping();
  }

  // Typing indicator
  messageInput.addEventListener('input', () => {
    if (!isTyping) {
      isTyping = true;
      socket.emit('typing', { 
        roomId: currentRoom, 
        username: currentUser 
      });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(resetTyping, 2000);
  });

  function resetTyping() {
    isTyping = false;
    socket.emit('typing', { 
      roomId: currentRoom, 
      username: null 
    });
  }

  // Socket.io event listeners
  socket.on('roomData', ({ messages, users }) => {
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Add welcome message
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'welcome-message';
    welcomeMsg.textContent = `Welcome to ${currentRoom}, ${currentUser}!`;
    messagesContainer.appendChild(welcomeMsg);
    
    // Add previous messages
    messages.forEach(message => {
      addMessage(message);
    });
    
    // Update user count
    updateUserCount(users.length);
  });

  socket.on('newMessage', (message) => {
    addMessage(message);
    scrollToBottom();
  });

  socket.on('userJoined', ({ username, timestamp }) => {
    const joinMsg = document.createElement('div');
    joinMsg.className = 'system-message';
    joinMsg.textContent = `${username} joined the chat`;
    messagesContainer.appendChild(joinMsg);
    scrollToBottom();
  });

  socket.on('userLeft', ({ username, timestamp }) => {
    const leaveMsg = document.createElement('div');
    leaveMsg.className = 'system-message';
    leaveMsg.textContent = `${username} left the chat`;
    messagesContainer.appendChild(leaveMsg);
    scrollToBottom();
  });

  socket.on('userTyping', (username) => {
    if (username && username !== currentUser) {
      typingIndicator.textContent = `${username} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  });

  socket.on('usersInRoom', (count) => {
    updateUserCount(count);
  });

  // Helper functions
  function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderName === currentUser ? 'sent' : 'received'}`;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'message-info';
    infoDiv.textContent = `${message.senderName} • ${new Date(message.timestamp).toLocaleTimeString()}`;
    
    const textDiv = document.createElement('div');
    textDiv.textContent = message.message;
    
    messageDiv.appendChild(infoDiv);
    messageDiv.appendChild(textDiv);
    messagesContainer.appendChild(messageDiv);
  }

  function updateUserCount(count) {
    userCount.textContent = `${count} ${count === 1 ? 'user' : 'users'}`;
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Initial scroll to bottom
  scrollToBottom();
});